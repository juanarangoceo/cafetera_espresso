-- Cierra la creación anónima de pedidos contra la Data API.
--
-- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` viaja al navegador porque el login la
-- necesita, así que cualquiera podía extraerla del bundle e insertar pedidos
-- directamente contra PostgREST, evitando la verificación de humano que corre
-- en el server action `createOrder`. En una venta contraentrega eso se traduce
-- en despachos físicos y fletes reales.
--
-- A partir de aquí el único camino hacia un pedido es el servidor, que escribe
-- con `SUPABASE_SECRET_KEY`. Requiere que esa variable exista en Vercel: sin
-- ella el checkout queda sin permiso para insertar.

drop policy "visitors_can_create_pending_orders" on public.orders_cod;

revoke insert on table public.orders_cod from anon, authenticated;

-- El rol del servidor necesita el permiso de forma explícita. La migración
-- inicial revocó todo sobre la tabla y solo otorgó columnas a `anon`, así que
-- sin esto el checkout se queda sin ningún camino para escribir.
grant insert (full_name, email, phone, city, address, total_price, status)
  on table public.orders_cod to service_role;

-- La lectura autenticada por correo se conserva: es la que alimenta el panel
-- del cliente y no abre ninguna vía de escritura.
