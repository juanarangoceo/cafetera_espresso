-- Un prospecto debe poder completar el brief antes de que Nitro conozca su
-- precio o cree su ficha operativa. La solicitud conserva identidad provisional
-- y solo se enlaza a `sites` cuando la plataforma convierte el brief recibido.

alter table public.intake_requests
  add column provisional_name text,
  add column slug text;

update public.intake_requests r
set provisional_name = s.name,
    slug = s.slug
from public.sites s
where s.id = r.site_id;

alter table public.intake_requests
  alter column provisional_name set not null,
  alter column slug set not null,
  alter column site_id drop not null,
  add constraint intake_requests_provisional_name_check
    check (char_length(btrim(provisional_name)) between 2 and 160),
  add constraint intake_requests_slug_check
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$');

-- Solo una solicitud independiente abierta o recibida por slug. Al convertirla
-- gana `site_id` y deja libre el slug para futuras solicitudes de ese sitio.
create unique index intake_requests_unlinked_slug_idx
  on public.intake_requests (slug)
  where site_id is null and status <> 'revoked';
