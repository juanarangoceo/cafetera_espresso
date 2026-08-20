'use server';

import { checkBotId } from 'botid/server';
import { createServiceClient } from '@/utils/supabase/service';
import { activeSiteSlug } from '@/lib/site-config';
import { PRODUCT } from '@/lib/product';
import { createOrderForSite, resolveSiteFromSlug, type IntakeResult } from '@/lib/orders-intake';

/**
 * Creación de pedidos desde la landing.
 *
 * Sigue siendo el punto por donde entran los tres canales —formulario, chat y
 * voz—, pero la lógica de escritura ya no vive aquí: se comparte con la API de
 * ingesta en `src/lib/orders-intake.ts`, para que una landing de cliente en
 * otro proyecto de Vercel no acabe con una copia divergente de las
 * validaciones.
 *
 * Lo que sí se queda aquí es BotID, y tiene que quedarse: protege la ruta donde
 * está el formulario, y esa ruta vive en el proyecto de la landing.
 *
 * Dos modos, según el entorno:
 *
 *   `NITRO_SITE_KEY` presente → landing de cliente. Reenvía a la API con su
 *   llave y no toca Supabase, porque no tiene ninguna clave para hacerlo.
 *
 *   Sin esa variable → landing y plataforma comparten despliegue, que es el
 *   caso de Coffee Maker Pro. Resuelve el sitio por su slug y escribe directo.
 */

async function forwardToPlatform(formData: unknown, siteKey: string): Promise<IntakeResult> {
  const endpoint = process.env.NITRO_API_URL?.trim();

  if (!endpoint) {
    console.error('❌ CRITICAL: hay NITRO_SITE_KEY pero falta NITRO_API_URL.');
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${siteKey}`,
      },
      body: JSON.stringify(formData),
      cache: 'no-store',
    });

    const result = (await response.json()) as IntakeResult;

    // Un 401 significa que la llave de esta landing no sirve. Al comprador no
    // le dice nada, pero en los registros tiene que ser inconfundible: sin
    // llave válida esta landing no vende.
    if (response.status === 401) {
      console.error('❌ CRITICAL: la plataforma rechazó la llave de este sitio.');
      return {
        success: false,
        message: 'Error de configuración del servidor. Por favor contacta al soporte.',
      };
    }

    return result;
  } catch (error) {
    console.error('❌ No se pudo alcanzar la plataforma:', error);
    return { success: false, message: 'Error inesperado al procesar el pedido.' };
  }
}

export async function createOrder(formData: unknown) {
  // En contraentrega un pedido automatizado se convierte en un despacho físico
  // y un flete real, así que se descarta antes de tocar nada. En desarrollo
  // local siempre resuelve como humano.
  const verification = await checkBotId();

  if (verification.isBot) {
    console.warn('🤖 Intento de pedido bloqueado por BotID');
    return {
      success: false,
      message: 'No pudimos verificar tu solicitud. Recarga la página e intenta de nuevo.',
    };
  }

  const siteKey = process.env.NITRO_SITE_KEY?.trim();
  if (siteKey) {
    return forwardToPlatform(formData, siteKey);
  }

  const service = createServiceClient();

  if (!service) {
    console.error('❌ CRITICAL: falta SUPABASE_SECRET_KEY, no hay camino de escritura para pedidos.');
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  const site = await resolveSiteFromSlug(service, activeSiteSlug());

  if (!site) {
    console.error(`❌ CRITICAL: no se pudo resolver el sitio "${activeSiteSlug()}" ni su producto.`);
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  // `product.ts` sigue siendo la fuente de verdad comercial de la landing y la
  // base lo es del cobro. Mientras no se separen, deben coincidir; si dejan de
  // hacerlo, es mejor no vender que vender al precio equivocado.
  if (site.price !== PRODUCT.price) {
    console.error(
      `❌ CRITICAL: el precio de la landing (${PRODUCT.price}) no coincide con el del sitio (${site.price}).`,
    );
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  return createOrderForSite(formData, site);
}
