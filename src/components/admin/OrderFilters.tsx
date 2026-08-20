'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/orders';

export default function OrderFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeStatus = searchParams.get('estado') ?? 'todos';
  const query = searchParams.get('q') ?? '';

  const navigate = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Cambiar un filtro deja la paginación sin sentido: se vuelve al principio.
    next.delete('pagina');
    router.push(next.size ? `/admin?${next}` : '/admin');
  };

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="mb-6 space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q');
          navigate({ q: String(value ?? '').trim() || null });
        }}
        className="relative"
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar por nombre, correo, celular o ciudad"
          aria-label="Buscar pedidos"
          className="w-full rounded-xl border border-ink-700 bg-ink-800 py-3 pl-11 pr-24 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-nitro-500 px-4 py-2 text-sm font-bold text-ink-950 transition-colors hover:bg-nitro-400"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate({ estado: null })}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
            activeStatus === 'todos'
              ? 'border-nitro-500 bg-nitro-500 text-ink-950'
              : 'border-ink-700 bg-ink-800 text-ink-300 hover:border-ink-500 hover:text-white'
          }`}
        >
          Todos <span className="opacity-60">{total}</span>
        </button>

        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => navigate({ estado: status })}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
              activeStatus === status
                ? 'border-nitro-500 bg-nitro-500 text-ink-950'
                : 'border-ink-700 bg-ink-800 text-ink-300 hover:border-ink-500 hover:text-white'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${ORDER_STATUS_META[status].dot}`} />
            {ORDER_STATUS_META[status].label}
            <span className="opacity-60">{counts[status] ?? 0}</span>
          </button>
        ))}

        {query && (
          <button
            type="button"
            onClick={() => navigate({ q: null })}
            className="flex items-center gap-1 rounded-full border border-ink-700 bg-ink-800 px-4 py-2 text-sm font-bold text-ink-200 transition-colors hover:border-ink-500"
          >
            <X size={14} />
            {query}
          </button>
        )}
      </div>
    </div>
  );
}
