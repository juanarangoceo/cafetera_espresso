-- La identidad corporativa existe antes que sus landings. La política anterior
-- intentaba descubrir la membresía a través de `accessible_site_ids()`, de modo
-- que una cuenta válida con cero sitios no podía leer ni su propia fila y el
-- login cerraba la sesión inmediatamente.
drop policy if exists "members_can_read_their_client_members"
on public.client_members;

create policy "members_can_read_their_client_members"
on public.client_members
for select
to authenticated
using (email = private.verified_email());
