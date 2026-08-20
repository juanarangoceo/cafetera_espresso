import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { LogOut, Zap } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite, listSites } from '@/lib/admin-site';
import AdminNav from '@/components/admin/AdminNav';
import SiteSwitcher from '@/components/admin/SiteSwitcher';
import { adminSignOut } from '../actions';

export const metadata: Metadata = {
  title: 'Nitro Landing',
  // La descripción se sobrescribe a propósito: sin esto se hereda la del layout
  // raíz, que es el texto comercial de una de las tiendas gestionadas. El panel
  // lo usan varios clientes y ninguno tiene por qué encontrarse la marca de
  // otro en su propia pantalla.
  description: 'Panel de operación de Nitro Landing.',
  // El panel no tiene por qué aparecer en resultados de búsqueda.
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Corta aquí y en cada página. La barrera real no es esta comprobación sino
  // las políticas RLS: sin ellas, saltarse este `redirect` bastaría.
  const admin = await requireAdmin();
  if (admin.role === 'platform') redirect('/platform');
  const [sites, site] = await Promise.all([listSites(), getSelectedSite()]);
  const clientBranding = site;

  return (
    <div className="min-h-screen bg-ink-950 md:flex">
      <aside className="border-b border-ink-800 bg-ink-950 md:flex md:min-h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-6 py-5">
          {clientBranding?.logoUrl ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-ink-700 bg-white">
              <Image
                src={clientBranding.logoUrl}
                alt={`Logo de ${clientBranding.name}`}
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nitro-500 text-ink-950 shadow-lg shadow-nitro-500/30">
              <Zap size={20} strokeWidth={2.5} />
            </div>
          )}
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-white">
              {clientBranding ? (
                clientBranding.name
              ) : (
                <>Nitro <span className="text-nitro-400">Landing</span></>
              )}
            </p>
            <p className="text-xs text-ink-400">
              Panel de operación
            </p>
          </div>
        </div>

        {/* El selector solo aparece si hay entre qué elegir. Un cliente con una
            sola landing no necesita un desplegable de un elemento; para la
            plataforma, en cambio, saber cuál está activa es imprescindible
            porque todo lo demás depende de ello. */}
        {site && sites.length > 1 && (
          <div className="px-4 pb-4">
            <SiteSwitcher sites={sites} current={site} />
          </div>
        )}

        {site && sites.length === 1 && (
          <div className="px-4 pb-4">
            <p className="rounded-xl border border-ink-800 bg-ink-900 px-3 py-2.5 text-sm font-bold text-ink-100">
              {site.name}
            </p>
          </div>
        )}

        <div className="px-4 pb-4 md:flex-1">
          <AdminNav />
        </div>

        <div className="border-t border-ink-800 px-6 py-4">
          <p className="truncate text-xs text-ink-400" title={admin.email}>
            {admin.displayName || admin.email}
          </p>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="mt-2 flex items-center gap-2 text-sm font-bold text-ink-300 transition-colors hover:text-rose-400"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-ink-900 px-4 py-8 md:px-10 md:py-12">
        {children}
      </main>
    </div>
  );
}
