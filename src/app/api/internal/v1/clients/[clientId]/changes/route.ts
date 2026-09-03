import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';

/**
 * Pedidos y contactos de un cliente que cambiaron desde un instante dado.
 *
 * Por qué *pull* con cursor y no un outbox con ACK: un outbox obliga a una
 * tabla, un trigger por cada tabla observada, un lease y un reintento en el
 * emisor, y a que el consumidor confirme. Aquí el consumidor —Nitro Bot— ya es
 * idempotente por `source_event_id`, así que el mismo evento entregado dos
 * veces no hace nada. Con eso, la garantía «al menos una vez» se consigue sin
 * estado adicional en Nitro Landing: si Nitro Bot se cae antes de guardar su
 * cursor, vuelve a pedir la misma ventana y los repetidos se descartan solos.
 *
 * El cursor es `updated_at` y la comparación es **`>=`, no `>`**. Con `>` se
 * perdería en silencio cualquier fila que compartiera el milisegundo exacto del
 * corte; con `>=` se reenvía la del borde, que es precisamente el caso que la
 * idempotencia sabe absorber. Perder un pedido es peor que repetirlo.
 */
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * Identidad del evento: la fila **y su versión**. Reenviar la misma versión es
 * un duplicado que el consumidor ignora; un `updated_at` nuevo es un evento
 * nuevo que sí debe aplicarse. Determinista para que dos lecturas de la misma
 * ventana produzcan exactamente los mismos ids.
 */
function eventId(kind: string, rowId: string, version: string): string {
  const hex = createHash('sha256').update(`${kind}:${rowId}:${version}`).digest('hex');
  // Formato UUID v5-like: el consumidor lo guarda en una columna `uuid`.
  const variant = ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId } = guard.context;

  const clientId = (await context.params).clientId;
  if (!isUuid(clientId)) {
    return NextResponse.json({ ok: false, error: 'bad_client_id' }, { status: 400 });
  }

  const url = new URL(request.url);
  const sinceRaw = url.searchParams.get('since');
  const since =
    sinceRaw && Number.isFinite(Date.parse(sinceRaw))
      ? new Date(sinceRaw).toISOString()
      : // Sin cursor se arranca desde el epoch: la primera sincronización de un
        // cliente recién vinculado tiene que traer su historia, no solo lo de hoy.
        new Date(0).toISOString();
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
  );

  const { data: sites } = await service
    .from('sites')
    .select('id, name')
    .eq('client_id', clientId);
  const siteIds = (sites ?? []).map((site) => site.id);
  if (siteIds.length === 0) {
    return nitroBotJson(requestId, { orders: [], contacts: [], cursor: since, hasMore: false });
  }
  const siteName = new Map((sites ?? []).map((site) => [site.id, site.name]));

  const [{ data: orderRows }, { data: contactRows }, { data: products }] = await Promise.all([
    service
      .from('orders_cod')
      .select('id, site_id, product_id, full_name, email, phone, city, address, status, total_price, created_at, updated_at')
      .in('site_id', siteIds)
      .gte('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(limit),
    service
      .from('contacts')
      .select('id, site_id, full_name, email, phone, city, stage, source, created_at, updated_at')
      .in('site_id', siteIds)
      .gte('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(limit),
    service.from('site_products').select('id, name, price, currency').in('site_id', siteIds),
  ]);

  const product = new Map((products ?? []).map((row) => [row.id, row]));

  const orders = (orderRows ?? []).map((order) => {
    const item = order.product_id ? product.get(order.product_id) : null;
    return {
      eventId: eventId('order', order.id, order.updated_at),
      id: order.id,
      siteId: order.site_id,
      siteName: siteName.get(order.site_id) ?? null,
      status: order.status,
      customerName: order.full_name,
      customerPhone: order.phone,
      customerEmail: order.email,
      city: order.city,
      address: order.address,
      totalAmount: Number(order.total_price ?? 0),
      currency: item?.currency ?? 'COP',
      items: item
        ? [{ title: item.name, quantity: 1, unitAmount: Number(item.price ?? order.total_price ?? 0) }]
        : [],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  });

  const contacts = (contactRows ?? []).map((contact) => ({
    eventId: eventId('contact', contact.id, contact.updated_at),
    id: contact.id,
    siteId: contact.site_id,
    fullName: contact.full_name,
    email: contact.email,
    phone: contact.phone,
    city: contact.city,
    stage: contact.stage,
    source: contact.source,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
  }));

  // El cursor solo avanza hasta donde se leyó de VERDAD, y si alguna de las dos
  // listas llegó al tope se avisa para que el consumidor vuelva enseguida en
  // vez de esperar al siguiente minuto. Avanzarlo más allá se saltaría filas.
  const hasMore = orders.length >= limit || contacts.length >= limit;
  const marks = [
    ...orders.map((order) => order.updatedAt),
    ...contacts.map((contact) => contact.updatedAt),
  ].filter(Boolean) as string[];
  const cursor = marks.length ? marks.sort().at(-1)! : since;

  return nitroBotJson(requestId, { orders, contacts, cursor, hasMore });
}
