-- Frontera multi-inquilino: de una tienda con panel a una plataforma con
-- clientes.
--
-- Hasta aquí `sites` y `site_id` existían, pero no separaban nada. La
-- comprobación de acceso era `private.is_admin()`, global: cualquier cuenta de
-- la lista leía los pedidos, los contactos y las métricas de **todos** los
-- sitios. El selector de tienda del panel filtraba en la interfaz, no en la
-- base. Con un solo cliente eso no se notaba; con dos es una filtración.
--
-- Cinco cosas entran aquí:
--
-- 1. Dos clases de identidad. `platform_admins` (la operación de Nitro Landing,
--    ve todo) y `site_members` (el cliente, ve lo suyo). `admin_users`
--    desaparece: mantener dos fuentes de verdad sobre quién es administrador es
--    precisamente cómo se cuelan estos errores.
--
-- 2. Políticas reescritas contra `private.accessible_site_ids()`. El patrón es
--    el mismo en todas las tablas y sustituye a `private.is_admin()`.
--
-- 3. Precio por sitio. `orders_cod` tenía `check (total_price = 490000)`
--    cableado: la base **rechazaba** cualquier pedido de otro producto, así que
--    un segundo cliente no podía vender nada. El precio pasa a
--    `site_products` y lo hace cumplir un trigger.
--
-- 4. `site_api_keys`. Cada landing vive en su propio proyecto de Vercel y no
--    puede llevar `SUPABASE_SECRET_KEY` encima: esa clave se salta el RLS de
--    todos los inquilinos, y una filtración en el proyecto de un cliente
--    expondría los pedidos del resto. La landing solo conoce su llave y habla
--    con la API de la plataforma.
--
-- 5. `site_accounts`. Datos de la cuenta del cliente y su facturación, visibles
--    solo para la plataforma.

-- ---------------------------------------------------------------------------
-- Identidad: plataforma y miembros de sitio
-- ---------------------------------------------------------------------------

-- Igual que `admin_users`, la lista se lleva por correo y no por `user_id`,
-- para poder autorizar a alguien antes de que exista su cuenta. El correo solo
-- cuenta si está verificado, cosa que comprueba `private.verified_email()`
-- contra `auth.users` y no contra el claim del JWT.
create table public.platform_admins (
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

create table public.site_members (
  site_id uuid not null references public.sites(id) on delete cascade,
  email text not null check (
    email = lower(email)
    and char_length(email) <= 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  -- `owner` es el cliente dueño de la landing; `staff`, alguien de su equipo.
  -- Hoy el panel no los distingue en permisos, pero la columna evita una
  -- migración cuando lo haga.
  role text not null default 'owner' check (role in ('owner', 'staff')),
  display_name text check (
    display_name is null or char_length(btrim(display_name)) between 2 and 120
  ),
  created_at timestamptz not null default now(),
  primary key (site_id, email)
);

create index site_members_email_idx on public.site_members (email);

-- Traspaso de la lista anterior. Se copia dentro de la misma transacción en vez
-- de rehacerla a mano: si esto se pierde, el dueño se queda fuera de su propio
-- panel y sin camino de vuelta, porque la creación de administradores exige la
-- clave de servicio.
insert into public.platform_admins (email, display_name, created_at)
select email, display_name, created_at from public.admin_users;

-- ---------------------------------------------------------------------------
-- Funciones de acceso
-- ---------------------------------------------------------------------------

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.email = private.verified_email()
  );
$$;

-- Los sitios que la sesión actual puede ver. Es el único lugar donde se decide
-- eso: las políticas de todas las tablas se apoyan aquí, de modo que cambiar la
-- regla de acceso no obliga a revisar tabla por tabla.
--
-- `security definer` a propósito: por dentro consulta `sites` y `site_members`
-- saltándose sus propias políticas, que es lo que evita la recursión.
create function private.accessible_site_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.sites s
  where private.is_platform_admin()
  union
  select m.site_id
  from public.site_members m
  where m.email = private.verified_email();
$$;

revoke all on function private.is_platform_admin() from public;
revoke all on function private.accessible_site_ids() from public;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.accessible_site_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Producto por sitio
-- ---------------------------------------------------------------------------

-- Una fila por sitio hoy. La tabla existe en plural desde el principio porque
-- añadir catálogo después, con pedidos reales apuntando a un precio suelto,
-- cuesta mucho más que dejar la puerta abierta ahora.
create table public.site_products (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  price integer not null check (price > 0),
  currency text not null default 'COP' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_products_site_active_idx
  on public.site_products (site_id) where is_active;

create trigger site_products_set_updated_at
before update on public.site_products
for each row execute function private.set_updated_at();

-- El producto que ya se vende. El precio sale de `src/lib/product.ts`, que
-- sigue siendo la fuente de verdad comercial de la landing; a partir de ahora
-- la API rechaza el pedido si ambos dejan de coincidir, para que la divergencia
-- falle de forma ruidosa en vez de cobrar mal.
insert into public.site_products (id, site_id, name, price, currency)
values (
  'c0ffee00-0000-4000-8000-000000000101',
  'c0ffee00-0000-4000-8000-000000000001',
  'Kit Coffee Maker Pro',
  490000,
  'COP'
);

alter table public.orders_cod
  add column product_id uuid references public.site_products(id) on delete restrict;

-- Los pedidos que ya existen son todos del único producto que había.
update public.orders_cod
set product_id = 'c0ffee00-0000-4000-8000-000000000101'
where product_id is null;

create index orders_cod_product_idx on public.orders_cod (product_id);

-- El precio deja de estar cableado a una cifra, pero no queda sin vigilancia:
-- la comprobación se muda del `check` al trigger, en el mismo cambio, para no
-- abrir una ventana en la que cualquier importe sea aceptable.
alter table public.orders_cod drop constraint orders_cod_total_price_check;
alter table public.orders_cod alter column total_price drop default;

create function private.enforce_order_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected integer;
  candidates integer;
begin
  -- Sin producto explícito se resuelve solo si el sitio tiene exactamente uno
  -- activo. Con varios la ambigüedad se rechaza en vez de adivinar: elegir mal
  -- aquí significa cobrar un precio que no era.
  if new.product_id is null then
    select count(*) into candidates
    from public.site_products p
    where p.site_id = new.site_id and p.is_active;

    if candidates <> 1 then
      raise exception
        'El pedido no indica producto y el sitio tiene % productos activos', candidates
        using errcode = '23514';
    end if;

    select p.id into new.product_id
    from public.site_products p
    where p.site_id = new.site_id and p.is_active;
  end if;

  select p.price into expected
  from public.site_products p
  where p.id = new.product_id
    and p.site_id = new.site_id
    and p.is_active;

  if expected is null then
    raise exception 'El producto no pertenece a este sitio o no está activo'
      using errcode = '23514';
  end if;

  if new.total_price is null then
    new.total_price := expected;
  elsif new.total_price is distinct from expected then
    raise exception 'El precio del pedido no coincide con el del producto'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- Antes que el trigger de contacto y el de límite, para que un pedido con
-- precio manipulado ni siquiera llegue a crear una ficha en el CRM.
create trigger orders_cod_enforce_price
before insert on public.orders_cod
for each row execute function private.enforce_order_price();

-- ---------------------------------------------------------------------------
-- Llaves de ingesta por sitio
-- ---------------------------------------------------------------------------

-- Se guarda el `sha256` de la llave en hexadecimal, nunca la llave. El prefijo
-- visible (`nl_live_a1b2…`) solo sirve para reconocerla en el panel: quien
-- pierda la llave la revoca y emite otra, no la recupera.
create table public.site_api_keys (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  label text check (label is null or char_length(btrim(label)) between 2 and 120),
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  prefix text not null check (char_length(prefix) between 8 and 24),
  created_at timestamptz not null default now(),
  created_by text,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index site_api_keys_site_idx on public.site_api_keys (site_id);

-- ---------------------------------------------------------------------------
-- Cuenta del cliente
-- ---------------------------------------------------------------------------

-- Quién es el cliente y qué paga. Vive aparte de `sites` porque `sites` lo lee
-- la landing sin sesión: mezclar aquí la tarifa mensual la publicaría.
--
-- Registro interno, no cobro. No hay pasarela ni dato de tarjeta: el panel
-- recuerda cuánto y cuándo, y el cobro ocurre fuera.
create table public.site_accounts (
  site_id uuid primary key references public.sites(id) on delete cascade,
  client_name text not null check (char_length(btrim(client_name)) between 2 and 160),
  contact_email text check (
    contact_email is null or contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  contact_phone text check (contact_phone is null or contact_phone ~ '^[0-9]{10,15}$'),
  plan text not null default 'basico' check (char_length(btrim(plan)) between 2 and 60),
  monthly_fee integer check (monthly_fee is null or monthly_fee >= 0),
  currency text not null default 'COP' check (currency ~ '^[A-Z]{3}$'),
  billing_day smallint check (billing_day is null or billing_day between 1 and 28),
  status text not null default 'activo' check (status in ('activo', 'pausado', 'moroso', 'cerrado')),
  next_invoice_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_accounts_set_updated_at
before update on public.site_accounts
for each row execute function private.set_updated_at();

insert into public.site_accounts (site_id, client_name, plan, monthly_fee, status)
values (
  'c0ffee00-0000-4000-8000-000000000001',
  'Juan David Arango',
  'propio',
  0,
  'activo'
);

-- ---------------------------------------------------------------------------
-- Sitios: presentación y estado
-- ---------------------------------------------------------------------------

alter table public.sites
  add column primary_domain text unique check (
    primary_domain is null
    or primary_domain ~ '^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?\.[a-z]{2,63}$'
  ),
  add column brand_color text check (brand_color is null or brand_color ~ '^#[0-9a-f]{6}$'),
  add column logo_url text check (logo_url is null or char_length(logo_url) <= 500),
  add column is_active boolean not null default true;

update public.sites
set primary_domain = 'coffeemakerprofesional.com'
where id = 'c0ffee00-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------------

alter table public.platform_admins enable row level security;
alter table public.site_members enable row level security;
alter table public.site_products enable row level security;
alter table public.site_api_keys enable row level security;
alter table public.site_accounts enable row level security;

-- `sites` dejaba leer la lista entera a cualquier sesión. Con un solo cliente
-- era inocuo; con varios, un cliente vería el nombre y el dominio de los demás.
-- La landing sigue necesitando leer el suyo sin sesión, así que el acceso se
-- parte: anónimo lee todo (sin él no hay landing), autenticado solo lo suyo.
drop policy "anyone_can_read_sites" on public.sites;

create policy "anon_can_read_sites"
on public.sites
for select
to anon
using (true);

create policy "members_can_read_their_sites"
on public.sites
for select
to authenticated
using (id in (select private.accessible_site_ids()));

drop policy "anyone_can_read_site_channels" on public.site_channels;

create policy "anon_can_read_site_channels"
on public.site_channels
for select
to anon
using (true);

create policy "members_can_read_their_site_channels"
on public.site_channels
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

drop policy "admins_can_update_site_channels" on public.site_channels;

create policy "members_can_update_their_site_channels"
on public.site_channels
for update
to authenticated
using (site_id in (select private.accessible_site_ids()))
with check (site_id in (select private.accessible_site_ids()));

-- Pedidos. La lectura del comprador no cambia: sigue siendo su correo
-- verificado. Lo que cambia es el otro lado, que deja de ser global.
drop policy "admins_can_read_all_orders" on public.orders_cod;
drop policy "admins_can_update_orders" on public.orders_cod;

create policy "members_can_read_their_site_orders"
on public.orders_cod
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

create policy "members_can_update_their_site_orders"
on public.orders_cod
for update
to authenticated
using (site_id in (select private.accessible_site_ids()))
with check (site_id in (select private.accessible_site_ids()));

drop policy "admins_can_read_all_order_events" on public.order_status_events;

create policy "members_can_read_their_site_order_events"
on public.order_status_events
for select
to authenticated
using (
  exists (
    select 1 from public.orders_cod o
    where o.id = order_status_events.order_id
      and o.site_id in (select private.accessible_site_ids())
  )
);

drop policy "admins_manage_contacts" on public.contacts;

create policy "members_manage_their_site_contacts"
on public.contacts
for all
to authenticated
using (site_id in (select private.accessible_site_ids()))
with check (site_id in (select private.accessible_site_ids()));

-- `contact_notes` no tiene `site_id`: cuelga del contacto. Se pasa por él, de
-- modo que solo se ven las notas de una ficha que ya se puede ver.
drop policy "admins_manage_contact_notes" on public.contact_notes;

create policy "members_manage_their_site_contact_notes"
on public.contact_notes
for all
to authenticated
using (
  exists (
    select 1 from public.contacts c
    where c.id = contact_notes.contact_id
      and c.site_id in (select private.accessible_site_ids())
  )
)
with check (
  exists (
    select 1 from public.contacts c
    where c.id = contact_notes.contact_id
      and c.site_id in (select private.accessible_site_ids())
  )
);

-- Identidad. Un miembro ve a sus compañeros de sitio; la lista de la plataforma
-- solo la ve la plataforma.
create policy "platform_can_read_platform_admins"
on public.platform_admins
for select
to authenticated
using ((select private.is_platform_admin()));

create policy "members_can_read_their_site_members"
on public.site_members
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

-- El producto lo lee la landing sin sesión para pintar el precio, igual que los
-- canales. Editarlo es cosa de la plataforma, no del cliente: es el importe que
-- se cobra contraentrega.
create policy "anon_can_read_active_site_products"
on public.site_products
for select
to anon
using (is_active);

create policy "members_can_read_their_site_products"
on public.site_products
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

-- Las llaves no tienen política de lectura para nadie con sesión. Ni siquiera
-- la plataforma las consulta con su sesión del panel: se manejan con la clave
-- de servicio desde el servidor. Una tabla con RLS activo y sin políticas no
-- devuelve filas, que es exactamente lo que se busca aquí.

create policy "platform_manages_site_accounts"
on public.site_accounts
for all
to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

-- ---------------------------------------------------------------------------
-- Retirada de la identidad global
-- ---------------------------------------------------------------------------

-- La tabla primero: su política `admins_can_read_admin_users` es la última que
-- todavía se apoya en `private.is_admin()`, y Postgres no deja soltar la
-- función mientras exista.
--
-- La función se elimina en vez de dejarla inerte: una que sigue existiendo
-- acaba usándose, y su semántica —administrador de todo— es justo la que este
-- cambio viene a quitar.
drop table public.admin_users;
drop function private.is_admin();

-- ---------------------------------------------------------------------------
-- Permisos por columna
-- ---------------------------------------------------------------------------

-- Los defaults de Supabase de 2026 no otorgan nada sobre una tabla nueva, ni
-- siquiera a `service_role`. Es la trampa que ya dejó el checkout sin camino de
-- escritura una vez; aquí se otorga explícitamente desde el principio.
revoke all on table public.platform_admins from anon, authenticated;
revoke all on table public.site_members from anon, authenticated;
revoke all on table public.site_products from anon, authenticated;
revoke all on table public.site_api_keys from anon, authenticated;
revoke all on table public.site_accounts from anon, authenticated;

grant select (email, display_name, created_at) on table public.platform_admins to authenticated;
grant select (site_id, email, role, display_name, created_at) on table public.site_members to authenticated;

grant select (id, site_id, name, price, currency, is_active) on table public.site_products to anon, authenticated;

-- La cuenta y la facturación las edita la plataforma desde el panel, con su
-- propia sesión, para que sea el RLS quien decida y no el código del servidor.
grant select on table public.site_accounts to authenticated;
grant insert (
  site_id, client_name, contact_email, contact_phone, plan,
  monthly_fee, currency, billing_day, status, next_invoice_date, notes
) on table public.site_accounts to authenticated;
grant update (
  client_name, contact_email, contact_phone, plan,
  monthly_fee, currency, billing_day, status, next_invoice_date, notes
) on table public.site_accounts to authenticated;

-- El alta de clientes, la emisión de llaves y la ingesta de pedidos ocurren en
-- el servidor con la clave de servicio.
grant select, insert, update, delete on table public.platform_admins to service_role;
grant select, insert, update, delete on table public.site_members to service_role;
grant select, insert, update, delete on table public.site_products to service_role;
grant select, insert, update on table public.site_api_keys to service_role;
grant select, insert, update on table public.site_accounts to service_role;

-- El nuevo vínculo del pedido con su producto lo fija el servidor al crearlo.
grant insert (product_id) on table public.orders_cod to service_role;

-- Los sitios se dan de alta desde el panel de plataforma con la clave de
-- servicio; `sites` ya tenía sus grants, aquí solo se suma el borrado para
-- poder deshacer un alta equivocada antes de que tenga pedidos.
grant delete on table public.sites to service_role;
