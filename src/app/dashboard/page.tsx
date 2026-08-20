import { redirect } from 'next/navigation'
import { Check, Coffee, LogOut, MapPin, Package, Phone, User, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'
import { PRODUCT } from '@/lib/product'
import {
  ORDER_PROGRESSION,
  ORDER_STATUS_META,
  formatCOP,
  formatOrderDate,
  isOrderStatus,
  type OrderStatus,
} from '@/lib/orders'

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
        <XCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
        <div>
          <p className="font-bold text-rose-900">
            {ORDER_STATUS_META.cancelled.customerLabel}
          </p>
          <p className="text-sm text-rose-800">
            {ORDER_STATUS_META.cancelled.customerDetail}
          </p>
        </div>
      </div>
    )
  }

  const currentIndex = ORDER_PROGRESSION.indexOf(status)

  return (
    <ol className="space-y-0">
      {ORDER_PROGRESSION.map((step, index) => {
        const done = index < currentIndex
        const current = index === currentIndex
        const meta = ORDER_STATUS_META[step]
        const isLast = index === ORDER_PROGRESSION.length - 1

        return (
          <li key={step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : current
                      ? `border-gold-500 ${meta.dot} text-white`
                      : 'border-coffee-200 bg-white text-coffee-300'
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`w-0.5 flex-1 ${done ? 'bg-emerald-500' : 'bg-coffee-100'}`}
                  style={{ minHeight: '2rem' }}
                />
              )}
            </div>

            <div className={`pb-6 ${current ? '' : 'opacity-70'}`}>
              <p
                className={`font-bold ${current ? 'text-coffee-900' : done ? 'text-emerald-700' : 'text-coffee-500'}`}
              >
                {meta.customerLabel}
                {current && (
                  <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
                    Ahora
                  </span>
                )}
              </p>
              {current && (
                <p className="mt-1 text-sm leading-relaxed text-coffee-600">
                  {meta.customerDetail}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // La política RLS ya limita la consulta a los pedidos del correo verificado,
  // así que aquí no hace falta —ni conviene— volver a filtrar por correo: si
  // esta línea se olvidara, la base seguiría sin entregar pedidos ajenos.
  const { data: orders } = await supabase
    .from('orders_cod')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-coffee-50">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-coffee-100 bg-white p-8 shadow-xl md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-coffee-900 text-gold-500 shadow-lg shadow-coffee-900/20">
                <User size={40} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h1 className="mb-2 font-serif text-3xl font-bold text-coffee-900 md:text-4xl">
                  Hola, Barista
                </h1>
                <p className="flex items-center gap-2 break-all font-medium text-coffee-600">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  {user.email}
                </p>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border-2 border-coffee-100 bg-white px-6 py-3 font-bold text-coffee-700 shadow-sm transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl border border-coffee-100 bg-white p-8 shadow-sm">
          <h2 className="mb-8 flex items-center gap-3 font-serif text-2xl font-bold text-coffee-900">
            <Package className="text-gold-500" />
            Mis Pedidos
          </h2>

          {orders && orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => {
                const status: OrderStatus = isOrderStatus(order.status)
                  ? order.status
                  : 'pending'
                const meta = ORDER_STATUS_META[status]

                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-coffee-100 bg-coffee-50/30 p-6"
                  >
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-coffee-100 pb-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold text-coffee-400">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${meta.badge}`}
                          >
                            {meta.customerLabel}
                          </span>
                        </div>
                        <p className="font-bold text-coffee-900">{PRODUCT.kitName}</p>
                        <p className="text-sm text-coffee-500">
                          Pedido el {formatOrderDate(order.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-coffee-900">
                          {formatCOP(order.total_price ?? 0)}
                        </p>
                        <p className="text-sm text-coffee-500">{PRODUCT.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                      <StatusTimeline status={status} />

                      <dl className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-coffee-400" />
                          <div>
                            <dt className="font-bold text-coffee-800">Entrega</dt>
                            <dd className="leading-relaxed text-coffee-600">
                              {order.address}
                              <br />
                              {order.city}
                            </dd>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone size={16} className="mt-0.5 shrink-0 text-coffee-400" />
                          <div>
                            <dt className="font-bold text-coffee-800">Contacto</dt>
                            <dd className="text-coffee-600">{order.phone}</dd>
                          </div>
                        </div>

                        <p className="rounded-xl bg-white p-3 text-xs leading-relaxed text-coffee-500">
                          ¿Algo no cuadra? Escríbenos a{' '}
                          <a
                            href={`mailto:${PRODUCT.supportEmail}`}
                            className="font-bold text-gold-600 underline underline-offset-2"
                          >
                            {PRODUCT.supportEmail}
                          </a>
                          .
                        </p>
                      </dl>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-coffee-50 text-coffee-300">
                <Coffee size={48} strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-coffee-800">
                Aún no tienes pedidos
              </h3>
              <p className="mb-8 max-w-sm text-coffee-500">
                Cuando realices tu primera compra de {PRODUCT.name}, podrás ver el estado de
                tu envío aquí.
              </p>
              <a
                href="/#pricing"
                className="transform rounded-xl bg-gold-500 px-8 py-3 font-bold text-white shadow-lg shadow-gold-500/20 transition-all hover:scale-105 hover:bg-gold-600"
              >
                Ver el kit
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
