'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAdminIdentity } from '@/lib/admin-auth';
import { getSelectedSite, SITE_COOKIE } from '@/lib/admin-site';
import { isOrderStatus } from '@/lib/orders';
import { SITE_CHANNELS_TAG } from '@/lib/site-config';

export type ActionResult = { ok: boolean; message?: string };

/**
 * Cambia el estado de un pedido.
 *
 * La escritura va con la sesión del administrador, no con `SUPABASE_SECRET_KEY`.
 * Es deliberado: así la política RLS y el permiso por columna son los que
 * deciden, y no la comprobación de este archivo. La clave de servidor se salta
 * todas las políticas, de modo que usarla aquí convertiría un descuido en el
 * código en acceso total.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  const identity = await getAdminIdentity();
  if (!identity || identity.role !== 'client') {
    return { ok: false, message: 'Tu sesión no tiene acceso al panel.' };
  }

  if (!z.string().uuid().safeParse(orderId).success) {
    return { ok: false, message: 'Identificador de pedido inválido.' };
  }

  if (!isOrderStatus(status)) {
    return { ok: false, message: 'Ese estado no existe.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders_cod')
    .update({ status })
    .eq('id', orderId)
    .select('id, status');

  if (error) {
    console.error('❌ No se pudo cambiar el estado del pedido:', error.message);
    return { ok: false, message: 'No se pudo guardar el cambio.' };
  }

  // Sin error y sin filas significa que RLS no expuso el pedido. No es lo mismo
  // que un fallo de escritura y no debe reportarse como éxito.
  if (!data?.length) {
    return { ok: false, message: 'No encontramos ese pedido o no tienes acceso.' };
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

const channelsSchema = z.object({
  chatEnabled: z.boolean(),
  voiceEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  whatsappPhone: z.string(),
  whatsappMessage: z.string().max(300, 'El mensaje no puede pasar de 300 caracteres.'),
});

export async function updateChannels(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await getAdminIdentity();
  if (!identity || identity.role !== 'client') {
    return { ok: false, message: 'Tu sesión no tiene acceso al panel.' };
  }

  const parsed = channelsSchema.safeParse({
    chatEnabled: formData.get('chatEnabled') === 'on',
    voiceEnabled: formData.get('voiceEnabled') === 'on',
    whatsappEnabled: formData.get('whatsappEnabled') === 'on',
    whatsappPhone: String(formData.get('whatsappPhone') ?? ''),
    whatsappMessage: String(formData.get('whatsappMessage') ?? ''),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const { chatEnabled, voiceEnabled, whatsappEnabled, whatsappMessage } = parsed.data;

  // `wa.me` espera el número en formato internacional sin signos ni espacios.
  // Se limpia lo que haya escrito la persona antes de validar.
  const digits = parsed.data.whatsappPhone.replace(/\D/g, '');

  if (digits && !/^\d{10,15}$/.test(digits)) {
    return { ok: false, message: 'El número debe tener entre 10 y 15 dígitos.' };
  }

  // Un celular colombiano suelto no sirve como enlace: WhatsApp necesita el
  // indicativo. Se avisa en vez de anteponer un 57 por nuestra cuenta, que
  // sería adivinar el país por la persona.
  if (digits.length === 10 && digits.startsWith('3')) {
    return {
      ok: false,
      message:
        'Falta el indicativo del país. Para Colombia son 57 seguidos del celular: 57' + digits + '.',
    };
  }

  if (whatsappEnabled && !digits) {
    return { ok: false, message: 'Para encender WhatsApp hace falta un número.' };
  }

  const site = await getSelectedSite();
  if (!site) {
    return { ok: false, message: 'No se pudo identificar la tienda.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_channels')
    .update({
      chat_enabled: chatEnabled,
      voice_enabled: voiceEnabled,
      whatsapp_enabled: whatsappEnabled,
      whatsapp_phone: digits || null,
      whatsapp_message: whatsappMessage.trim() || null,
    })
    .eq('site_id', site.id)
    .select('site_id');

  if (error) {
    console.error('❌ No se pudo guardar la configuración de canales:', error.message);
    return { ok: false, message: 'No se pudo guardar la configuración.' };
  }

  if (!data?.length) {
    return { ok: false, message: 'No tienes permiso para cambiar la configuración.' };
  }

  // La landing lee esta configuración cacheada por etiqueta: sin invalidarla el
  // cambio no se vería hasta el próximo despliegue. `updateTag` —y no
  // `revalidateTag`— porque solo él garantiza que quien acaba de guardar vea su
  // propio cambio en la respuesta, en vez de la versión anterior.
  updateTag(SITE_CHANNELS_TAG);
  revalidatePath('/admin/ajustes');
  revalidatePath('/', 'layout');

  return { ok: true, message: 'Configuración guardada.' };
}

export async function adminSignIn(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: 'Credenciales inválidas.' };
  }

  // Autenticarse no es lo mismo que tener acceso al panel. Un comprador con
  // contraseña llegaría hasta aquí, así que la sesión se cierra de inmediato en
  // vez de dejarlo dentro viendo una pantalla vacía.
  const identity = await getAdminIdentity();
  if (!identity) {
    await supabase.auth.signOut();
    return { ok: false, message: 'Esta cuenta no tiene acceso al panel.' };
  }

  revalidatePath('/admin', 'layout');
  redirect(identity.role === 'platform' ? '/platform' : '/admin');
}

/**
 * Cambia la tienda activa del panel.
 *
 * No hace falta validar contra la lista: `getSelectedSite()` descarta cualquier
 * valor que no corresponda a una tienda existente, y quien no sea
 * administrador no pasa del guard de cada página.
 */
export async function selectSite(slug: string): Promise<ActionResult> {
  const identity = await getAdminIdentity();
  if (!identity || identity.role !== 'client') {
    return { ok: false, message: 'Tu sesión no tiene acceso al panel.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE, slug, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function adminSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/admin/login');
}
