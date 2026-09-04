-- El acceso operativo pertenece al cliente, no a una landing concreta. Una
-- membresía corporativa alcanza todas las landings actuales y futuras del
-- mismo cliente mediante `sites.client_id`.
create table public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  email text not null check (
    email = lower(email)
    and char_length(email) <= 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  role text not null default 'owner' check (role in ('owner', 'staff')),
  display_name text check (
    display_name is null or char_length(btrim(display_name)) between 2 and 120
  ),
  created_at timestamptz not null default now(),
  primary key (client_id, email)
);

create index client_members_email_idx on public.client_members (email);

-- Conserva todos los accesos existentes. Si el mismo correo estaba repetido
-- en varias landings del cliente, se consolida en una sola membresía y se
-- preserva el rol más amplio.
insert into public.client_members (client_id, email, role, display_name, created_at)
select
  site.client_id,
  member.email,
  case when bool_or(member.role = 'owner') then 'owner' else 'staff' end,
  max(member.display_name),
  min(member.created_at)
from public.site_members member
join public.sites site on site.id = member.site_id
group by site.client_id, member.email;

alter table public.client_members enable row level security;

-- La función sigue siendo la única frontera que consumen las políticas de
-- pedidos, CRM, métricas y canales. `security definer` es deliberado porque
-- consulta una tabla sin grants generales; queda en `private`, con search_path
-- vacío y sin EXECUTE para PUBLIC.
create or replace function private.accessible_site_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select site.id
  from public.sites site
  join public.client_members member on member.client_id = site.client_id
  where member.email = private.verified_email()

  union

  -- Compatibilidad temporal con la versión anterior de la aplicación. La
  -- migración siguiente retira esta rama después de promover el nuevo código.
  select member.site_id
  from public.site_members member
  where member.email = private.verified_email();
$$;

revoke all on function private.accessible_site_ids() from public;
grant execute on function private.accessible_site_ids() to authenticated;

create policy "members_can_read_their_client_members"
on public.client_members
for select
to authenticated
using (
  client_id in (
    select site.client_id
    from public.sites site
    where site.id in (select private.accessible_site_ids())
  )
);

revoke all on table public.client_members from anon, authenticated;
grant select (client_id, email, role, display_name, created_at)
on table public.client_members to authenticated;
grant select, insert, update, delete on table public.client_members to service_role;

-- La evidencia jurídica también se autoriza por la cuenta corporativa.
create or replace function private.validate_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_row public.legal_documents%rowtype;
  verified_email text;
begin
  select * into document_row
    from public.legal_documents
   where id = new.document_id
     and status = 'published';
  if not found then
    raise exception 'only a current published document can be accepted' using errcode = '23514';
  end if;

  select lower(email) into verified_email
    from auth.users
   where id = new.user_id
     and email_confirmed_at is not null;
  if verified_email is null or verified_email <> new.accepted_email then
    raise exception 'acceptance identity does not match a verified user' using errcode = '42501';
  end if;

  if not exists (
    select 1
      from public.client_members member
     where member.client_id = new.client_id
       and member.email = verified_email
    union all
    select 1
      from public.site_members member
      join public.sites site on site.id = member.site_id
     where site.client_id = new.client_id
       and member.email = verified_email
  ) then
    raise exception 'user cannot accept for this client' using errcode = '42501';
  end if;

  new.document_type := document_row.document_type;
  new.document_version := document_row.version;
  new.document_title := document_row.title;
  new.document_sha256 := document_row.content_sha256;
  return new;
end;
$$;
