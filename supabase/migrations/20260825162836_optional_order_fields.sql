-- Campos opcionales del formulario de pedido.
--
-- Hasta ahora `orders_cod` exigía los cinco datos del comprador. Eso vale para
-- una sola landing, pero no para varias: Lulla Bites vende en Guatemala y su
-- dueño quiere decidir si pide correo y ciudad.
--
-- Solo estos dos se pueden apagar. Nombre, celular y dirección siguen siendo
-- obligatorios en la base: sin ellos no se puede despachar un contraentrega, y
-- el celular además sostiene el límite antiabuso y la unión con el contacto.
--
-- La decisión vive en `site_channels`, que ya es donde el cliente configura el
-- comportamiento de su landing y lo que `/api/v1/site` le entrega.

alter table public.orders_cod alter column email drop not null;
alter table public.orders_cod alter column city drop not null;

-- Los checks pasan a "nulo o válido". Un correo presente sigue teniendo que
-- estar en minúsculas y con forma de correo: relajar la obligatoriedad no es
-- relajar el formato.
alter table public.orders_cod drop constraint orders_cod_email_check;
alter table public.orders_cod add constraint orders_cod_email_check check (
  email is null or (
    email = lower(email)
    and char_length(email) <= 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

alter table public.orders_cod drop constraint orders_cod_city_check;
alter table public.orders_cod add constraint orders_cod_city_check check (
  city is null or (
    char_length(btrim(city)) >= 1
    and char_length(btrim(city)) <= 120
  )
);

alter table public.site_channels
  add column require_email boolean not null default true,
  add column require_city boolean not null default true;

comment on column public.site_channels.require_email is
  'Si la landing debe exigir correo. Apagarlo no permite guardar un correo inválido, solo ninguno.';
comment on column public.site_channels.require_city is
  'Si la landing debe exigir ciudad.';
