'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { updateOrderStatus } from '@/app/admin/actions';
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from '@/lib/orders';

export default function OrderStatusSelect({
  orderId,
  status,
  compact = false,
}: {
  orderId: string;
  status: OrderStatus;
  compact?: boolean;
}) {
  const [current, setCurrent] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<'saved' | string | null>(null);

  const change = (next: OrderStatus) => {
    if (next === current) return;

    const previous = current;
    // Se muestra el estado nuevo de inmediato y se revierte si el servidor lo
    // rechaza: quien despacha no debería esperar una ida y vuelta por pedido.
    setCurrent(next);
    setFeedback(null);

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.ok) {
        setFeedback('saved');
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setCurrent(previous);
        setFeedback(result.message ?? 'No se pudo guardar.');
      }
    });
  };

  return (
    <div className={compact ? 'flex flex-col gap-1' : 'flex items-center gap-2'}>
      <div className="relative">
        <select
          value={current}
          disabled={pending}
          onChange={(event) => change(event.target.value as OrderStatus)}
          aria-label="Estado del pedido"
          className={`w-full cursor-pointer appearance-none rounded-lg border px-3 py-2 pr-8 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-nitro-500/30 disabled:opacity-60 ${ORDER_STATUS_META[current].darkBadge}`}
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value} className="bg-ink-800 text-white">
              {ORDER_STATUS_META[value].label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : feedback === 'saved' ? (
            <Check size={14} className="text-nitro-400" />
          ) : (
            <span className="text-xs opacity-60">▾</span>
          )}
        </span>
      </div>

      {feedback && feedback !== 'saved' && (
        <p role="alert" className="flex items-start gap-1 text-xs font-medium text-rose-400">
          <TriangleAlert size={12} className="mt-0.5 shrink-0" />
          {feedback}
        </p>
      )}
    </div>
  );
}
