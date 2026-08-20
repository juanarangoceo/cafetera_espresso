-- `leads` por sitio.
--
-- Se quedó fuera de la migración anterior y arrastra dos fallos que solo se ven
-- con más de un cliente:
--
-- 1. `email` es único **global**. Si una persona se suscribe en la landing de
--    un cliente y luego en la de otro, la segunda inserción falla con `23505`.
--    El cliente que llegó después pierde el contacto sin enterarse.
--
-- 2. No hay `site_id`, así que todos los correos caen en el mismo montón y
--    nadie puede leerlos: la tabla ni siquiera tiene política de `select`.
--
-- La suscripción anónima se conserva: la capta un formulario público de la
-- landing, igual que antes.

alter table public.leads
  add column site_id uuid
    not null
    default 'c0ffee00-0000-4000-8000-000000000001'
    references public.sites(id) on delete restrict;

-- La unicidad pasa a ser por sitio. El mismo correo puede ser contacto de dos
-- clientes distintos sin que uno le pise el registro al otro.
alter table public.leads drop constraint leads_email_key;

create unique index leads_site_email_idx on public.leads (site_id, email);

create index leads_site_created_at_idx on public.leads (site_id, created_at desc);

-- Los correos captados son del cliente, no de la plataforma en abstracto: los
-- lee quien pertenece al sitio, con el mismo criterio que el resto del panel.
create policy "members_can_read_their_site_leads"
on public.leads
for select
to authenticated
using (site_id in (select private.accessible_site_ids()));

grant select (id, email, source, created_at, site_id) on table public.leads to authenticated;

-- La ingesta fija el sitio al que pertenece el correo, igual que con los
-- pedidos. Sin esto, todos los suscriptores de todos los clientes se
-- acumularían bajo la primera landing.
grant select, insert on table public.leads to service_role;
