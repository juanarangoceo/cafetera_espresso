'use server';

import { z } from 'zod';
import { createServiceClient } from '@/utils/supabase/service';
import { activeSiteSlug } from '@/lib/site-config';

/**
 * Captación de correos de la landing.
 *
 * Mismos dos modos que `createOrder`: con `NITRO_SITE_KEY` reenvía a la API de
 * la plataforma —la landing de un cliente no tiene claves de Supabase—, y sin
 * ella escribe directo resolviendo su propio sitio.
 *
 * El correo se atribuye siempre a un sitio. `leads` era único por correo a
 * secas, de modo que la misma persona suscrita en dos landings distintas hacía
 * fallar la segunda; ahora la unicidad es por sitio.
 */

const leadSchema = z.object({
  email: z.string().email({ message: 'Por favor ingresa un email válido.' }),
});

type LeadResult = { success: boolean; message: string };

export async function subscribeToMasterclass(
  _previous: unknown,
  formData: FormData,
): Promise<LeadResult> {
  const validation = leadSchema.safeParse({ email: formData.get('email') });

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  const email = validation.data.email.toLowerCase();
  const siteKey = process.env.NITRO_SITE_KEY?.trim();

  if (siteKey) {
    const endpoint = process.env.NITRO_API_URL?.trim();
    if (!endpoint) {
      console.error('❌ CRITICAL: hay NITRO_SITE_KEY pero falta NITRO_API_URL.');
      return { success: false, message: 'Error de configuración del servidor.' };
    }

    try {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${siteKey}` },
        body: JSON.stringify({ email }),
        cache: 'no-store',
      });
      return (await response.json()) as LeadResult;
    } catch (error) {
      console.error('❌ No se pudo alcanzar la plataforma:', error);
      return { success: false, message: 'Hubo un error al guardar tu contacto. Intenta de nuevo.' };
    }
  }

  const service = createServiceClient();
  if (!service) {
    console.error('❌ CRITICAL: falta SUPABASE_SECRET_KEY, no hay camino de escritura para correos.');
    return { success: false, message: 'Error de configuración del servidor.' };
  }

  const { data: site } = await service
    .from('sites')
    .select('id')
    .eq('slug', activeSiteSlug())
    .maybeSingle();

  const { error } = await service.from('leads').insert({
    email,
    source: 'ebook_barista_guide',
    // Sin sitio resuelto actúa el valor por defecto de la columna: mejor eso
    // que perder el correo por un identificador inválido.
    ...(site ? { site_id: site.id } : {}),
  });

  if (error) {
    // Volver a suscribirse no es un fallo que el visitante deba resolver: ya
    // está en la lista. Se responde como éxito a propósito.
    if (error.code === '23505') {
      return {
        success: true,
        message: '¡Ya te habías registrado! Revisa tu bandeja de entrada (o spam).',
      };
    }

    console.error('❌ No se pudo guardar el correo captado:', error);
    return { success: false, message: 'Hubo un error al guardar tu contacto. Intenta de nuevo.' };
  }

  return { success: true, message: '¡Genial! Tu Masterclass ha sido enviada a tu correo.' };
}
