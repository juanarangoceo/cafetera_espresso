-- La plataforma corporativa y la operacion de cada cliente son dos productos
-- distintos. Antes `site_accounts` obligaba a que cliente y landing fueran la
-- misma cosa, y `accessible_site_ids()` entregaba a la plataforma todos los
-- pedidos y contactos. Esta migracion separa ambas responsabilidades.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  legal_name text check (legal_name is null or char_length(btrim(legal_name)) between 2 and 200),
  contact_name text check (contact_name is null or char_length(btrim(contact_name)) between 2 and 160),
  contact_email text check (
    contact_email is null or contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  contact_phone text check (contact_phone is null or contact_phone ~ '^[0-9]{10,15}$'),
  plan text not null default 'basico' check (char_length(btrim(plan)) between 2 and 60),
  monthly_fee integer check (monthly_fee is null or monthly_fee >= 0),
  currency text not null default 'COP' check (currency ~ '^[A-Z]{3}$'),
  billing_day smallint check (billing_day is null or billing_day between 1 and 28),
  status text not null default 'activo' check (status in ('activo', 'pausado', 'moroso', 'cerrado')),
  onboarding_status text not null default 'configurando'
    check (onboarding_status in ('pendiente', 'configurando', 'activo', 'pausado')),
  next_invoice_date date,
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

-- Usar el id del sitio como id inicial conserva una migracion determinista.
-- Los clientes nuevos reciben un UUID independiente y pueden agrupar varias
-- landings mediante `sites.client_id`.
insert into public.clients (
  id, name, contact_email, contact_phone, plan, monthly_fee, currency,
  billing_day, status, next_invoice_date, notes, created_at, updated_at
)
select
  site_id, client_name, contact_email, contact_phone, plan, monthly_fee,
  currency, billing_day, status, next_invoice_date, notes, created_at, updated_at
from public.site_accounts;

alter table public.sites
  add column client_id uuid references public.clients(id) on delete restrict,
  add column repository_url text check (repository_url is null or char_length(repository_url) <= 500),
  add column vercel_project text check (vercel_project is null or char_length(vercel_project) <= 160),
  add column production_url text check (production_url is null or char_length(production_url) <= 500),
  add column integration_notes text check (integration_notes is null or char_length(integration_notes) <= 4000);

update public.sites set client_id = id;
alter table public.sites alter column client_id set not null;
create index sites_client_id_idx on public.sites (client_id);

-- La plataforma nunca consulta estas tablas con la sesion del navegador.
-- Tras comprobar `platform_admins`, las acciones del servidor usan service_role.
alter table public.clients enable row level security;
revoke all on table public.clients from anon, authenticated;
grant select, insert, update, delete on table public.clients to service_role;

-- `accessible_site_ids` ya no incluye a la plataforma. Solo una membresia
-- explicita habilita pedidos, CRM, metricas y canales operativos.
create or replace function private.accessible_site_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.site_id
  from public.site_members m
  where m.email = private.verified_email();
$$;

-- Las columnas internas de despliegue viven en `sites` por simplicidad del
-- panel, pero se retiran de los roles publicos por columna. Los campos publicos
-- de la landing conservan sus permisos existentes.
revoke select on table public.sites from anon, authenticated;
grant select (id, slug, name, primary_domain, brand_color, logo_url, is_active)
on table public.sites to anon, authenticated;
grant select (client_id) on table public.sites to authenticated;
grant insert, update, delete on table public.sites to service_role;

drop table public.site_accounts;
