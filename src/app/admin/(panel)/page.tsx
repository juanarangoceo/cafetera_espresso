import { Inbox, Package, Truck, CheckCircle2, Download, Phone, MapPin, Mail } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import OrderFilters from '@/components/admin/OrderFilters';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  formatCOP,
  formatOrderDateTime,
  isOrderStatus,
  type OrderStatus,
} from '@/lib/orders';

const PAGE_SIZE = 25;

/**
 * PostgREST separa las condiciones de `or` con comas y agrupa con paréntesis,
 * así que esos caracteres en el texto buscado romperían la consulta. `%` y `_`
 * son comodines de `ilike` y convertirían una búsqueda en un barrido.
 */
function sanitizeQuery(value: string) {
  return value.replace(/[,()%_\\*"']/g, ' ').trim().slice(0, 80);
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function readParam(params: Awaited<SearchParams>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const site = await getSelectedSite();

  const params = await searchParams;
  const statusParam = readParam(params, 'estado');
  const activeStatus = isOrderStatus(statusParam) ? statusParam : null;
  const rawQuery = readParam(params, 'q') ?? '';
  const search = sanitizeQuery(rawQuery);
  const page = Math.max(1, Number(readParam(params, 'pagina') ?? '1') || 1);

  // El enlace de descarga reproduce los filtros activos, no la paginación: el
  // archivo trae todo lo que cumple el filtro, no la página que se está viendo.
  const exportParams = new URLSearchParams();
  if (activeStatus) exportParams.set('estado', activeStatus);
  if (search) exportParams.set('q', search);
  const exportQuery = exportParams.size ? `?${exportParams}` : '';

  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Todo el panel se acota a la tienda activa. Sin este filtro, al colgar la
  // segunda landing las métricas de ambas se sumarían sin avisar.
  const siteId = site?.id ?? '';

  // Las métricas describen toda la tienda, no la página filtrada. Se piden como
  // conteos con `head`, que no traen filas.
  const [statusCountEntries, todayResult, deliveredResult] = await Promise.all([
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
    supabase
      .from('orders_cod')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('orders_cod')
      .select('total_price')
      .eq('site_id', siteId)
      .eq('status', 'delivered'),
  ]);

  const counts = Object.fromEntries(statusCountEntries) as Record<OrderStatus, number>;
  const ordersToday = todayResult.count ?? 0;
  const deliveredValue = (deliveredResult.data ?? []).reduce(
    (sum, row) => sum + (row.total_price ?? 0),
    0,
  );

  let listQuery = supabase
    .from('orders_cod')
    .select('id, full_name, email, phone, city, address, total_price, status, created_at', {
      count: 'exact',
    })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (activeStatus) listQuery = listQuery.eq('status', activeStatus);
  if (search) {
    listQuery = listQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`,
    );
  }

  const { data: orders, count: matching, error } = await listQuery;

  const totalPages = Math.max(1, Math.ceil((matching ?? 0) / PAGE_SIZE));

  // Estas tarjetas describen el estado de la operación **ahora**, no un
  // periodo. Métricas mide ventanas de tiempo, así que sus cifras son
  // legítimamente distintas: cada pista lo dice para que nadie las compare de
  // frente y crea que no cuadran.
  const stats = [
    {
      label: 'Pedidos hoy',
      hint: 'desde las 00:00',
      value: String(ordersToday),
      icon: Inbox,
      accent: 'text-nitro-400',
    },
    {
      label: 'Por confirmar',
      hint: 'esperando ahora',
      value: String(counts.pending ?? 0),
      icon: Package,
      accent: 'text-amber-400',
    },
    {
      label: 'En curso',
      hint: 'confirmados y enviados',
      value: String((counts.confirmed ?? 0) + (counts.shipped ?? 0)),
      icon: Truck,
      accent: 'text-indigo-400',
    },
    {
      label: 'Cobrado',
      hint: 'histórico, todo lo entregado',
      value: formatCOP(deliveredValue),
      icon: CheckCircle2,
      accent: 'text-nitro-400',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Pedidos</h1>
          <p className="mt-1 text-ink-400">
            Pago contraentrega. Cambiar el estado aquí es lo que ve el cliente en su cuenta.
          </p>
        </div>

        {/* La descarga arrastra los filtros vigentes: quien está mirando los
            pendientes de Medellín espera un archivo con eso, no con todo. */}
        <a
          href={`/admin/exportar${exportQuery}`}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-ink-800 bg-ink-950 px-4 py-2.5 text-sm font-bold text-ink-200 transition-colors hover:border-nitro-700 hover:text-white"
        >
          <Download size={16} />
          Descargar CSV
        </a>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, hint, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
            <Icon size={20} className={accent} />
            <p className="mt-3 text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-ink-400">{label}</p>
            <p className="mt-0.5 text-xs text-ink-500">{hint}</p>
          </div>
        ))}
      </div>

      <OrderFilters counts={counts} />

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          No pudimos cargar los pedidos. Vuelve a intentarlo en un momento.
        </div>
      ) : !orders?.length ? (
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-12 text-center">
          <Inbox size={40} className="mx-auto mb-4 text-ink-600" />
          <p className="font-bold text-white">No hay pedidos que coincidan</p>
          <p className="mt-1 text-sm text-ink-400">
            Prueba quitando el filtro o buscando otro dato.
          </p>
        </div>
      ) : (
        <>
          {/* Tabla en pantallas anchas: comparar filas es lo que se hace aquí. */}
          <div className="hidden overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-800 bg-ink-900/60 text-xs uppercase tracking-wide text-ink-400">
                  <tr>
                    <th className="px-5 py-3 font-bold">Cliente</th>
                    <th className="px-5 py-3 font-bold">Contacto</th>
                    <th className="px-5 py-3 font-bold">Entrega</th>
                    <th className="px-5 py-3 font-bold">Fecha</th>
                    <th className="px-5 py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/70">
                  {orders.map((order) => (
                    <tr key={order.id} className="align-top transition-colors hover:bg-ink-900/60">
                      <td className="px-5 py-4">
                        <p className="font-bold text-white">{order.full_name}</p>
                        <p className="font-mono text-xs text-ink-500">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="mt-1 font-bold text-nitro-400">
                          {formatCOP(order.total_price ?? 0)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={`tel:${order.phone}`}
                          className="block font-medium text-ink-100 hover:text-nitro-400"
                        >
                          {order.phone}
                        </a>
                        <a
                          href={`mailto:${order.email}`}
                          className="block break-all text-xs text-ink-400 hover:text-nitro-400"
                        >
                          {order.email}
                        </a>
                      </td>
                      <td className="max-w-[15rem] px-5 py-4">
                        <p className="font-medium text-ink-100">{order.city}</p>
                        <p className="text-xs leading-relaxed text-ink-400">{order.address}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-400">
                        {formatOrderDateTime(order.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusSelect
                          orderId={order.id}
                          status={
                            isOrderStatus(order.status) ? order.status : 'pending'
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas en móvil: una tabla de cinco columnas no cabe. */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-ink-800 bg-ink-950 p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{order.full_name}</p>
                    <p className="font-mono text-xs text-ink-500">#{order.id.slice(0, 8)}</p>
                  </div>
                  <p className="shrink-0 font-bold text-nitro-400">
                    {formatCOP(order.total_price ?? 0)}
                  </p>
                </div>

                <dl className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-ink-100">
                    <Phone size={14} className="shrink-0 text-ink-500" />
                    <a href={`tel:${order.phone}`} className="font-medium">
                      {order.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-ink-400">
                    <Mail size={14} className="shrink-0 text-ink-500" />
                    <a href={`mailto:${order.email}`} className="break-all text-xs">
                      {order.email}
                    </a>
                  </div>
                  <div className="flex items-start gap-2 text-ink-400">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-ink-500" />
                    <span className="text-xs leading-relaxed">
                      {order.city} — {order.address}
                    </span>
                  </div>
                </dl>

                <div className="flex items-center justify-between gap-3 border-t border-ink-800 pt-3">
                  <span className="text-xs text-ink-500">
                    {formatOrderDateTime(order.created_at)}
                  </span>
                  <OrderStatusSelect
                    orderId={order.id}
                    status={isOrderStatus(order.status) ? order.status : 'pending'}
                    compact
                  />
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="Paginación">
              <PageLink
                page={page - 1}
                params={params}
                disabled={page <= 1}
                label="Anteriores"
              />
              <span className="text-sm text-ink-400">
                Página {page} de {totalPages} · {matching} pedidos
              </span>
              <PageLink
                page={page + 1}
                params={params}
                disabled={page >= totalPages}
                label="Siguientes"
              />
            </nav>
          )}
        </>
      )}

      <p className="mt-8 flex flex-wrap items-center gap-3 text-xs text-ink-500">
        {ORDER_STATUSES.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${ORDER_STATUS_META[status].dot}`} />
            {ORDER_STATUS_META[status].label}: {ORDER_STATUS_META[status].customerDetail}
          </span>
        ))}
      </p>
    </div>
  );
}

function PageLink({
  page,
  params,
  disabled,
  label,
}: {
  page: number;
  params: Awaited<SearchParams>;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-xl border border-ink-800 px-4 py-2 text-sm font-bold text-ink-600">
        {label}
      </span>
    );
  }

  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && key !== 'pagina') next.set(key, value);
  }
  next.set('pagina', String(page));

  return (
    <a
      href={`/admin?${next}`}
      className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2 text-sm font-bold text-ink-100 transition-colors hover:border-nitro-500 hover:text-nitro-400"
    >
      {label}
    </a>
  );
}
