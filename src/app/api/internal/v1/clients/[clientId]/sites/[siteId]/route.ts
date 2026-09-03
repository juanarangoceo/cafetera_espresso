import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';

/**
 * Ajustes de una landing, escritos desde Nitro Bot.
 *
 * Es lo que hoy obliga al cliente a entrar al panel de Nitro Landing: el Pixel
 * de Meta, el botón de WhatsApp con su número, el chat, la voz y qué campos
 * exige el formulario. Al centralizarlo en Nitro Bot, este endpoint es el único
 * camino, y valida **lo mismo que la base**: si se relajara aquí, el `check` de
 * Postgres devolvería un 500 en vez de un mensaje que el cliente entienda.
 *
 * La landing va anidada bajo su cliente en la ruta a propósito. Nitro Bot sabe
 * a qué cliente está vinculado un tenant, así que el `clientId` de la URL es su
 * declaración de alcance, y aquí se comprueba que la landing sea realmente de
 * ese cliente. Sin eso, un `siteId` filtrado dejaría tocar la landing de otro.
 */
export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  isActive: z.boolean().optional(),
  channels: z
    .object({
      chatEnabled: z.boolean(),
      voiceEnabled: z.boolean(),
      whatsappEnabled: z.boolean(),
      // Formato internacional sin `+` ni separadores, como lo espera wa.me.
      whatsappPhone: z.string().regex(/^[0-9]{10,15}$/).nullable(),
      whatsappMessage: z.string().trim().min(1).max(300).nullable(),
      requireEmail: z.boolean(),
      requireCity: z.boolean(),
    })
    .refine((value) => !value.whatsappEnabled || Boolean(value.whatsappPhone), {
      message: 'Un botón de WhatsApp encendido sin número lleva a una página de error.',
      path: ['whatsappPhone'],
    })
    .optional(),
  tracking: z
    .object({
      metaPixelEnabled: z.boolean(),
      // ID público del Pixel. Nunca código ni tokens de la Conversions API.
      metaPixelId: z.string().regex(/^[0-9]{5,20}$/).nullable(),
    })
    .refine((value) => !value.metaPixelEnabled || Boolean(value.metaPixelId), {
      message: 'No se puede encender la medición sin un ID de Pixel.',
      path: ['metaPixelId'],
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ clientId: string; siteId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId } = guard.context;

  const { clientId, siteId } = await context.params;
  if (!isUuid(clientId) || !isUuid(siteId)) {
    return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(guard.context.body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  // La pertenencia se comprueba SIEMPRE, aunque el llamador esté autenticado:
  // la firma prueba que es Nitro Bot, no que ese tenant sea dueño del sitio.
  const { data: site } = await service
    .from('sites')
    .select('id, client_id')
    .eq('id', siteId)
    .maybeSingle();
  if (!site || site.client_id !== clientId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const { isActive, channels, tracking } = parsed.data;

  if (typeof isActive === 'boolean') {
    const { error } = await service.from('sites').update({ is_active: isActive }).eq('id', siteId);
    if (error) return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
  }

  if (channels) {
    const { error } = await service.from('site_channels').upsert(
      {
        site_id: siteId,
        chat_enabled: channels.chatEnabled,
        voice_enabled: channels.voiceEnabled,
        whatsapp_enabled: channels.whatsappEnabled,
        whatsapp_phone: channels.whatsappPhone,
        whatsapp_message: channels.whatsappMessage,
        require_email: channels.requireEmail,
        require_city: channels.requireCity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id' },
    );
    if (error) {
      console.error('[nitro-bot] canales:', error.message);
      return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
    }
  }

  if (tracking) {
    const { error } = await service.from('site_tracking').upsert(
      {
        site_id: siteId,
        meta_pixel_enabled: tracking.metaPixelEnabled,
        meta_pixel_id: tracking.metaPixelId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id' },
    );
    if (error) {
      console.error('[nitro-bot] medición:', error.message);
      return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
    }
  }

  return nitroBotJson(requestId, { siteId });
}
