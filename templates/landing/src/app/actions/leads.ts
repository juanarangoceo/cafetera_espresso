'use server';

import { z } from 'zod';

/**
 * Captación de correos.
 *
 * Espejo de `createOrder`: valida el formato en local para dar respuesta
 * inmediata y reenvía a la plataforma, que es quien escribe. La landing no
 * tiene credenciales de base de datos.
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

  const endpoint = process.env.NITRO_API_URL?.trim();
  const key = process.env.NITRO_SITE_KEY?.trim();

  if (!endpoint || !key) {
    console.error('❌ CRITICAL: faltan NITRO_API_URL o NITRO_SITE_KEY.');
    return { success: false, message: 'Error de configuración del servidor.' };
  }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ email: validation.data.email.toLowerCase() }),
      cache: 'no-store',
    });

    return (await response.json()) as LeadResult;
  } catch (error) {
    console.error('❌ No se pudo alcanzar la plataforma:', error);
    return { success: false, message: 'Hubo un error al guardar tu contacto. Intenta de nuevo.' };
  }
}
