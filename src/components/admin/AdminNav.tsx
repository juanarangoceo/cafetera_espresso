'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ChartNoAxesCombined, Package, SlidersHorizontal, Users } from 'lucide-react';
import type { AdminRole } from '@/lib/admin-auth';

const links = [
  { href: '/admin', label: 'Pedidos', icon: Package },
  { href: '/admin/metricas', label: 'Métricas', icon: ChartNoAxesCombined },
  { href: '/admin/crm', label: 'CRM', icon: Users },
  { href: '/admin/ajustes', label: 'Canales', icon: SlidersHorizontal },
];

// Administrar clientes, llaves y facturación es cosa de la plataforma. Ocultar
// el enlace es cortesía, no seguridad: la barrera real está en la página, que
// llama a `requirePlatformAdmin()`, y en las políticas de `site_accounts`.
const platformLink = { href: '/admin/plataforma', label: 'Clientes', icon: Building2 };

export default function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {(role === 'platform' ? [...links, platformLink] : links).map(({ href, label, icon: Icon }) => {
        // `/admin` es prefijo de todo lo demás, así que la raíz se compara
        // exacta o marcaría todas las secciones como activas a la vez.
        const active = href === '/admin' ? pathname === href : pathname?.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all md:flex-none ${
              active
                ? 'bg-nitro-500 text-ink-950 shadow-lg shadow-nitro-500/20'
                : 'text-ink-300 hover:bg-ink-800 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
