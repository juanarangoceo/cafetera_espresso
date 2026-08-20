-- Límite de creación de pedidos contraentrega.
--
-- La venta es contraentrega: un pedido no requiere pago para generarse, así que
-- un formulario abierto se traduce en despachos físicos y fletes reales. La
-- publishable key es pública por diseño, de modo que la validación no puede
-- vivir solo en la aplicación: cualquiera puede insertar contra la Data API.
--
-- Este trigger se ejecuta en la base y por tanto cubre todos los caminos:
-- formulario, chat escrito, asistente de voz y llamadas directas a la API.

create function private.enforce_order_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_orders integer;
begin
  select count(*)
  into recent_orders
  from public.orders_cod
  where (email = new.email or phone = new.phone)
    and created_at > now() - interval '1 hour';

  if recent_orders >= 3 then
    raise exception 'Ya registramos varios pedidos con estos datos. Intenta de nuevo en una hora o escríbenos.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger orders_cod_rate_limit
before insert on public.orders_cod
for each row execute function private.enforce_order_rate_limit();
