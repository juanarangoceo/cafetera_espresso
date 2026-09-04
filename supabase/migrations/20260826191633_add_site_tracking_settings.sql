-- Configuración pública de medición por landing. El identificador del Pixel no
-- es un secreto: termina necesariamente en el navegador. Lo que nunca se
-- acepta aquí es código arbitrario ni un token de Conversions API.
create table public.site_tracking (
  site_id uuid primary key references public.sites(id) on delete cascade,
  meta_pixel_enabled boolean not null default false,
  meta_pixel_id text,
  updated_at timestamptz not null default now(),
  constraint site_tracking_meta_pixel_id_check
    check (meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{5,20}$'),
  constraint site_tracking_enabled_requires_id_check
    check (not meta_pixel_enabled or meta_pixel_id is not null)
);

comment on table public.site_tracking is
  'Identificadores públicos y activación de herramientas de medición por landing.';
comment on column public.site_tracking.meta_pixel_id is
  'ID público del Pixel/Dataset de Meta. Nunca contiene código ni tokens de API.';

create trigger site_tracking_set_updated_at
before update on public.site_tracking
for each row execute function private.set_updated_at();

-- Todas las landings existentes nacen apagadas salvo Coffee Maker Pro, cuyo
-- Pixel ya estaba activo y cableado en el código. El runtime nuevo además lo
-- bloqueará hasta que el visitante acepte analítica y publicidad.
insert into public.site_tracking (site_id, meta_pixel_enabled, meta_pixel_id)
select
  id,
  slug = 'coffee-maker-pro',
  case when slug = 'coffee-maker-pro' then '562585775680913' else null end
from public.sites;

alter table public.site_tracking enable row level security;

create policy "anon_can_read_site_tracking"
on public.site_tracking
for select
to anon
using (true);

create policy "members_can_read_their_site_tracking"
on public.site_tracking
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

create policy "members_can_update_their_site_tracking"
on public.site_tracking
for update
to authenticated
using (site_id in (select private.accessible_site_ids()))
with check (site_id in (select private.accessible_site_ids()));

-- Los defaults de Supabase ya no exponen tablas nuevas. Los grants explícitos
-- también impiden que un miembro cambie site_id o updated_at.
revoke all on table public.site_tracking from anon, authenticated;
grant select (site_id, meta_pixel_enabled, meta_pixel_id)
  on table public.site_tracking to anon, authenticated;
grant update (meta_pixel_enabled, meta_pixel_id)
  on table public.site_tracking to authenticated;
grant select, insert, update, delete
  on table public.site_tracking to service_role;
