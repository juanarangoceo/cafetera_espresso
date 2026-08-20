import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

/**
 * Quién entra al panel y con qué alcance.
 *
 * `platform` es la operación de Nitro Landing: ve todos los sitios y administra
 * las cuentas de los clientes. `client` es el dueño de una landing: ve la suya.
 *
 * La distinción no la decide este archivo. La decide la base: `platform` sale
 * de una fila en `platform_admins`, y lo que un `client` alcanza sale de
 * `private.accessible_site_ids()`, que las políticas de cada tabla aplican por
 * su cuenta. Si esta comprobación se saltara por error, un cliente seguiría sin
 * poder leer los pedidos de otro.
 */
export type AdminRole = 'platform' | 'client';

export type AdminIdentity = {
  email: string;
  displayName: string | null;
  role: AdminRole;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const email = user.email.toLowerCase();

  // La política `platform_can_read_platform_admins` solo devuelve la fila si
  // `private.is_platform_admin()` es cierto, y esa función exige que el correo
  // esté confirmado en `auth.users`. Preguntar por la fila es, en la práctica,
  // preguntarle a la base si esta sesión es de plataforma.
  const { data: platform } = await supabase
    .from('platform_admins')
    .select('email, display_name')
    .eq('email', email)
    .maybeSingle();

  if (platform) {
    return { email: platform.email, displayName: platform.display_name, role: 'platform' };
  }

  const { data: member } = await supabase
    .from('site_members')
    .select('email, display_name')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (member) {
    return { email: member.email, displayName: member.display_name, role: 'client' };
  }

  return null;
}

/** Igual que `getAdminIdentity`, pero corta la página si no hay acceso. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) redirect('/admin/login');
  return identity;
}

/**
 * Corta la página si la sesión no es de plataforma.
 *
 * Vale para las secciones que administran a los clientes, no para los datos de
 * un sitio: ahí la frontera ya la pone el RLS. Esto solo evita enseñarle a un
 * cliente una pantalla que no le corresponde.
 */
export async function requirePlatformAdmin(): Promise<AdminIdentity> {
  const identity = await requireAdmin();
  if (identity.role !== 'platform') redirect('/admin');
  return identity;
}
