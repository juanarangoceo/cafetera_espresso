'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAdminIdentity } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { CONTACT_STAGES, CONTACT_SOURCES } from '@/lib/crm';
import type { ActionResult } from './actions';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre es muy corto.').max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(320)
    .transform((value) => value || null)
    .nullable()
    .refine(
      (value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'El correo no es válido.',
    ),
  phone: optionalText(40),
  city: optionalText(120),
  stage: z.enum(CONTACT_STAGES),
  nextFollowUp: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
});

function readContactForm(formData: FormData) {
  return contactSchema.safeParse({
    fullName: formData.get('fullName') ?? '',
    email: formData.get('email') ?? '',
    phone: formData.get('phone') ?? '',
    city: formData.get('city') ?? '',
    stage: formData.get('stage') ?? 'nuevo',
    nextFollowUp: formData.get('nextFollowUp') ?? '',
  });
}

/** El celular se guarda solo con dígitos, igual que en los pedidos. */
function normalizePhone(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits || null;
}

export async function saveContact(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await getAdminIdentity();
  if (!identity) return { ok: false, message: 'Tu sesión no tiene acceso al panel.' };

  const parsed = readContactForm(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const { fullName, email, city, stage, nextFollowUp } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);

  if (!email && !phone) {
    return { ok: false, message: 'Hace falta al menos un correo o un celular.' };
  }
  if (phone && (phone.length < 10 || phone.length > 15)) {
    return { ok: false, message: 'El celular debe tener entre 10 y 15 dígitos.' };
  }

  const contactId = String(formData.get('contactId') ?? '');
  const supabase = await createClient();

  // Actualización de una ficha existente.
  if (contactId) {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        full_name: fullName,
        email,
        phone,
        city,
        stage,
        next_follow_up: nextFollowUp,
      })
      .eq('id', contactId)
      .select('id');

    if (error) {
      // El correo y el celular son únicos por tienda: dos fichas de la misma
      // persona harían que su historial quedara partido en dos.
      if (error.code === '23505') {
        return { ok: false, message: 'Ya existe un contacto con ese correo o celular.' };
      }
      console.error('❌ No se pudo guardar el contacto:', error.message);
      return { ok: false, message: 'No se pudo guardar.' };
    }
    if (!data?.length) return { ok: false, message: 'No encontramos ese contacto.' };

    revalidatePath('/admin/crm');
    revalidatePath(`/admin/crm/${contactId}`);
    return { ok: true, message: 'Contacto actualizado.' };
  }

  // Alta manual de un prospecto.
  const site = await getSelectedSite();
  if (!site) return { ok: false, message: 'No se pudo identificar la tienda.' };

  const sourceValue = String(formData.get('source') ?? 'manual');
  const source = (CONTACT_SOURCES as readonly string[]).includes(sourceValue)
    ? sourceValue
    : 'manual';

  const { error } = await supabase.from('contacts').insert({
    site_id: site.id,
    full_name: fullName,
    email,
    phone,
    city,
    stage,
    next_follow_up: nextFollowUp,
    source,
  });

  if (error) {
    if (error.code === '23505') {
      return { ok: false, message: 'Ya existe un contacto con ese correo o celular.' };
    }
    console.error('❌ No se pudo crear el contacto:', error.message);
    return { ok: false, message: 'No se pudo crear el contacto.' };
  }

  revalidatePath('/admin/crm');
  return { ok: true, message: 'Contacto creado.' };
}

export async function addContactNote(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await getAdminIdentity();
  if (!identity) return { ok: false, message: 'Tu sesión no tiene acceso al panel.' };

  const contactId = String(formData.get('contactId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  if (!z.string().uuid().safeParse(contactId).success) {
    return { ok: false, message: 'Contacto inválido.' };
  }
  if (!body) return { ok: false, message: 'Escribe algo antes de guardar.' };
  if (body.length > 2000) return { ok: false, message: 'La nota es demasiado larga.' };

  const supabase = await createClient();
  const { error } = await supabase.from('contact_notes').insert({
    contact_id: contactId,
    body,
    // Queda registrado quién la escribió: una nota sin autor no sirve cuando
    // hay más de una persona atendiendo.
    author_email: identity.email,
  });

  if (error) {
    console.error('❌ No se pudo guardar la nota:', error.message);
    return { ok: false, message: 'No se pudo guardar la nota.' };
  }

  revalidatePath(`/admin/crm/${contactId}`);
  return { ok: true };
}
