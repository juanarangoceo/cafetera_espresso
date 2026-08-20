import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

/**
 * Canjea el enlace de acceso por una sesión.
 *
 * Es el punto en el que el correo del comprador queda verificado: hasta que
 * `verifyOtp` no confirma el token, `auth.users.email_confirmed_at` sigue vacío
 * y la política de lectura de pedidos no devuelve nada.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // `next` llega por la URL, así que no puede usarse tal cual: un valor como
  // `//sitio-ajeno.com` sería una redirección abierta desde nuestro dominio.
  // Solo se aceptan rutas internas.
  const requested = searchParams.get('next') ?? '/dashboard'
  const destination =
    requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) redirect(destination)

    console.error('❌ Enlace de acceso inválido o vencido:', error.message)
  }

  redirect('/login?estado=enlace-invalido')
}
