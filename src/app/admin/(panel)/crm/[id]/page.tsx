import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Package, StickyNote } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import ContactForm from '@/components/admin/ContactForm';
import ContactNoteForm from '@/components/admin/ContactNoteForm';
import { CONTACT_SOURCE_LABEL, isContactSource, isContactStage } from '@/lib/crm';
import {
  ORDER_STATUS_META,
  formatCOP,
  formatOrderDateTime,
  isOrderStatus,
} from '@/lib/orders';

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const site = await getSelectedSite();
  const { id } = await params;

  const supabase = await createClient();

  const { data: contact } = await supabase
    .from('contacts')
    .select('id, site_id, full_name, email, phone, city, stage, source, next_follow_up, created_at')
    .eq('id', id)
    .maybeSingle();

  // Una ficha de otra tienda no debe abrirse desde la tienda activa: confundiría
  // el historial de dos operaciones distintas.
  if (!contact || (site && contact.site_id !== site.id)) notFound();

  const [ordersResult, notesResult] = await Promise.all([
    supabase
      .from('orders_cod')
      .select('id, status, total_price, city, address, created_at')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_notes')
      .select('id, body, author_email, created_at')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false }),
  ]);

  const orders = ordersResult.data ?? [];
  const notes = notesResult.data ?? [];

  const orderIds = orders.map((order) => order.id);
  const { data: events } = orderIds.length
    ? await supabase
        .from('order_status_events')
        .select('order_id, from_status, to_status, changed_by, created_at')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const eventsByOrder = new Map<string, typeof events>();
  for (const event of events ?? []) {
    const list = eventsByOrder.get(event.order_id) ?? [];
    list.push(event);
    eventsByOrder.set(event.order_id, list);
  }

  const delivered = orders.filter((order) => order.status === 'delivered');
  const deliveredValue = delivered.reduce((sum, order) => sum + (order.total_price ?? 0), 0);
  const source = isContactSource(contact.source) ? contact.source : 'manual';

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/crm"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={16} />
        Volver al CRM
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {contact.full_name}
        </h1>
        <p className="mt-1 text-ink-400">
          {CONTACT_SOURCE_LABEL[source]} · en la base desde{' '}
          {formatOrderDateTime(contact.created_at)}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Pedidos</p>
          <p className="mt-1 text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-sm text-ink-400">Entregados</p>
          <p className="mt-1 text-2xl font-bold text-white">{delivered.length}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-ink-800 bg-ink-950 p-5 lg:col-span-1">
          <p className="text-sm text-ink-400">Cobrado</p>
          <p className="mt-1 text-2xl font-bold text-nitro-400">{formatCOP(deliveredValue)}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Ficha</h2>
            <ContactForm
              mode="edit"
              contact={{
                id: contact.id,
                fullName: contact.full_name,
                email: contact.email,
                phone: contact.phone,
                city: contact.city,
                stage: isContactStage(contact.stage) ? contact.stage : 'nuevo',
                nextFollowUp: contact.next_follow_up,
              }}
            />
          </section>

          <section>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
              <StickyNote size={18} className="text-nitro-400" />
              Notas
            </h2>
            <p className="mb-4 text-sm text-ink-400">
              Queda registrado quién las escribió y cuándo.
            </p>

            <ContactNoteForm contactId={contact.id} />

            {notes.length > 0 && (
              <ul className="mt-6 space-y-3">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-ink-800 bg-ink-950 p-4"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
                      {note.body}
                    </p>
                    <p className="mt-2 text-xs text-ink-500">
                      {note.author_email} · {formatOrderDateTime(note.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
            <Package size={18} className="text-nitro-400" />
            Pedidos
          </h2>
          <p className="mb-4 text-sm text-ink-400">
            El recorrido de estados se registra desde que se activó el historial, así que
            los pedidos anteriores solo muestran su estado actual.
          </p>

          {orders.length ? (
            <ul className="space-y-3">
              {orders.map((order) => {
                const status = isOrderStatus(order.status) ? order.status : 'pending';
                const trail = eventsByOrder.get(order.id) ?? [];

                return (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-ink-800 bg-ink-950 p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-ink-500">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="mt-1 font-bold text-nitro-400">
                          {formatCOP(order.total_price ?? 0)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_META[status].darkBadge}`}
                      >
                        {ORDER_STATUS_META[status].label}
                      </span>
                    </div>

                    <p className="text-sm text-ink-400">
                      {order.city} — {order.address}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatOrderDateTime(order.created_at)}
                    </p>

                    {trail.length > 0 && (
                      <ol className="mt-4 space-y-1.5 border-t border-ink-800 pt-3">
                        {trail.map((event, index) => {
                          const to = isOrderStatus(event.to_status)
                            ? event.to_status
                            : 'pending';
                          return (
                            <li
                              key={`${event.order_id}-${index}`}
                              className="flex flex-wrap items-center gap-2 text-xs text-ink-400"
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${ORDER_STATUS_META[to].dot}`}
                              />
                              <span className="font-bold text-ink-200">
                                {event.from_status ? 'Pasó a ' : 'Creado como '}
                                {ORDER_STATUS_META[to].label.toLowerCase()}
                              </span>
                              <span>{formatOrderDateTime(event.created_at)}</span>
                              {event.changed_by && (
                                <span className="text-ink-500">por {event.changed_by}</span>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-ink-800 bg-ink-950 p-8 text-center text-sm text-ink-500">
              Todavía no ha comprado.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
