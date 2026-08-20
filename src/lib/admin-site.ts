import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { activeSiteSlug } from '@/lib/site-config';

export const SITE_COOKIE = 'nitro_site';

export type AdminSite = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
};

/**
 * Tiendas que gestiona el panel.
 *
 * Hoy hay una sola, pero el panel no asume eso en ninguna parte: cada consulta
 * de pedidos, métricas y CRM filtra por la tienda elegida. Añadir la segunda
 * será insertar una fila en `sites`, no reescribir el panel.
 */
export async function listSites(): Promise<AdminSite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sites')
    .select('id, slug, name, logo_url')
    .order('name');

  if (error || !data) return [];
  return data.map((site) => ({
    id: site.id,
    slug: site.slug,
    name: site.name,
    logoUrl: site.logo_url,
  }));
}

/**
 * Tienda activa para esta sesión del panel.
 *
 * La elección vive en una cookie y no en la URL para que no haya que arrastrar
 * el parámetro por cada enlace, filtro y paginación. Si la cookie apunta a una
 * tienda que ya no existe, se cae a la primera en vez de romper la página.
 */
export async function getSelectedSite(): Promise<AdminSite | null> {
  const sites = await listSites();
  if (!sites.length) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(SITE_COOKIE)?.value;

  return (
    sites.find((site) => site.slug === preferred) ??
    sites.find((site) => site.slug === activeSiteSlug()) ??
    sites[0]
  );
}
