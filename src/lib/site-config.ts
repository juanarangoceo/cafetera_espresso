import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/env';
import { PRODUCT } from '@/lib/product';

/**
 * Configuración de canales de un sitio: qué asistentes se muestran en la
 * landing y a qué número apunta el botón de WhatsApp.
 *
 * Se lee con la publishable key y sin cookies a propósito. Usar el cliente con
 * sesión obligaría a `cookies()` en el layout raíz y volvería dinámica toda la
 * landing, que es la página que sostiene la pauta.
 *
 * El resultado se cachea con una etiqueta, así que apagar un canal desde el
 * panel se refleja de inmediato —`revalidateTag`— sin desplegar y sin pagar una
 * consulta por visita.
 */

export const SITE_CHANNELS_TAG = 'site-channels';
export const DEFAULT_SITE_SLUG = 'coffee-maker-pro';

export type SiteChannels = {
  siteId: string;
  chatEnabled: boolean;
  voiceEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappPhone: string | null;
  whatsappMessage: string | null;
};

export function activeSiteSlug() {
  return process.env.SITE_SLUG?.trim() || DEFAULT_SITE_SLUG;
}

/**
 * Mensaje por defecto del botón de WhatsApp. Solo nombra el producto: cualquier
 * dato comercial sale de `product.ts` y nada se inventa aquí.
 */
export const DEFAULT_WHATSAPP_MESSAGE = `Hola, quiero información sobre el ${PRODUCT.kitName}.`;

/**
 * Si la base no responde, la landing sigue en pie con los dos asistentes que ya
 * tenía y sin botón de WhatsApp: encenderlo exigiría un número que no tenemos.
 */
const FALLBACK_CHANNELS: SiteChannels = {
  siteId: '',
  chatEnabled: true,
  voiceEnabled: true,
  whatsappEnabled: false,
  whatsappPhone: null,
  whatsappMessage: null,
};

async function fetchSiteChannels(slug: string): Promise<SiteChannels> {
  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    console.error('❌ Faltan variables de Supabase: la landing usa los canales por defecto.');
    return FALLBACK_CHANNELS;
  }

  const supabase = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('site_channels')
    .select(
      'site_id, chat_enabled, voice_enabled, whatsapp_enabled, whatsapp_phone, whatsapp_message, sites!inner(slug)',
    )
    .eq('sites.slug', slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('❌ No se pudo leer la configuración de canales:', error.message);
    return FALLBACK_CHANNELS;
  }

  return {
    siteId: data.site_id,
    chatEnabled: data.chat_enabled,
    voiceEnabled: data.voice_enabled,
    whatsappEnabled: data.whatsapp_enabled,
    whatsappPhone: data.whatsapp_phone,
    whatsappMessage: data.whatsapp_message,
  };
}

export const getSiteChannels = unstable_cache(fetchSiteChannels, ['site-channels'], {
  tags: [SITE_CHANNELS_TAG],
});

/**
 * Enlace de WhatsApp. `wa.me` espera el número en formato internacional sin
 * signos ni separadores; la base ya lo restringe a dígitos.
 */
export function whatsappLink(phone: string, message?: string | null) {
  const text = encodeURIComponent(message?.trim() || DEFAULT_WHATSAPP_MESSAGE);
  return `https://wa.me/${phone}?text=${text}`;
}
