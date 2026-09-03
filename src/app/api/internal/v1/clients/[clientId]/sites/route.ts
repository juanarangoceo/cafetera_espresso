import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';
import { generateSiteKey } from '@/lib/site-keys';

/**
 * Alta de una landing bajo un cliente, desde Nitro Admin.
 *
 * Crea la misma secuencia que el panel `/platform`, y por el mismo motivo: un
 * sitio sin canales, sin medición o sin producto **no puede vender**. El
 * trigger `enforce_order_price` rechaza cualquier pedido cuyo importe no
 * coincida con un producto activo del sitio, así que un alta a medias produce
 * una landing publicada que falla en el checkout. Si algo falla, se deshace lo
 * creado en vez de dejarla así.
 *
 * La llave de ingesta se emite aquí y se devuelve **una sola vez**: en la base
 * solo vive su `sha256`. Es lo que hay que pegar en el proyecto de Vercel de la
 * landing como `NITRO_SITE_KEY`.
 */
export const dynamic = 'force-dynamic';

const newSiteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/, 'El identificador va en minúsculas, sin espacios.'),
  productName: z.string().trim().min(2).max(160),
  price: z.number().int().min(0),
  primaryDomain: z.string().trim().max(180).nullable().optional(),
  productionUrl: z.string().trim().url().max(500).nullable().optional(),
  vercelProject: z.string().trim().max(160).nullable().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId, body } = guard.context;

  const clientId = (await context.params).clientId;
  if (!isUuid(clientId)) {
    return NextResponse.json({ ok: false, error: 'bad_client_id' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const parsed = newSiteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  const { data: client } = await service
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const input = parsed.data;
  const { data: site, error: siteError } = await service
    .from('sites')
    .insert({
      client_id: clientId,
      slug: input.slug,
      name: input.name,
      primary_domain: input.primaryDomain || null,
      production_url: input.productionUrl || null,
      vercel_project: input.vercelProject || null,
    })
    .select('id')
    .single();

  if (siteError || !site) {
    // 23505 es el único fallo que el operador puede corregir solo.
    if (siteError?.code === '23505') {
      return NextResponse.json({ ok: false, error: 'slug_taken' }, { status: 409 });
    }
    console.error('[nitro-bot] no se pudo crear la landing:', siteError?.message);
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
  }

  const rollback = async (reason: string) => {
    await service.from('sites').delete().eq('id', site.id);
    console.error(`[nitro-bot] alta de landing revertida (${reason}).`);
  };

  const { error: channelError } = await service.from('site_channels').insert({ site_id: site.id });
  if (channelError) {
    await rollback('canales');
    return NextResponse.json({ ok: false, error: 'channels_failed' }, { status: 500 });
  }

  const { error: trackingError } = await service.from('site_tracking').insert({ site_id: site.id });
  if (trackingError) {
    await rollback('medición');
    return NextResponse.json({ ok: false, error: 'tracking_failed' }, { status: 500 });
  }

  const { error: productError } = await service
    .from('site_products')
    .insert({ site_id: site.id, name: input.productName, price: input.price });
  if (productError) {
    await rollback('producto');
    return NextResponse.json({ ok: false, error: 'product_failed' }, { status: 500 });
  }

  const key = generateSiteKey();
  const { error: keyError } = await service.from('site_api_keys').insert({
    site_id: site.id,
    label: 'Emitida desde Nitro Bot',
    key_hash: key.keyHash,
    prefix: key.prefix,
    created_by: 'nitro-bot',
  });
  if (keyError) {
    await rollback('llave');
    return NextResponse.json({ ok: false, error: 'key_failed' }, { status: 500 });
  }

  return nitroBotJson(requestId, {
    site: { id: site.id, name: input.name, slug: input.slug },
    // Se devuelve en claro UNA vez. Quien la pierda emite otra; no hay forma de
    // recuperarla, y esa es la intención.
    siteKey: key.key,
  });
}
