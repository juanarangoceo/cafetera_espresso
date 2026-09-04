create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (
    document_type in ('service_terms', 'data_processing_authorization')
  ),
  version text not null check (version ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'),
  title text not null check (char_length(title) between 3 and 200),
  body_markdown text not null check (char_length(body_markdown) between 100 and 100000),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null check (created_by = lower(created_by)),
  constraint legal_documents_publication_shape check (
    (status = 'draft' and published_at is null)
    or (status in ('published', 'retired') and published_at is not null)
  ),
  unique (document_type, version)
);

create unique index legal_documents_one_published_type_idx
  on public.legal_documents (document_type)
  where status = 'published';

create table public.client_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  document_id uuid not null references public.legal_documents(id) on delete restrict,
  document_type text not null check (
    document_type in ('service_terms', 'data_processing_authorization')
  ),
  document_version text not null,
  document_title text not null,
  document_sha256 text not null check (document_sha256 ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  accepted_email text not null check (accepted_email = lower(accepted_email)),
  acceptance_statement text not null check (char_length(acceptance_statement) between 20 and 1000),
  accepted_at timestamptz not null default now(),
  source_ip inet,
  user_agent text check (user_agent is null or char_length(user_agent) <= 1000),
  unique (client_id, document_id)
);

create index client_legal_acceptances_client_idx
  on public.client_legal_acceptances (client_id);
create index client_legal_acceptances_document_idx
  on public.client_legal_acceptances (document_id);

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

create trigger client_legal_acceptances_are_verified
before insert on public.client_legal_acceptances
for each row execute function private.validate_legal_acceptance();

create or replace function private.protect_legal_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'legal evidence is immutable' using errcode = '55000';
end;
$$;

create trigger client_legal_acceptances_are_immutable
before update or delete on public.client_legal_acceptances
for each row execute function private.protect_legal_evidence();

create or replace function private.protect_published_legal_documents()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.status <> 'draft' then
    raise exception 'published legal documents are immutable' using errcode = '55000';
  end if;

  if tg_op = 'UPDATE' and old.status <> 'draft' and (
    new.document_type is distinct from old.document_type
    or new.version is distinct from old.version
    or new.title is distinct from old.title
    or new.body_markdown is distinct from old.body_markdown
    or new.content_sha256 is distinct from old.content_sha256
    or new.published_at is distinct from old.published_at
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
    or new.status = 'draft'
  ) then
    raise exception 'published legal documents are immutable' using errcode = '55000';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger published_legal_documents_are_immutable
before update or delete on public.legal_documents
for each row execute function private.protect_published_legal_documents();

create or replace function public.publish_legal_document(
  p_document_type text,
  p_version text,
  p_title text,
  p_body_markdown text,
  p_created_by text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  published_id uuid;
begin
  update public.legal_documents
     set status = 'retired'
   where document_type = p_document_type
     and status = 'published';

  insert into public.legal_documents (
    document_type, version, title, body_markdown, content_sha256,
    status, published_at, created_by
  ) values (
    p_document_type, p_version, p_title, p_body_markdown,
    encode(extensions.digest(convert_to(p_body_markdown, 'UTF8'), 'sha256'), 'hex'),
    'published', now(), lower(p_created_by)
  ) returning id into published_id;

  return published_id;
end;
$$;

alter table public.legal_documents enable row level security;
alter table public.client_legal_acceptances enable row level security;

revoke all on table public.legal_documents from anon, authenticated;
revoke all on table public.client_legal_acceptances from anon, authenticated;

grant select, insert, update, delete on table public.legal_documents to service_role;
grant select, insert on table public.client_legal_acceptances to service_role;
revoke all on function private.validate_legal_acceptance() from public, anon, authenticated;
revoke all on function public.publish_legal_document(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.publish_legal_document(text, text, text, text, text) to service_role;

comment on table public.legal_documents is
  'Versioned legal text. Only reviewed drafts may be published; published content is immutable.';
comment on table public.client_legal_acceptances is
  'Append-only evidence that a client accepted an exact legal document version.';
