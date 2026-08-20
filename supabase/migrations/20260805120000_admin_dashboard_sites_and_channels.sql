-- Panel de administración: sitios, canales conmutables, administradores y
-- cambio de estado de pedidos.
--
-- Tres cosas entran aquí:
--
-- 1. `sites` y `site_id`. La operación va a manejar más de una landing desde el
--    mismo panel. Agregar la columna hoy, con la tabla de pedidos casi vacía,
--    cuesta una migración trivial; hacerlo después, con pedidos reales dentro,
--    obliga a reescribir políticas y respaldar datos vivos.
--
-- 2. `site_channels`. Chat, voz y WhatsApp estaban cableados en el layout, de
--    modo que apagarlos exigía un despliegue. Pasan a ser configuración por
--    sitio, editable desde el panel.
--
-- 3. Acceso administrativo. Hasta ahora `orders_cod` no tenía ningún camino de
--    `update`: el estado de un pedido no se podía cambiar desde ninguna parte.
--
-- Nota de seguridad importante, detallada en `docs/SECURITY.md`: la lectura de
-- pedidos del cliente se apoyaba en el claim `email` del JWT sin comprobar que
-- ese correo estuviera verificado. Con el registro abierto y la confirmación de
-- correo desactivada, cualquiera podía registrarse con el correo de un
-- comprador y leer su pedido. Aquí se exige `email_confirmed_at`.

-- ---------------------------------------------------------------------------
-- Sitios
-- ---------------------------------------------------------------------------

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$'),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sites_set_updated_at
before update on public.sites
for each row execute function private.set_updated_at();

-- Identificador fijo y no aleatorio: es el valor por defecto de
-- `orders_cod.site_id`, así que tiene que ser idéntico en local, en Preview y
-- en producción.
insert into public.sites (id, slug, name)
values ('c0ffee00-0000-4000-8000-000000000001', 'coffee-maker-pro', 'Coffee Maker Pro');

-- ---------------------------------------------------------------------------
-- Canales por sitio
-- ---------------------------------------------------------------------------

create table public.site_channels (
  site_id uuid primary key references public.sites(id) on delete cascade,
  chat_enabled boolean not null default true,
  voice_enabled boolean not null default true,
  whatsapp_enabled boolean not null default false,
  -- Formato internacional sin `+` ni separadores, tal como lo espera wa.me.
  whatsapp_phone text check (whatsapp_phone is null or whatsapp_phone ~ '^[0-9]{10,15}$'),
  whatsapp_message text check (
    whatsapp_message is null or char_length(btrim(whatsapp_message)) between 1 and 300
  ),
  updated_at timestamptz not null default now(),
  -- Un botón de WhatsApp encendido sin número lleva a una página de error de
  -- WhatsApp. La base lo impide en vez de confiar en la validación del panel.
  constraint whatsapp_enabled_needs_phone
    check (not whatsapp_enabled or whatsapp_phone is not null)
);

create trigger site_channels_set_updated_at
before update on public.site_channels
for each row execute function private.set_updated_at();

insert into public.site_channels (site_id)
values ('c0ffee00-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------

-- La lista se lleva por correo y no por `user_id` para poder autorizar a
-- alguien antes de que exista su cuenta. El correo solo cuenta si está
-- verificado, cosa que se comprueba contra `auth.users`, no contra el JWT.
create table public.admin_users (
  email text primary key check (
    email = lower(email)
    and char_length(email) <= 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  display_name text check (
    display_name is null or char_length(btrim(display_name)) between 2 and 120
  ),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Identidad verificada
-- ---------------------------------------------------------------------------

-- `auth.jwt() ->> 'email'` no sirve como frontera: refleja el correo con el que
-- se creó la sesión, verificado o no. `user_metadata` tampoco, porque el propio
-- usuario puede escribir ahí. La única fuente confiable es `auth.users`, que
-- exige `security definer` para ser legible desde una política.
create function private.verified_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(u.email)
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null;
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = private.verified_email()
  );
$$;

-- `usage` sobre el esquema no concede nada sobre los objetos que contiene: cada
-- función sigue necesitando su propio `execute`. El rol anónimo se queda sin
-- `usage`, así que no puede invocarlas ni aunque tuviera el permiso.
grant usage on schema private to authenticated;

revoke all on function private.verified_email() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.verified_email() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Pedidos: pertenencia a un sitio
-- ---------------------------------------------------------------------------

alter table public.orders_cod
  add column site_id uuid
    not null
    default 'c0ffee00-0000-4000-8000-000000000001'
    references public.sites(id) on delete restrict;

create index orders_cod_site_created_at_idx
  on public.orders_cod (site_id, created_at desc);

create index orders_cod_status_created_at_idx
  on public.orders_cod (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------------

alter table public.sites enable row level security;
alter table public.site_channels enable row level security;
alter table public.admin_users enable row level security;

-- La configuración de canales la consume la landing antes de que exista sesión,
-- y su contenido es público por naturaleza: qué widgets se muestran y a qué
-- número de WhatsApp apunta el botón que se ve en pantalla.
create policy "anyone_can_read_sites"
on public.sites
for select
to anon, authenticated
using (true);

create policy "anyone_can_read_site_channels"
on public.site_channels
for select
to anon, authenticated
using (true);

create policy "admins_can_update_site_channels"
on public.site_channels
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins_can_read_admin_users"
on public.admin_users
for select
to authenticated
using ((select private.is_admin()));

-- La lectura del cliente pasa a exigir correo verificado. Sin la comprobación,
-- registrarse con el correo ajeno bastaba para leer el pedido de otro.
drop policy "customers_can_read_their_orders" on public.orders_cod;

create policy "customers_can_read_their_verified_orders"
on public.orders_cod
for select
to authenticated
using (email = (select private.verified_email()));

create policy "admins_can_read_all_orders"
on public.orders_cod
for select
to authenticated
using ((select private.is_admin()));

create policy "admins_can_update_orders"
on public.orders_cod
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Permisos por columna
-- ---------------------------------------------------------------------------

revoke all on table public.sites from anon, authenticated;
revoke all on table public.site_channels from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;

grant select (id, slug, name) on table public.sites to anon, authenticated;

grant select (
  site_id, chat_enabled, voice_enabled,
  whatsapp_enabled, whatsapp_phone, whatsapp_message, updated_at
) on table public.site_channels to anon, authenticated;

-- El panel solo puede tocar la configuración de canales. Ni el sitio ni la
-- lista de administradores se editan desde la aplicación.
grant update (
  chat_enabled, voice_enabled,
  whatsapp_enabled, whatsapp_phone, whatsapp_message
) on table public.site_channels to authenticated;

grant select (email, display_name, created_at) on table public.admin_users to authenticated;

-- Un administrador cambia el estado de un pedido y nada más. No puede corregir
-- la dirección, el precio ni el correo: eso convertiría una cuenta del panel en
-- una vía para alterar el registro de una venta.
grant update (status) on table public.orders_cod to authenticated;

-- El servidor necesita poder fijar el sitio al crear el pedido.
grant insert (site_id) on table public.orders_cod to service_role;

-- Los defaults de Supabase de 2026 no otorgan nada sobre una tabla nueva, ni
-- siquiera a `service_role`. Sin estos grants la creación de administradores
-- falla y el portal del cliente no puede comprobar si un correo tiene pedidos
-- antes de enviarle el enlace de acceso. Es la misma trampa que dejó el
-- checkout sin camino de escritura al cerrar el acceso anónimo.
grant select, insert, update, delete on table public.admin_users to service_role;
grant select, insert, update on table public.sites to service_role;
grant select, insert, update on table public.site_channels to service_role;

-- Solo lectura: el portal del cliente consulta si el correo que pide acceso
-- tiene algún pedido. El estado lo cambia el administrador con su propia
-- sesión, de modo que la política RLS sea la que decide y no el código.
grant select on table public.orders_cod to service_role;
