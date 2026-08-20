import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/service';
import { sendOrderConfirmationEmail } from '@/app/actions/email';
import { hashSiteKey } from '@/lib/site-keys';

/**
 * El único lugar donde nace un pedido.
 *
 * Antes esto vivía dentro de la server action de la landing. Desde que cada
 * cliente tiene su propia landing en su propio proyecto de Vercel hay dos
 * puertas de entrada —la server action de la landing propia y la API con llave
 * de sitio— y ambas tienen que pasar por aquí: mismas validaciones, mismo
 * manejo de errores, mismo correo. Un canal que inserte por su cuenta se salta
 * las tres cosas.
 */

export const orderInputSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export type IntakeResult =
  | { success: true; orderId: string }
  | { success: false; message: string; errors?: Record<string, string[] | undefined> };

/**
 * El trigger antiabuso de la base rechaza pedidos repetidos con los mismos
 * datos de contacto, y el guardián de precio rechaza un importe que no
 * corresponde al producto del sitio. Ambos usan `23514`, así que el código no
 * basta para distinguirlos: el mensaje del primero está escrito para el
 * comprador y se le muestra tal cual; el del segundo describe un fallo de
 * configuración y no tiene por qué salir a pantalla.
 */
function messageForDatabaseError(error: { code?: string; message?: string }): string {
  if (error.code === '23514' && error.message?.includes('Ya registramos varios pedidos')) {
    return error.message;
  }
  return 'Hubo un error guardando el pedido. Intenta nuevamente.';
}

export type SiteResolution = {
  siteId: string;
  siteName: string;
  productId: string;
  productName: string;
  price: number;
};

/**
 * Resuelve el sitio y su producto activo a partir de una llave de ingesta.
 *
 * Devuelve `null` tanto si la llave no existe como si está revocada o el sitio
 * está inactivo: quien llama no tiene por qué saber en cuál de los tres casos
 * está, y distinguirlos convertiría el endpoint en un oráculo de llaves
 * válidas.
 */
export async function resolveSiteFromKey(
  service: SupabaseClient,
  key: string,
): Promise<SiteResolution | null> {
  const { data: keyRow, error: keyError } = await service
    .from('site_api_keys')
    .select('id, site_id, revoked_at')
    .eq('key_hash', hashSiteKey(key))
    .maybeSingle();

  if (keyError || !keyRow || keyRow.revoked_at) return null;

  const { data: site, error: siteError } = await service
    .from('sites')
    .select('id, name, is_active')
    .eq('id', keyRow.site_id)
    .maybeSingle();

  if (siteError || !site || !site.is_active) return null;

  const { data: products, error: productError } = await service
    .from('site_products')
    .select('id, name, price')
    .eq('site_id', site.id)
    .eq('is_active', true);

  if (productError || !products?.length) return null;

  // Con más de un producto activo la landing tendría que decir cuál vende. Ese
  // día llega con el catálogo; hasta entonces la ambigüedad se rechaza en vez
  // de elegir por su cuenta, porque elegir mal es cobrar un precio que no era.
  if (products.length > 1) {
    console.error(
      `❌ El sitio ${site.id} tiene ${products.length} productos activos y la ingesta no sabe cuál vender.`,
    );
    return null;
  }

  // Sello de uso. No bloquea la creación del pedido si falla: es información
  // de operación, no parte del camino crítico.
  void service
    .from('site_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(({ error }) => {
      if (error) console.error('⚠️ No se pudo sellar el uso de la llave:', error.message);
    });

  return {
    siteId: site.id,
    siteName: site.name,
    productId: products[0].id,
    productName: products[0].name,
    price: products[0].price,
  };
}

/**
 * Resuelve el sitio por su slug, sin llave.
 *
 * Vale solo cuando la landing y la plataforma comparten despliegue, que es el
 * caso de Coffee Maker Pro mientras no se separe. Una landing de cliente, en su
 * propio proyecto, no tiene forma de llegar hasta aquí: pasa por la API con su
 * llave.
 */
export async function resolveSiteFromSlug(
  service: SupabaseClient,
  slug: string,
): Promise<SiteResolution | null> {
  const { data: site, error: siteError } = await service
    .from('sites')
    .select('id, name, is_active')
    .eq('slug', slug)
    .maybeSingle();

  if (siteError || !site || !site.is_active) return null;

  const { data: products, error: productError } = await service
    .from('site_products')
    .select('id, name, price')
    .eq('site_id', site.id)
    .eq('is_active', true);

  if (productError || products?.length !== 1) return null;

  return {
    siteId: site.id,
    siteName: site.name,
    productId: products[0].id,
    productName: products[0].name,
    price: products[0].price,
  };
}

/**
 * Crea el pedido. Asume que quien llama ya comprobó que hay un humano detrás:
 * BotID vive en el proyecto de la landing, que es donde está el formulario.
 */
export async function createOrderForSite(
  input: unknown,
  site: SiteResolution,
): Promise<IntakeResult> {
  const validation = orderInputSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: 'Revisa los datos del formulario.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const service = createServiceClient();

  if (!service) {
    console.error('❌ CRITICAL: falta SUPABASE_SECRET_KEY, no hay camino de escritura para pedidos.');
    return {
      success: false,
      message: 'Error de configuración del servidor. Por favor contacta al soporte.',
    };
  }

  const { data, error } = await service
    .from('orders_cod')
    .insert({
      full_name: validation.data.fullName,
      email: validation.data.email.toLowerCase(),
      phone: validation.data.phone,
      city: validation.data.city,
      address: validation.data.address,
      // El precio lo pone el sitio, nunca el cliente que llama: el trigger de
      // la base lo comprobaría de todos modos, pero mandarlo desde aquí evita
      // que un formulario manipulado siquiera llegue a intentarlo.
      total_price: site.price,
      product_id: site.productId,
      site_id: site.siteId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Supabase Insert Error:', error);
    return { success: false, message: messageForDatabaseError(error) };
  }

  // El correo no bloquea la respuesta: el pedido ya está guardado y hacer
  // esperar al comprador por un servicio externo solo añade formas de fallar.
  try {
    await sendOrderConfirmationEmail({
      orderId: data.id,
      fullName: validation.data.fullName,
      email: validation.data.email,
      siteName: site.siteName,
      productName: site.productName,
      totalPrice: site.price,
      paymentMethod: 'Contraentrega',
      city: validation.data.city,
    });
  } catch (emailError) {
    console.error('⚠️ Error sending confirmation email:', emailError);
  }

  return { success: true, orderId: data.id };
}
