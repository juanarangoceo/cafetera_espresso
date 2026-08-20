'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdminIdentity } from '@/lib/admin-auth';
import { createServiceClient } from '@/utils/supabase/service';
import { generateSiteKey } from '@/lib/site-keys';

/**
 * Alta y administración de clientes de la plataforma.
 *
 * A diferencia del resto del panel, estas acciones **sí** usan la clave de
 * servicio, y no por comodidad: crear una cuenta en `auth.users` y escribir en
 * `platform_admins` o `site_members` son operaciones que ninguna sesión del
 * navegador debe poder hacer. Si el panel pudiera darse permisos a sí mismo,
 * una sesión robada bastaría para fabricar administradores.
 *
 * El precio de usarla es que el RLS deja de protegernos aquí, así que cada
 * acción empieza comprobando que quien llama es de plataforma.
 */

export type PlatformResult = { ok: boolean; message?: string; secret?: string };

const SITE_LOGO_BUCKET = 'site-logos';
const MAX_LOGO_BYTES = 750 * 1024;
const LOGO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

function getLogoFile(formData: FormData): File | null {
  const value = formData.get('logo');
  return value instanceof File && value.size > 0 ? value : null;
}

function validateLogo(file: File | null): PlatformResult | null {
  if (!file) return null;
  if (!LOGO_EXTENSIONS[file.type]) {
    return { ok: false, message: 'El logo debe ser PNG, JPG o WebP.' };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: 'El logo no puede pesar más de 750 KB.' };
  }
  return null;
}

async function ensureLogoBucket(service: ServiceClient): Promise<string | null> {
  const { data, error } = await service.storage.getBucket(SITE_LOGO_BUCKET);
  if (data) return null;

  const missing = error && /not found|does not exist/i.test(error.message);
  if (!missing) {
    console.error('❌ No se pudo comprobar el bucket de logos:', error);
    return 'No se pudo preparar el almacenamiento del logo.';
  }

  const { error: createError } = await service.storage.createBucket(SITE_LOGO_BUCKET, {
    public: true,
    allowedMimeTypes: Object.keys(LOGO_EXTENSIONS),
    fileSizeLimit: '1MB',
  });

  if (createError && !/already exists/i.test(createError.message)) {
    console.error('❌ No se pudo crear el bucket de logos:', createError);
    return 'No se pudo preparar el almacenamiento del logo.';
  }
  return null;
}

async function uploadSiteLogo(
  service: ServiceClient,
  siteId: string,
  file: File,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const bucketError = await ensureLogoBucket(service);
  if (bucketError) return { error: bucketError };

  const extension = LOGO_EXTENSIONS[file.type];
  const path = `${siteId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await service.storage.from(SITE_LOGO_BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    console.error('❌ No se pudo subir el logo:', error);
    return { error: 'No se pudo subir el logo.' };
  }

  const { data } = service.storage.from(SITE_LOGO_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

function logoPathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${SITE_LOGO_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function guard(): Promise<{ email: string } | { error: PlatformResult }> {
  const identity = await getAdminIdentity();

  if (!identity || identity.role !== 'platform') {
    // Mismo mensaje para "no hay sesión" y "la sesión no es de plataforma": un
    // cliente que trastee con la ruta no tiene por qué averiguar cuál de las
    // dos cosas falló.
    return { error: { ok: false, message: 'Esta sección es solo de la plataforma.' } };
  }

  return { email: identity.email };
}

const slugSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/,
    'El identificador va en minúsculas, sin espacios ni acentos. Ejemplo: tienda-del-cliente',
  );

const siteSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, 'El nombre del sitio es muy corto').max(120),
  clientName: z.string().trim().min(2, 'El nombre del cliente es muy corto').max(160),
  legalName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().email('Correo de contacto inválido').optional().or(z.literal('')),
  contactPhone: z.string().trim().regex(/^\d{10,15}$/, 'Celular inválido').optional().or(z.literal('')),
  productName: z.string().trim().min(2, 'El nombre del producto es muy corto').max(160),
  price: z.coerce.number().int().positive('El precio debe ser mayor que cero'),
  monthlyFee: z.coerce.number().int().min(0).optional(),
  primaryDomain: z
    .string()
    .trim()
    .regex(/^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?\.[a-z]{2,63}$/, 'Dominio inválido')
    .optional()
    .or(z.literal('')),
  repositoryUrl: z.string().trim().url('URL del repositorio inválida').max(500).optional().or(z.literal('')),
  vercelProject: z.string().trim().max(160).optional(),
  productionUrl: z.string().trim().url('URL de producción inválida').max(500).optional().or(z.literal('')),
});

/**
 * Da de alta un cliente completo: su sitio, sus canales, su producto y su
 * cuenta.
 *
 * Las cuatro filas van juntas porque un sitio sin producto no puede vender —el
 * guardián de precio rechaza cualquier pedido— y un sitio sin canales no puede
 * pintar la landing. Dejar el alta a medias produce un cliente que parece
 * creado y no funciona.
 */
export async function createClientSite(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const parsed = siteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  }

  const input = parsed.data;
  const logo = getLogoFile(formData);
  const logoError = validateLogo(logo);
  if (logoError) return logoError;

  const { data: client, error: clientError } = await service
    .from('clients')
    .insert({
      name: input.clientName,
      legal_name: input.legalName || null,
      contact_name: input.contactName || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      monthly_fee: input.monthlyFee ?? null,
    })
    .select('id')
    .single();

  if (clientError || !client) {
    console.error('❌ No se pudo crear el cliente:', clientError);
    return { ok: false, message: 'No se pudo crear la ficha del cliente.' };
  }

  const { data: site, error: siteError } = await service
    .from('sites')
    .insert({
      client_id: client.id,
      slug: input.slug,
      name: input.name,
      primary_domain: input.primaryDomain || null,
      repository_url: input.repositoryUrl || null,
      vercel_project: input.vercelProject || null,
      production_url: input.productionUrl || null,
    })
    .select('id')
    .single();

  if (siteError) {
    await service.from('clients').delete().eq('id', client.id);
    if (siteError.code === '23505') {
      return { ok: false, message: `Ya existe un sitio con el identificador "${input.slug}".` };
    }
    console.error('❌ No se pudo crear el sitio:', siteError);
    return { ok: false, message: 'No se pudo crear el sitio.' };
  }

  // A partir de aquí, si algo falla se deshace el sitio: es preferible no dejar
  // nada a dejar un cliente a medio crear que falle al primer pedido.
  let uploadedLogoPath: string | null = null;
  const rollback = async (reason: string) => {
    if (uploadedLogoPath) {
      await service.storage.from(SITE_LOGO_BUCKET).remove([uploadedLogoPath]);
    }
    await service.from('sites').delete().eq('id', site.id);
    await service.from('clients').delete().eq('id', client.id);
    console.error(`❌ Alta revertida (${reason}).`);
  };

  if (logo) {
    const uploaded = await uploadSiteLogo(service, site.id, logo);
    if ('error' in uploaded) {
      await rollback('logo');
      return { ok: false, message: uploaded.error };
    }
    uploadedLogoPath = uploaded.path;

    const { error: logoUpdateError } = await service
      .from('sites')
      .update({ logo_url: uploaded.publicUrl })
      .eq('id', site.id);
    if (logoUpdateError) {
      await rollback('logo del sitio');
      return { ok: false, message: 'El logo se subió, pero no se pudo asociar al cliente.' };
    }
  }

  const { error: channelError } = await service
    .from('site_channels')
    .insert({ site_id: site.id });
  if (channelError) {
    await rollback('canales');
    return { ok: false, message: 'No se pudieron crear los canales del sitio.' };
  }

  const { error: productError } = await service.from('site_products').insert({
    site_id: site.id,
    name: input.productName,
    price: input.price,
  });
  if (productError) {
    await rollback('producto');
    return { ok: false, message: 'No se pudo crear el producto del sitio.' };
  }

  revalidatePath('/platform');
  return { ok: true, message: `"${input.name}" creado. Ya puedes crearle usuario y emitir su llave.` };
}

const brandingSchema = z.object({
  siteId: z.string().uuid('Sitio inválido'),
  name: z.string().trim().min(2, 'El nombre del sitio es muy corto').max(120),
  primaryDomain: z.string().trim().max(253).optional(),
  repositoryUrl: z.string().trim().url('URL del repositorio inválida').max(500).optional().or(z.literal('')),
  vercelProject: z.string().trim().max(160).optional(),
  productionUrl: z.string().trim().url('URL de producción inválida').max(500).optional().or(z.literal('')),
  integrationNotes: z.string().trim().max(4000).optional(),
});

/** Actualiza la identidad que verá el cliente en su dashboard. */
export async function updateSiteBranding(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const parsed = brandingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const logo = getLogoFile(formData);
  const logoError = validateLogo(logo);
  if (logoError) return logoError;

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };

  const { siteId, name, primaryDomain, repositoryUrl, vercelProject, productionUrl, integrationNotes } = parsed.data;
  const { data: current, error: currentError } = await service
    .from('sites')
    .select('logo_url')
    .eq('id', siteId)
    .single();
  if (currentError || !current) return { ok: false, message: 'No encontramos ese sitio.' };

  let newLogoPath: string | null = null;
  let nextLogoUrl = current.logo_url;
  if (logo) {
    const uploaded = await uploadSiteLogo(service, siteId, logo);
    if ('error' in uploaded) return { ok: false, message: uploaded.error };
    newLogoPath = uploaded.path;
    nextLogoUrl = uploaded.publicUrl;
  } else if (formData.get('removeLogo') === 'true') {
    nextLogoUrl = null;
  }

  const { data, error } = await service
    .from('sites')
    .update({
      name,
      logo_url: nextLogoUrl,
      primary_domain: primaryDomain || null,
      repository_url: repositoryUrl || null,
      vercel_project: vercelProject || null,
      production_url: productionUrl || null,
      integration_notes: integrationNotes || null,
    })
    .eq('id', siteId)
    .select('id');

  if (error || !data?.length) {
    if (newLogoPath) await service.storage.from(SITE_LOGO_BUCKET).remove([newLogoPath]);
    console.error('❌ No se pudo actualizar la marca:', error);
    return { ok: false, message: 'No se pudo guardar la marca.' };
  }

  const oldLogoPath = logoPathFromPublicUrl(current.logo_url);
  if (oldLogoPath && current.logo_url !== nextLogoUrl) {
    const { error: removeError } = await service.storage.from(SITE_LOGO_BUCKET).remove([oldLogoPath]);
    if (removeError) console.error('⚠️ La marca se guardó, pero no se pudo retirar el logo anterior:', removeError);
  }

  revalidatePath('/platform');
  return { ok: true, message: 'Nombre y logo actualizados en el dashboard del cliente.' };
}

const memberSchema = z.object({
  siteId: z.string().uuid('Sitio inválido'),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  displayName: z.string().trim().max(120).optional(),
});

/**
 * Crea el usuario del cliente y lo autoriza en su sitio.
 *
 * `email_confirm: true` es el punto: `private.verified_email()` exige
 * `email_confirmed_at`, así que una cuenta sin confirmar entra al panel y no ve
 * absolutamente nada, sin ningún mensaje que explique por qué.
 */
export async function createSiteMember(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  }

  const { siteId, email, password, displayName } = parsed.data;

  const { error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const alreadyRegistered =
      createError.status === 422 || /already/i.test(createError.message ?? '');
    if (!alreadyRegistered) {
      console.error('❌ No se pudo crear la cuenta del cliente:', createError);
      return { ok: false, message: 'No se pudo crear la cuenta.' };
    }
    // La cuenta ya existía. No se toca su contraseña desde aquí: cambiarla en
    // silencio dejaría fuera a alguien que ya estaba usando el panel.
  }

  const { error: memberError } = await service.from('site_members').upsert(
    { site_id: siteId, email, role: 'owner', display_name: displayName || null },
    { onConflict: 'site_id,email' },
  );

  if (memberError) {
    console.error('❌ No se pudo autorizar al cliente:', memberError);
    return { ok: false, message: 'La cuenta existe pero no se pudo autorizar en el sitio.' };
  }

  revalidatePath('/platform');
  return {
    ok: true,
    message: createError
      ? `${email} ya tenía cuenta y quedó autorizado en este sitio, conservando su contraseña.`
      : `${email} puede entrar en /admin/login con la contraseña que le diste.`,
  };
}

/**
 * Emite una llave de ingesta. El valor se devuelve una sola vez y no vuelve a
 * estar disponible: de la base solo sale su hash.
 */
export async function issueSiteKey(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const siteId = String(formData.get('siteId') ?? '');
  const label = String(formData.get('label') ?? '').trim();

  if (!z.string().uuid().safeParse(siteId).success) {
    return { ok: false, message: 'Sitio inválido.' };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  }

  const generated = generateSiteKey();

  const { error } = await service.from('site_api_keys').insert({
    site_id: siteId,
    label: label || null,
    key_hash: generated.keyHash,
    prefix: generated.prefix,
    created_by: allowed.email,
  });

  if (error) {
    console.error('❌ No se pudo emitir la llave:', error);
    return { ok: false, message: 'No se pudo emitir la llave.' };
  }

  revalidatePath('/platform');
  return {
    ok: true,
    message: 'Cópiala ahora: no se puede volver a mostrar.',
    secret: generated.key,
  };
}

export async function revokeSiteKey(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const keyId = String(formData.get('keyId') ?? '');
  if (!z.string().uuid().safeParse(keyId).success) {
    return { ok: false, message: 'Llave inválida.' };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  }

  const { data, error } = await service
    .from('site_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .is('revoked_at', null)
    .select('id');

  if (error) {
    console.error('❌ No se pudo revocar la llave:', error);
    return { ok: false, message: 'No se pudo revocar la llave.' };
  }

  if (!data?.length) {
    return { ok: false, message: 'Esa llave no existe o ya estaba revocada.' };
  }

  revalidatePath('/platform');
  return { ok: true, message: 'Llave revocada. La landing que la use deja de vender ahora mismo.' };
}

/**
 * Conecta o desconecta la landing de un cliente.
 *
 * Desconectar hace dos cosas a la vez, y por eso es una sola palanca: la API
 * deja de aceptar pedidos de ese sitio —`resolveSiteFromKey` comprueba
 * `is_active`— y la landing, al releer su configuración, esconde el checkout y
 * avisa. No hace falta desplegar nada ni entrar al proyecto del cliente.
 *
 * La landing de un cliente vive en otro despliegue, así que se entera al
 * revalidar su configuración, no al instante. Está documentado en PLATFORM.md.
 */
export async function toggleSiteActive(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const siteId = String(formData.get('siteId') ?? '');
  const next = String(formData.get('isActive') ?? '') === 'true';

  if (!z.string().uuid().safeParse(siteId).success) {
    return { ok: false, message: 'Sitio inválido.' };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  }

  const { data, error } = await service
    .from('sites')
    .update({ is_active: next })
    .eq('id', siteId)
    .select('name');

  if (error) {
    console.error('❌ No se pudo cambiar el estado del sitio:', error);
    return { ok: false, message: 'No se pudo guardar el cambio.' };
  }

  if (!data?.length) {
    return { ok: false, message: 'No encontramos ese sitio.' };
  }

  revalidatePath('/platform');
  return {
    ok: true,
    message: next
      ? `"${data[0].name}" vuelve a aceptar pedidos.`
      : `"${data[0].name}" queda desconectada: su landing deja de vender.`,
  };
}

const accountSchema = z.object({
  clientId: z.string().uuid(),
  clientName: z.string().trim().min(2).max(160),
  legalName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  contactPhone: z.string().trim().regex(/^\d{10,15}$/, 'Celular inválido').optional().or(z.literal('')),
  plan: z.string().trim().min(2).max(60),
  monthlyFee: z.coerce.number().int().min(0).optional(),
  billingDay: z.coerce.number().int().min(1).max(28).optional(),
  status: z.enum(['activo', 'pausado', 'moroso', 'cerrado']),
  onboardingStatus: z.enum(['pendiente', 'configurando', 'activo', 'pausado']),
  nextInvoiceDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Actualiza el registro de facturación.
 *
 * Es registro, no cobro: aquí no hay pasarela ni dato de tarjeta. El panel
 * recuerda cuánto y cuándo; el cobro ocurre fuera.
 *
 * La ficha corporativa no tiene grants para sesiones del navegador. Tras el
 * guard de plataforma se escribe con la clave de servicio.
 */
export async function updateSiteAccount(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const allowed = await guard();
  if ('error' in allowed) return allowed.error;

  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };

  const { clientId, ...input } = parsed.data;

  const { data, error } = await service
    .from('clients')
    .update({
      name: input.clientName,
      legal_name: input.legalName || null,
      contact_name: input.contactName || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      plan: input.plan,
      monthly_fee: input.monthlyFee ?? null,
      billing_day: input.billingDay ?? null,
      status: input.status,
      onboarding_status: input.onboardingStatus,
      next_invoice_date: input.nextInvoiceDate || null,
      notes: input.notes || null,
    })
    .eq('id', clientId)
    .select('id');

  if (error) {
    console.error('❌ No se pudo guardar la cuenta:', error);
    return { ok: false, message: 'No se pudo guardar.' };
  }

  if (!data?.length) {
    return { ok: false, message: 'No encontramos esa cuenta.' };
  }

  revalidatePath('/platform');
  return { ok: true, message: 'Cuenta actualizada.' };
}
