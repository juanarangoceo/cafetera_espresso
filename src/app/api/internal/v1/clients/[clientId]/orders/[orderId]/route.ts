import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';

/**
 * Mover el estado de un pedido y anotar su guía, desde Nitro Bot.
 *
 * Es la mitad que faltaba de «el bot escribe, Landing almacena»: el cliente
 * despacha desde Nitro Bot y este endpoint deja el hecho aquí, que es el
 * registro de verdad, con su fila en `order_status_events` igual que si lo
 * hubiera movido el panel.
 *
 * Nitro Bot solo manda tres destinos —`shipped`, `delivered`, `cancelled`—
 * porque su máquina de estados **solo avanza** y nunca vuelve a «pendiente».
 * Eso hace la correspondencia total y sin ambigüedad. `confirmed` no se puede
 * fijar desde aquí: en la operación de Nitro esa confirmación la hace Aria por
 * WhatsApp, no una pantalla.
 */
export const dynamic = 'force-dynamic';

/** Lo que el bot puede fijar. `pending` y `confirmed` quedan fuera a propósito. */
const REACHABLE = ['shipped', 'delivered', 'cancelled'] as const;

const patchSchema = z.object({
  status: z.enum(REACHABLE),
  trackingNumber: z.string().trim().min(3).max(80).nullable().optional(),
  trackingCarrier: z.string().trim().min(2).max(80).nullable().optional(),
  note: z.string().trim().min(1).max(300).nullable().optional(),
  /** Quién lo movió, para la auditoría. Es un correo del equipo del cliente. */
  changedBy: z.string().trim().email().max(320),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ clientId: string; orderId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId, body } = guard.context;

  const { clientId, orderId } = await context.params;
  if (!isUuid(clientId) || !isUuid(orderId)) {
    return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  // Cancelar sin motivo es exactamente el agujero que ya tiene la operación:
  // pedidos que se caen y nadie sabe por qué. No se acepta.
  if (parsed.data.status === 'cancelled' && !parsed.data.note) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: 'Cancelar exige un motivo.' },
      { status: 422 },
    );
  }

  // El pedido tiene que ser de una landing de ESTE cliente. Se comprueba con un
  // join explícito y no confiando en el `orderId`, que viaja en un formulario.
  const { data: order } = await service
    .from('orders_cod')
    .select('id, status, site_id, sites!inner(client_id)')
    .eq('id', orderId)
    .maybeSingle();
  const owner = (order as { sites?: { client_id?: string } } | null)?.sites?.client_id;
  if (!order || owner !== clientId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const from = order.status as string;
  if (from === parsed.data.status) {
    // No es un error: el cliente pulsó dos veces o el bot reintentó. Se
    // responde OK sin escribir una transición falsa hacia el mismo estado.
    return nitroBotJson(requestId, { orderId, status: from, changed: false });
  }
  if (from === 'cancelled') {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: 'Un pedido cancelado ya no cambia de estado.' },
      { status: 409 },
    );
  }

  const { error: updateError } = await service
    .from('orders_cod')
    .update({
      status: parsed.data.status,
      // La guía solo se pisa cuando llega una nueva: marcar «entregado» no
      // puede borrar el número que se escribió al despachar.
      ...(parsed.data.trackingNumber ? { tracking_number: parsed.data.trackingNumber } : {}),
      ...(parsed.data.trackingCarrier ? { tracking_carrier: parsed.data.trackingCarrier } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (updateError) {
    console.error('[nitro-bot] no se pudo mover el pedido:', updateError.message);
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
  }

  // El historial lo escribe el trigger `orders_cod_record_status_event`, no
  // este endpoint. Insertar aquí también dejaba DOS filas por cada despacho.
  //
  // Lo que el trigger no puede saber es quién lo movió —usa
  // `private.verified_email()`, que es NULL escribiendo con `service_role`— ni
  // por qué. Así que se completa su fila en vez de duplicarla.
  //
  // Best-effort: el hecho ya ocurrió y perder la autoría no puede convertirse
  // en un error que haga al bot reintentar y mover el pedido otra vez.
  const { data: event } = await service
    .from('order_status_events')
    .select('id')
    .eq('order_id', orderId)
    .eq('to_status', parsed.data.status)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (event) {
    const { error: eventError } = await service
      .from('order_status_events')
      .update({ changed_by: parsed.data.changedBy.toLowerCase(), note: parsed.data.note ?? null })
      .eq('id', event.id);
    if (eventError) {
      console.error('[nitro-bot] estado movido pero sin autoría:', eventError.message);
    }
  }

  return nitroBotJson(requestId, { orderId, status: parsed.data.status, changed: true });
}
