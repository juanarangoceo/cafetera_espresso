import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, LogOut, Zap } from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { adminSignOut } from '@/app/admin/actions';

export const metadata: Metadata = {
  title: 'Nitro Landing · Plataforma',
  description: 'Central corporativa de Nitro Landing.',
  robots: { index: false, follow: false },
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-ink-950 md:flex">
      <aside className="border-b border-ink-800 bg-ink-950 md:flex md:min-h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nitro-500 text-ink-950 shadow-lg shadow-nitro-500/30">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-white">Nitro <span className="text-nitro-400">Landing</span></p>
            <p className="text-xs text-ink-400">Central corporativa</p>
          </div>
        </div>

        <nav className="px-4 pb-4 md:flex-1">
          <Link href="/platform" aria-current="page" className="flex items-center gap-3 rounded-xl bg-nitro-500 px-4 py-3 text-sm font-bold text-ink-950 shadow-lg shadow-nitro-500/20">
            <Building2 size={18} />
            Clientes y landings
          </Link>
        </nav>

        <div className="border-t border-ink-800 px-6 py-4">
          <p className="truncate text-xs text-ink-400" title={admin.email}>{admin.displayName || admin.email}</p>
          <form action={adminSignOut}>
            <button type="submit" className="mt-2 flex items-center gap-2 text-sm font-bold text-ink-300 transition-colors hover:text-rose-400">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-ink-900 px-4 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
