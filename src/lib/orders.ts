/**
 * Estados de un pedido contraentrega.
 *
 * La lista replica exactamente la restricción `check` de `orders_cod.status`.
 * Si cambia una, tiene que cambiar la otra por migración: la base es la que
 * manda y rechazará cualquier valor que no esté en su enum.
 */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Recorrido normal de un pedido. `cancelled` queda fuera: no es un avance. */
export const ORDER_PROGRESSION: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
];

type StatusMeta = {
  /** Cómo lo nombra la operación en el panel. */
  label: string;
  /** Cómo se lo contamos al comprador, que no habla en jerga de logística. */
  customerLabel: string;
  /** Qué significa para el comprador, en una frase. */
  customerDetail: string;
  /** Sobre fondo claro: el portal del comprador. */
  badge: string;
  /** Sobre fondo oscuro: el panel de operación. */
  darkBadge: string;
  dot: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Pendiente',
    customerLabel: 'Pedido recibido',
    customerDetail: 'Ya tenemos tus datos. Te contactamos para confirmar el envío.',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    darkBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmado',
    customerLabel: 'Pedido confirmado',
    customerDetail: 'Confirmamos tus datos y estamos preparando tu kit.',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    darkBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-blue-500',
  },
  shipped: {
    label: 'Enviado',
    customerLabel: 'En camino',
    customerDetail: 'Tu kit va en camino. Recuerda que el pago es contraentrega.',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    darkBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  delivered: {
    label: 'Entregado',
    customerLabel: 'Entregado',
    customerDetail: 'Tu kit fue entregado. Que lo disfrutes.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    darkBadge: 'bg-nitro-500/15 text-nitro-300 border-nitro-500/30',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelado',
    customerLabel: 'Pedido cancelado',
    customerDetail: 'Este pedido fue cancelado. Si es un error, escríbenos.',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    darkBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
  },
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function formatCOP(value: number) {
  return `$${value.toLocaleString('es-CO')}`;
}

export function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatOrderDateTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
