import { PRODUCT } from '@/lib/product';

/**
 * Configuración de esta landing, servida por la plataforma.
 *
 * Esta landing **no tiene ninguna credencial de Supabase**, y es a propósito:
 * `SUPABASE_SECRET_KEY` se salta el RLS de todos los inquilinos, así que
 * ponerla en el proyecto de un cliente convertiría una filtración suya en una
 * filtración de todos. Lo único que conoce es su `NITRO_SITE_KEY`.
 *
 * La configuración se pide a `/api/v1/site` y se revalida por tiempo. La
 * landing de la propia plataforma se entera de un cambio al instante, porque
 * allí el panel invalida la etiqueta de caché; aquí eso no llega, así que un
 * cambio hecho en el panel tarda hasta `REVALIDATE_SECONDS` en verse.
 */

const REVALIDATE_SECONDS = 60;

export type SiteChannels = {
  chatEnabled: boolean;
  voiceEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappPhone: string | null;
  whatsappMessage: string | null;
};

export type SiteConfig = {
  siteId: string;
  name: string;
  /**
   * Cuando es `false`, la landing esconde el checkout y avisa. Es la palanca de
   * desconexión desde el panel: no hace falta desplegar ni tocar este proyecto.
   */
  isActive: boolean;
  channels: SiteChannels;
  product: { name: string; price: number; currency: string } | null;
};

/**
 * Si la plataforma no responde, la landing sigue en pie con los dos asistentes
 * y sin botón de WhatsApp —encenderlo exigiría un número que no tenemos—, y
 * **se considera activa**: dejar de vender porque una consulta de configuración
 * falló sería peor que el problema que resuelve.
 */
const FALLBACK: SiteConfig = {
  siteId: '',
  name: PRODUCT.name,
  isActive: true,
  channels: {
    chatEnabled: true,
    voiceEnabled: true,
    whatsappEnabled: false,
    whatsappPhone: null,
    whatsappMessage: null,
  },
  product: null,
};

export const DEFAULT_WHATSAPP_MESSAGE = `Hola, quiero información sobre el ${PRODUCT.kitName}.`;

export async function getSiteConfig(): Promise<SiteConfig> {
  const endpoint = process.env.NITRO_API_URL?.trim();
  const key = process.env.NITRO_SITE_KEY?.trim();

  if (!endpoint || !key) {
    console.error('❌ Faltan NITRO_API_URL y NITRO_SITE_KEY: la landing usa la configuración por defecto.');
    return FALLBACK;
  }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/site`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      // Un 401 aquí significa que esta landing ya no tiene llave válida. No se
      // apaga por eso —la caída sería total— pero tiene que ser inconfundible
      // en los registros.
      console.error(`❌ La plataforma respondió ${response.status} a la configuración del sitio.`);
      return FALLBACK;
    }

    return (await response.json()) as SiteConfig;
  } catch (error) {
    console.error('❌ No se pudo leer la configuración desde la plataforma:', error);
    return FALLBACK;
  }
}

/**
 * Enlace de WhatsApp. `wa.me` espera el número en formato internacional sin
 * signos ni separadores; la base ya lo restringe a dígitos.
 */
export function whatsappLink(phone: string, message?: string | null) {
  const text = encodeURIComponent(message?.trim() || DEFAULT_WHATSAPP_MESSAGE);
  return `https://wa.me/${phone}?text=${text}`;
}
