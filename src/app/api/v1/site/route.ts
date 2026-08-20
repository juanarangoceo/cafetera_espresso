import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { hashSiteKey, readBearerKey } from '@/lib/site-keys';

/**
 * Configuración de una landing de cliente.
 *
 * La landing propia lee `site_channels` directo de Supabase con la clave
 * publicable. Una landing de cliente no tiene ninguna clave de Supabase, así
 * que su configuración tiene que llegarle por aquí, con su llave de sitio.
 *
 * Devuelve también `isActive`: es lo que permite **apagar la landing de un
 * cliente desde el panel**, sin desplegar y sin tocar su proyecto. Un sitio
 * inactivo deja además de aceptar pedidos, cosa que ya comprueba
 * `resolveSiteFromKey`.
 *
 * Ojo con la propagación: la landing propia se entera al instante porque el
 * panel invalida su etiqueta de caché. Una landing de cliente vive en otro
 * despliegue, donde esa invalidación no llega, así que revalida por tiempo y
 * un cambio tarda hasta un minuto en verse. Está documentado en PLATFORM.md.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = readBearerKey(request.headers.get('authorization'));
  if (!key) {
    return NextResponse.json({ message: 'Credencial de sitio inválida.' }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }

  const { data: keyRow, error: keyError } = await service
    .from('site_api_keys')
    .select('site_id, revoked_at')
    .eq('key_hash', hashSiteKey(key))
    .maybeSingle();

  if (keyError || !keyRow || keyRow.revoked_at) {
    return NextResponse.json({ message: 'Credencial de sitio inválida.' }, { status: 401 });
  }

  const [siteResult, channelResult, productResult] = await Promise.all([
    service.from('sites').select('id, slug, name, is_active').eq('id', keyRow.site_id).maybeSingle(),
    service
      .from('site_channels')
      .select('chat_enabled, voice_enabled, whatsapp_enabled, whatsapp_phone, whatsapp_message')
      .eq('site_id', keyRow.site_id)
      .maybeSingle(),
    service
      .from('site_products')
      .select('name, price, currency')
      .eq('site_id', keyRow.site_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ]);

  const site = siteResult.data;
  if (!site) {
    return NextResponse.json({ message: 'Credencial de sitio inválida.' }, { status: 401 });
  }

  return NextResponse.json({
    siteId: site.id,
    slug: site.slug,
    name: site.name,
    // Cuando es `false`, la landing esconde el checkout y avisa. Es la palanca
    // de desconexión desde el panel.
    isActive: site.is_active,
    channels: {
      chatEnabled: channelResult.data?.chat_enabled ?? false,
      voiceEnabled: channelResult.data?.voice_enabled ?? false,
      whatsappEnabled: channelResult.data?.whatsapp_enabled ?? false,
      whatsappPhone: channelResult.data?.whatsapp_phone ?? null,
      whatsappMessage: channelResult.data?.whatsapp_message ?? null,
    },
    product: productResult.data
      ? {
          name: productResult.data.name,
          price: productResult.data.price,
          currency: productResult.data.currency,
        }
      : null,
  });
}
