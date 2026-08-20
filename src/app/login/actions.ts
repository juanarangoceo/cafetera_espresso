'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

export type LoginResult = { ok: boolean; message: string }

const emailSchema = z.string().trim().toLowerCase().email()

/**
 * Envía el enlace de acceso al portal del comprador.
 *
 * Se sustituyó el registro con contraseña por enlace de un solo uso. El portal
 * no es una cuenta de usuario general: solo sirve para consultar un pedido, así
 * que el enlace se envía únicamente a correos que tienen al menos uno.
 *
 * La respuesta es idéntica haya pedido o no. Si dijera "ese correo no tiene
 * pedidos", el formulario se convertiría en una forma de averiguar quién
 * compró, que es justo el dato que este portal protege.
 */
export async function requestAccessLink(
  _previous: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const neutralResponse: LoginResult = {
    ok: true,
    message:
      'Si tienes un pedido con ese correo, te enviamos un enlace para entrar. Revisa tu bandeja.',
  }

  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) {
    return { ok: false, message: 'Escribe un correo válido.' }
  }

  const email = parsed.data

  // La consulta necesita saltarse RLS: todavía no hay sesión de nadie.
  const service = createServiceClient()
  if (!service) {
    console.error('❌ SUPABASE_SECRET_KEY ausente: no se puede validar el acceso al portal.')
    return {
      ok: false,
      message: 'No pudimos procesar la solicitud. Escríbenos y te ayudamos.',
    }
  }

  const { data: order, error } = await service
    .from('orders_cod')
    .select('id')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ No se pudo comprobar el pedido del portal:', error.message)
    return { ok: false, message: 'No pudimos procesar la solicitud. Inténtalo de nuevo.' }
  }

  // Sin pedido no se envía nada, pero la respuesta no lo delata.
  if (!order) return neutralResponse

  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // La cuenta se crea al abrir el enlace. Ese es el momento exacto en que
      // el correo queda verificado, que es lo que exige la política de lectura.
      shouldCreateUser: true,
      emailRedirectTo: origin ? `${origin}/auth/confirm?next=/dashboard` : undefined,
    },
  })

  if (otpError) {
    console.error('❌ No se pudo enviar el enlace de acceso:', otpError.message)
    // Un fallo de envío tampoco puede distinguir entre un correo y otro.
    return neutralResponse
  }

  return neutralResponse
}
