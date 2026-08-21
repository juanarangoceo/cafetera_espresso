'use server';

import { checkBotId } from 'botid/server';

export type OrderResult = {
  success: boolean;
  message?: string;
  orderId?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createOrder(formData: FormData): Promise<OrderResult> {
  if (formData.get('customerConfirmed') !== 'true') {
    return { success: false, message: 'Revisa y confirma los datos antes de enviar.' };
  }
  if (formData.get('acceptedPrivacy') !== 'on') {
    return { success: false, message: 'Debes autorizar el tratamiento de datos.' };
  }

  const verification = await checkBotId();
  if (verification.isBot) {
    return { success: false, message: 'No pudimos verificar la solicitud. Intenta de nuevo.' };
  }

  const endpoint = process.env.NITRO_API_URL?.trim();
  const key = process.env.NITRO_SITE_KEY?.trim();
  if (!endpoint || !key) {
    console.error('Faltan NITRO_API_URL o NITRO_SITE_KEY; el checkout está deshabilitado.');
    return { success: false, message: 'En este momento no podemos recibir pedidos.' };
  }

  const payload = Object.fromEntries(
    ['fullName', 'email', 'phone', 'city', 'address'].map((field) => [
      field,
      String(formData.get(field) ?? '').trim(),
    ]),
  );

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const result = (await response.json()) as OrderResult;
    if (!response.ok) return { ...result, success: false };
    return result;
  } catch (error) {
    console.error('No fue posible crear el pedido en Nitro.', error);
    return { success: false, message: 'No pudimos procesar el pedido. Intenta nuevamente.' };
  }
}
