'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdminIdentity } from '@/lib/admin-auth';
import { generateIntakeToken, hashIntakeToken, intakeSubmissionSchema } from '@/lib/intake';
import { createServiceClient } from '@/utils/supabase/service';
import type { PlatformResult } from '@/app/admin/platform-actions';

async function guard() {
  const identity = await getAdminIdentity();
  return identity?.role === 'platform' ? identity : null;
}

const standaloneSchema = z.object({
  provisionalName: z.string().trim().min(2, 'Escribe un nombre provisional.').max(160),
  slug: z.string().trim().regex(
    /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/,
    'Usa minúsculas, números y guiones. Ejemplo: cafe-la-montana',
  ),
});

export async function createStandaloneIntake(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const identity = await guard();
  if (!identity) return { ok: false, message: 'Esta sección es solo de la plataforma.' };

  const parsed = standaloneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }
  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };

  const { data: existingSite, error: siteLookupError } = await service
    .from('sites')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();
  if (siteLookupError) return { ok: false, message: 'No pudimos comprobar el identificador.' };
  if (existingSite) return { ok: false, message: 'Ese identificador ya pertenece a un cliente creado.' };

  const token = generateIntakeToken();
  const { error } = await service.from('intake_requests').insert({
    site_id: null,
    provisional_name: parsed.data.provisionalName,
    slug: parsed.data.slug,
    token_hash: hashIntakeToken(token),
    created_by: identity.email,
  });
  if (error?.code === '23505') {
    return { ok: false, message: 'Ya existe un cliente, sitio o intake activo con ese identificador.' };
  }
  if (error) {
    console.error('❌ No se pudo crear el intake independiente:', error);
    return { ok: false, message: 'No se pudo crear el enlace.' };
  }

  revalidatePath('/platform');
  return {
    ok: true,
    message: 'Enlace creado sin dar de alta al cliente. Cópialo ahora.',
    secret: `/intake/${token}`,
  };
}

export async function reissueStandaloneIntakeLink(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const identity = await guard();
  if (!identity) return { ok: false, message: 'Esta sección es solo de la plataforma.' };
  const requestId = z.string().uuid().safeParse(formData.get('requestId'));
  if (!requestId.success) return { ok: false, message: 'Solicitud inválida.' };

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  const token = generateIntakeToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await service.from('intake_requests').update({
    token_hash: hashIntakeToken(token),
    expires_at: expiresAt,
  }).eq('id', requestId.data).is('site_id', null).eq('status', 'draft').select('id');
  if (error || !data?.length) return { ok: false, message: 'Ese intake ya no se puede renovar.' };

  revalidatePath('/platform');
  return {
    ok: true,
    message: 'Enlace renovado. El enlace anterior dejó de funcionar.',
    secret: `/intake/${token}`,
  };
}

export async function convertIntakeToClient(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const identity = await guard();
  if (!identity) return { ok: false, message: 'Esta sección es solo de la plataforma.' };
  const requestId = z.string().uuid().safeParse(formData.get('requestId'));
  if (!requestId.success) return { ok: false, message: 'Solicitud inválida.' };

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };
  const { data: intake, error: intakeError } = await service
    .from('intake_requests')
    .select('id, site_id, slug, answers, status')
    .eq('id', requestId.data)
    .is('site_id', null)
    .eq('status', 'submitted')
    .maybeSingle();
  if (intakeError || !intake) return { ok: false, message: 'Ese brief no está listo para convertirse.' };

  const parsed = intakeSubmissionSchema.safeParse(intake.answers);
  if (!parsed.success) return { ok: false, message: 'El brief recibido tiene información obligatoria pendiente.' };
  const answers = parsed.data;
  if (answers.currency.trim().toUpperCase() !== 'COP') {
    return { ok: false, message: 'La conversión automática admite precios en COP. Revisa este brief manualmente.' };
  }
  const price = Number(answers.price.replace(/[^0-9]/g, ''));
  if (!Number.isSafeInteger(price) || price <= 0 || price > 2_000_000_000) {
    return { ok: false, message: 'No pudimos interpretar el precio. Escríbelo solo con números en el brief.' };
  }
  const phone = answers.supportPhone.replace(/[^0-9]/g, '');
  const contactPhone = /^\d{10,15}$/.test(phone) ? phone : null;

  const { data: client, error: clientError } = await service.from('clients').insert({
    name: answers.businessName,
    legal_name: answers.legalSeller,
    contact_name: answers.contactName || null,
    contact_email: answers.supportEmail,
    contact_phone: contactPhone,
    onboarding_status: 'configurando',
  }).select('id').single();
  if (clientError || !client) {
    console.error('❌ No se pudo convertir el intake en cliente:', clientError);
    return { ok: false, message: 'No se pudo crear la ficha del cliente.' };
  }

  const rollback = async () => {
    await service.from('clients').delete().eq('id', client.id);
  };
  const { data: site, error: siteError } = await service.from('sites').insert({
    client_id: client.id,
    slug: intake.slug,
    name: answers.businessName,
    is_active: false,
  }).select('id').single();
  if (siteError || !site) {
    await rollback();
    return {
      ok: false,
      message: siteError?.code === '23505'
        ? 'Ese identificador ya pertenece a otro sitio.'
        : 'No se pudo crear la landing del cliente.',
    };
  }

  const rollbackSite = async () => {
    await service.from('sites').delete().eq('id', site.id);
    await rollback();
  };
  const [channels, product] = await Promise.all([
    service.from('site_channels').insert({ site_id: site.id }),
    service.from('site_products').insert({
      site_id: site.id,
      name: answers.productName,
      price,
      currency: 'COP',
    }),
  ]);
  if (channels.error || product.error) {
    await rollbackSite();
    console.error('❌ Conversión de intake revertida:', channels.error ?? product.error);
    return { ok: false, message: 'No se pudieron preparar producto y canales.' };
  }

  const { data: linkedIntakes, error: linkError } = await service.from('intake_requests')
    .update({ site_id: site.id })
    .eq('id', intake.id)
    .is('site_id', null)
    .select('id');
  if (linkError || !linkedIntakes?.length) {
    await rollbackSite();
    return { ok: false, message: 'El cliente se creó, pero no se pudo enlazar al brief; se revirtió el alta.' };
  }

  revalidatePath('/platform');
  return { ok: true, message: `“${answers.businessName}” ya aparece como cliente. La landing quedó desconectada hasta completar su configuración.` };
}

export async function issueIntakeLink(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const identity = await guard();
  if (!identity) return { ok: false, message: 'Esta sección es solo de la plataforma.' };

  const siteId = z.string().uuid().safeParse(formData.get('siteId'));
  if (!siteId.success) return { ok: false, message: 'Sitio inválido.' };

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };

  const { data: site } = await service.from('sites').select('id, name, slug').eq('id', siteId.data).maybeSingle();
  if (!site) return { ok: false, message: 'No encontramos ese sitio.' };

  const now = new Date().toISOString();
  const { error: revokeError } = await service
    .from('intake_requests')
    .update({ status: 'revoked', revoked_at: now })
    .eq('site_id', siteId.data)
    .eq('status', 'draft');
  if (revokeError) {
    console.error('❌ No se pudo cerrar el intake anterior:', revokeError);
    return { ok: false, message: 'No se pudo reemplazar el enlace anterior.' };
  }

  const token = generateIntakeToken();
  const { error } = await service.from('intake_requests').insert({
    site_id: siteId.data,
    provisional_name: site.name,
    slug: site.slug,
    token_hash: hashIntakeToken(token),
    created_by: identity.email,
  });
  if (error) {
    console.error('❌ No se pudo crear el intake:', error);
    return { ok: false, message: 'No se pudo crear el enlace.' };
  }

  revalidatePath('/platform');
  return {
    ok: true,
    message: 'Enlace creado. Cópialo ahora: por seguridad el token no vuelve a mostrarse.',
    secret: `/intake/${token}`,
  };
}

export async function revokeIntakeLink(
  _previous: PlatformResult | null,
  formData: FormData,
): Promise<PlatformResult> {
  const identity = await guard();
  if (!identity) return { ok: false, message: 'Esta sección es solo de la plataforma.' };

  const requestId = z.string().uuid().safeParse(formData.get('requestId'));
  if (!requestId.success) return { ok: false, message: 'Solicitud inválida.' };

  const service = createServiceClient();
  if (!service) return { ok: false, message: 'Falta SUPABASE_SECRET_KEY en el servidor.' };

  const { data, error } = await service
    .from('intake_requests')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', requestId.data)
    .eq('status', 'draft')
    .select('id');
  if (error || !data?.length) return { ok: false, message: 'Ese enlace ya no está activo.' };

  revalidatePath('/platform');
  return { ok: true, message: 'Enlace cerrado. Ya no permite guardar ni subir material.' };
}
