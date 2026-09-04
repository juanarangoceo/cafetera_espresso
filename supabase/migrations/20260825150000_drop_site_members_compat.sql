-- Contracción posterior al despliegue: la aplicación nueva ya escribe y lee
-- membresías por cliente, así que puede retirarse el modelo por landing.
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
  where member.email = private.verified_email();
$$;

revoke all on function private.accessible_site_ids() from public;
grant execute on function private.accessible_site_ids() to authenticated;

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

drop table public.site_members;
