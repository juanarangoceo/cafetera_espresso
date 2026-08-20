'use client';

import { useState } from 'react';

export type DailyPoint = {
  day: string;
  orders: number;
  delivered: number;
};

/**
 * Pedidos por día. Una sola serie, así que no lleva leyenda: el título la
 * nombra. Los colores están validados contra el fondo oscuro del panel.
 */
const BAR = '#10cf5e';

function formatDay(day: string) {
  // `day` viene como YYYY-MM-DD desde la vista, ya convertido a hora de
  // Colombia. Se parte a mano para que el navegador no lo interprete como UTC
  // y lo muestre un día antes.
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
}

export default function OrdersOverTimeChart({ points }: { points: DailyPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...points.map((point) => point.orders));
  const active = hovered === null ? null : points[hovered];

  if (!points.length) {
    return (
      <p className="py-12 text-center text-sm text-ink-500">
        Todavía no hay pedidos en este periodo.
      </p>
    );
  }

  return (
    <div className="relative">
      {active && (
        <div
          role="status"
          className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs shadow-xl"
        >
          <p className="font-bold text-white">{formatDay(active.day)}</p>
          <p className="text-ink-300">
            {active.orders} {active.orders === 1 ? 'pedido' : 'pedidos'} · {active.delivered}{' '}
            entregado{active.delivered === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <div className="flex h-48 items-end gap-[2px] pt-8">
        {points.map((point, index) => (
          <button
            key={point.day}
            type="button"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            aria-label={`${formatDay(point.day)}: ${point.orders} pedidos, ${point.delivered} entregados`}
            className="group relative flex h-full flex-1 items-end"
          >
            <span
              className="w-full rounded-t-[4px] transition-opacity"
              style={{
                height: `${Math.max(2, (point.orders / max) * 100)}%`,
                background: BAR,
                opacity: hovered === null || hovered === index ? 1 : 0.35,
              }}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-xs text-ink-500">
        <span>{formatDay(points[0].day)}</span>
        <span>{formatDay(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}
