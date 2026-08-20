'use server';

import { checkBotId } from 'botid/server';

/**
 * Creación de pedidos.
 *
 * Esta landing **no escribe en ninguna base de datos**. Valida que hay un
 * humano y reenvía a la plataforma con su llave de sitio. Es el reparto que
 * hace posible tener un proyecto de Vercel por cliente sin repartir también
 * `SUPABASE_SECRET_KEY`, que se salta el RLS de todos los inquilinos.
 *
 * BotID se queda aquí y tiene que quedarse: protege la ruta donde está el
 * formulario, y esa ruta es esta. Para cuando la petición llega a la
 * plataforma ya es una llamada de servidor a servidor.
 *
 * La validación de los campos y del precio la hace la plataforma. Duplicarla
 * aquí solo crearía dos versiones que se separan con el tiempo.
 */

export type OrderResult = {
  success: boolean;
  message?: string;
  orderId?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createOrder(formData: unknown): Promise<OrderResult> {
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

  const endpoint = process.env.NITRO_API_URL?.trim();
  const key = process.env.NITRO_SITE_KEY?.trim();

  if (!endpoint || !key) {
    console.error('❌ CRITICAL: faltan NITRO_API_URL o NITRO_SITE_KEY. Esta landing no puede vender.');
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(formData),
      cache: 'no-store',
    });

    // Un 401 significa llave inválida, revocada o sitio desconectado. Al
    // comprador no le dice nada útil, pero en los registros tiene que ser
    // inconfundible: sin llave válida esta landing no vende.
    if (response.status === 401) {
      console.error('❌ CRITICAL: la plataforma rechazó la llave de este sitio.');
      return {
        success: false,
        message: 'En este momento no podemos recibir pedidos. Intenta más tarde.',
      };
    }

    return (await response.json()) as OrderResult;
  } catch (error) {
    console.error('❌ No se pudo alcanzar la plataforma:', error);
    return { success: false, message: 'Error inesperado al procesar el pedido.' };
  }
}
