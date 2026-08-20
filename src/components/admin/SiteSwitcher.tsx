'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Store } from 'lucide-react';
import { selectSite } from '@/app/admin/actions';
import type { AdminSite } from '@/lib/admin-site';

export default function SiteSwitcher({
  sites,
  current,
}: {
  sites: AdminSite[];
  current: AdminSite;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // El selector se muestra siempre, incluso con una sola tienda. El panel
  // filtra todo por la tienda activa, así que tiene que verse cuál es, y deja
  // explícito que la operación admite más de una.
  return (
    <label className="relative block">
      <span className="sr-only">Tienda activa</span>
      <Store
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-nitro-500"
      />
      <select
        value={current.slug}
        disabled={pending}
        onChange={(event) => {
          const slug = event.target.value;
          startTransition(async () => {
            await selectSite(slug);
            router.refresh();
          });
        }}
        className="w-full cursor-pointer appearance-none rounded-xl border border-ink-800 bg-ink-900 py-2.5 pl-9 pr-8 text-sm font-bold text-ink-100 outline-none transition-colors hover:border-nitro-700 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20 disabled:opacity-60"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.slug} className="bg-ink-900">
            {site.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
        {pending ? <Loader2 size={14} className="animate-spin" /> : '▾'}
      </span>
    </label>
  );
}
