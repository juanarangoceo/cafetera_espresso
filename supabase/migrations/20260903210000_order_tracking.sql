-- La guía de la transportadora, que hasta hoy no existía en ninguna parte.
--
-- `orders_cod` guardaba el estado del pedido pero no cómo se despachó, así que
-- cuando el comprador reclamaba no había número que darle. Nitro Bot sí tiene
-- el campo en su panel de Pedidos desde que existe el módulo nativo; lo que
-- faltaba era dónde guardarlo del lado que manda, que es este.
--
-- El motivo va en `order_status_events` y no aquí a propósito: pertenece a la
-- TRANSICIÓN, no al pedido. Un pedido cancelado y luego reabierto no debe
-- arrastrar el motivo de la cancelación anterior como si fuera actual.
alter table public.orders_cod
  add column if not exists tracking_number text
    check (tracking_number is null or char_length(btrim(tracking_number)) between 3 and 80),
  add column if not exists tracking_carrier text
    check (tracking_carrier is null or char_length(btrim(tracking_carrier)) between 2 and 80);

alter table public.order_status_events
  add column if not exists note text
    check (note is null or char_length(btrim(note)) between 1 and 300);

comment on column public.orders_cod.tracking_number is
  'Número de guía de la transportadora. Lo escribe Nitro Bot al marcar despachado.';
comment on column public.order_status_events.note is
  'Por qué se movió el estado. Obligatorio al cancelar, que es donde se pierde el dinero.';

-- Lectura para la sesión del cliente, que es lo que permite que el panel viejo
-- siga sirviendo de respaldo durante la transición. La ESCRITURA no se abre:
-- el estado y la guía los escribe Nitro Bot con `service_role`, que es la
-- decisión de «el bot escribe, Landing almacena».
grant select (tracking_number, tracking_carrier) on table public.orders_cod to authenticated;
grant select (note) on table public.order_status_events to authenticated;
