import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import OrdersOverTimeChart, { type DailyPoint } from '@/components/admin/OrdersOverTimeChart';
import { ORDER_STATUSES, formatCOP, type OrderStatus } from '@/lib/orders';

/**
 * Colores del desglose por ciudad. Validados con el script de la guía de
 * visualización contra el fondo oscuro del panel: banda de luminosidad, piso de
 * croma, separación bajo daltonismo y contraste. El orden importa —es el orden
 * de los segmentos apilados— porque la comprobación es entre pares contiguos.
 */
const SEGMENTS = [
  { key: 'delivered', label: 'Entregado', color: '#0f9d4f' },
  { key: 'in_progress', label: 'En curso', color: '#3b82f6' },
  { key: 'cancelled', label: 'Cancelado', color: '#f43f5e' },
] as const;

const PERIODS = [30, 90] as const;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function percentage(part: number, whole: number) {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

export default async function AdminMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const site = await getSelectedSite();
  const siteId = site?.id ?? '';

  const params = await searchParams;
  const rawDays = Array.isArray(params.dias) ? params.dias[0] : params.dias;
  const days: number = PERIODS.includes(Number(rawDays) as (typeof PERIODS)[number])
    ? Number(rawDays)
    : 30;

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const supabase = await createClient();

  const [currentResult, previousResult, cityResult, statusCountEntries] = await Promise.all([
    supabase
      .from('order_daily_stats')
      .select('day, orders, delivered, cancelled, in_progress, delivered_value')
      .eq('site_id', siteId)
      .gte('day', isoDate(start))
      .order('day'),
    supabase
      .from('order_daily_stats')
      .select('day, orders, delivered')
      .eq('site_id', siteId)
      .gte('day', isoDate(previousStart))
      .lte('day', isoDate(previousEnd)),
    supabase
      .from('order_city_stats')
      .select('city, orders, delivered, cancelled, in_progress, delivered_value')
      .eq('site_id', siteId)
      .order('orders', { ascending: false })
      .limit(15),
    // El embudo se deriva del estado actual y no del historial: así también
    // cuenta los pedidos anteriores a que existiera `order_status_events`.
    Promise.all(
      ORDER_STATUSES.map(async (status) => {
        const { count } = await supabase
          .from('orders_cod')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .eq('status', status);
        return [status, count ?? 0] as const;
      }),
    ),
  ]);

  const counts = Object.fromEntries(statusCountEntries) as Record<OrderStatus, number>;

  // La vista solo devuelve los días con pedidos. Se rellenan los vacíos para
  // que el gráfico no comprima el tiempo y sugiera una actividad que no hubo.
  const byDay = new Map(
    (currentResult.data ?? []).map((row) => [row.day as string, row]),
  );
  const points: DailyPoint[] = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const key = isoDate(date);
    const row = byDay.get(key);
    points.push({
      day: key,
      orders: row?.orders ?? 0,
      delivered: row?.delivered ?? 0,
    });
  }

  const periodOrders = points.reduce((sum, point) => sum + point.orders, 0);
  const periodDelivered = points.reduce((sum, point) => sum + point.delivered, 0);
  const periodCancelled = (currentResult.data ?? []).reduce(
    (sum, row) => sum + (row.cancelled ?? 0),
    0,
  );
  const periodValue = (currentResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.delivered_value ?? 0),
    0,
  );

  // La tasa se calcula solo sobre pedidos que ya terminaron su recorrido.
  // Incluir los que siguen en tránsito la hundiría sin motivo: todavía no han
  // fracasado, simplemente no han llegado.
  const periodResolved = periodDelivered + periodCancelled;
  const deliveryRate = percentage(periodDelivered, periodResolved);
  const previousOrders = (previousResult.data ?? []).reduce(
    (sum, row) => sum + (row.orders ?? 0),
    0,
  );

  const delta = previousOrders ? Math.round(((periodOrders - previousOrders) / previousOrders) * 100) : null;

  const total = ORDER_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  const funnel = [
    { label: 'Recibidos', value: total },
    {
      label: 'Confirmados',
      value: (counts.confirmed ?? 0) + (counts.shipped ?? 0) + (counts.delivered ?? 0),
    },
    { label: 'Enviados', value: (counts.shipped ?? 0) + (counts.delivered ?? 0) },
    { label: 'Entregados', value: counts.delivered ?? 0 },
  ];

  const cities = cityResult.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Métricas</h1>
          <p className="mt-1 text-ink-400">
            {site?.name ?? 'Tienda'} · las tarjetas y el gráfico cubren los últimos {days} días
          </p>
        </div>

        <div className="flex gap-1 rounded-xl border border-ink-800 bg-ink-950 p-1">
          {PERIODS.map((period) => (
            <Link
              key={period}
              href={`/admin/metricas?dias=${period}`}
              aria-current={period === days ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                period === days
                  ? 'bg-nitro-500 text-ink-950'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              {period} días
            </Link>
          ))}
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Pedidos</p>
          <p className="mt-1 text-3xl font-bold text-white">{periodOrders}</p>
          {delta === null ? (
            <p className="mt-1 text-xs text-ink-500">Sin periodo anterior con datos</p>
          ) : (
            <p
              className={`mt-1 flex items-center gap-1 text-xs font-bold ${
                delta > 0 ? 'text-nitro-400' : delta < 0 ? 'text-rose-400' : 'text-ink-400'
              }`}
            >
              {delta > 0 ? (
                <ArrowUpRight size={14} />
              ) : delta < 0 ? (
                <ArrowDownRight size={14} />
              ) : (
                <ArrowRight size={14} />
              )}
              {delta > 0 ? '+' : ''}
              {delta}% vs. {days} días previos
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Entregados</p>
          <p className="mt-1 text-3xl font-bold text-white">{periodDelivered}</p>
          <p className="mt-1 text-xs text-ink-500">de {periodOrders} del periodo</p>
        </div>

        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Tasa de entrega</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {deliveryRate === null ? '—' : `${deliveryRate}%`}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {periodResolved
              ? `sobre ${periodResolved} ya resueltos`
              : 'sin pedidos resueltos aún'}
          </p>
        </div>

        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Cobrado</p>
          <p className="mt-1 text-3xl font-bold text-nitro-400">{formatCOP(periodValue)}</p>
          <p className="mt-1 text-xs text-ink-500">entregados del periodo</p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-ink-800 bg-ink-950 p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Pedidos por día</h2>
        <p className="mb-4 text-sm text-ink-400">
          Pasa el cursor por una barra para ver el detalle del día.
        </p>
        <OrdersOverTimeChart points={points} />
      </section>

      <section className="mb-8 rounded-2xl border border-ink-800 bg-ink-950 p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Embudo de estados</h2>
        <p className="mb-6 text-sm text-ink-400">
          Cuántos pedidos han alcanzado cada etapa, sobre el total histórico.
        </p>

        <ol className="space-y-3">
          {funnel.map((step) => {
            const share = percentage(step.value, total) ?? 0;
            return (
              <li key={step.label}>
                <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-bold text-white">{step.label}</span>
                  <span className="text-ink-400">
                    <span className="font-bold text-white">{step.value}</span> · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, background: '#0f9d4f' }}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-ink-900 p-3 text-xs leading-relaxed text-ink-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Las etapas se deducen del estado actual, así que un pedido cancelado después de
            salir no cuenta como enviado. Hay {counts.cancelled ?? 0}{' '}
            {counts.cancelled === 1 ? 'cancelado' : 'cancelados'} en total.
          </span>
        </p>
      </section>

      <section className="rounded-2xl border border-ink-800 bg-ink-950 p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Entregas por ciudad</h2>
        <p className="mb-4 text-sm text-ink-400">
          Histórico completo, no los últimos {days} días. En contraentrega cada pedido que
          no se entrega es un flete pagado sin venta.
        </p>

        <div className="mb-6 flex flex-wrap gap-4 text-xs">
          {SEGMENTS.map((segment) => (
            <span key={segment.key} className="flex items-center gap-2 text-ink-300">
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ background: segment.color }}
                aria-hidden="true"
              />
              {segment.label}
            </span>
          ))}
        </div>

        {cities.length ? (
          <div className="space-y-5">
            {cities.map((city) => {
              const cityTotal = city.orders ?? 0;
              const rate = percentage(city.delivered ?? 0, cityTotal);

              return (
                <div key={city.city}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-bold text-white">{city.city}</span>
                    <span className="text-ink-400">
                      {cityTotal} {cityTotal === 1 ? 'pedido' : 'pedidos'}
                      {rate === null ? '' : ` · ${rate}% entregado`}
                    </span>
                  </div>

                  <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
                    {SEGMENTS.map((segment) => {
                      const value = (city[segment.key] as number | null) ?? 0;
                      if (!value) return null;
                      return (
                        <span
                          key={segment.key}
                          title={`${segment.label}: ${value}`}
                          className="first:rounded-l-full last:rounded-r-full"
                          style={{
                            width: `${(value / cityTotal) * 100}%`,
                            background: segment.color,
                          }}
                        />
                      );
                    })}
                  </div>

                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    {SEGMENTS.map((segment) => {
                      const value = (city[segment.key] as number | null) ?? 0;
                      return (
                        <span key={segment.key}>
                          {segment.label}: <span className="text-ink-300">{value}</span>
                        </span>
                      );
                    })}
                    <span>
                      Cobrado:{' '}
                      <span className="text-ink-300">
                        {formatCOP(Number(city.delivered_value ?? 0))}
                      </span>
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-500">Todavía no hay pedidos.</p>
        )}

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-ink-900 p-3 text-xs leading-relaxed text-ink-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Las ciudades las escribe el comprador a mano y se agrupan sin distinguir
            mayúsculas. Los acentos sí separan: &quot;Medellin&quot; y &quot;Medellín&quot;
            aparecen como dos ciudades.
          </span>
        </p>
      </section>
    </div>
  );
}
