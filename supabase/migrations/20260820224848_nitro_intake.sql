-- Nitro Intake convierte un enlace privado en material editorial organizado.
-- El navegador nunca consulta estas tablas: el token se compara por hash en
-- acciones/rutas de servidor y los archivos entran con URLs de carga firmadas.

create table public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'revoked')),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object'),
  drive_folder_id text check (
    drive_folder_id is null or char_length(drive_folder_id) between 5 and 200
  ),
  created_by text not null check (
    created_by = lower(created_by)
    and created_by ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  expires_at timestamptz not null default (now() + interval '30 days'),
  submitted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((status = 'submitted') = (submitted_at is not null)),
  check ((status = 'revoked') = (revoked_at is not null))
);

create index intake_requests_site_created_idx
  on public.intake_requests (site_id, created_at desc);

create trigger intake_requests_set_updated_at
before update on public.intake_requests
for each row execute function private.set_updated_at();

create table public.intake_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.intake_requests(id) on delete cascade,
  category text not null
    check (category in ('marca', 'producto', 'fotos_videos', 'oferta', 'legal')),
  original_name text not null check (char_length(btrim(original_name)) between 1 and 240),
  mime_type text not null check (char_length(btrim(mime_type)) between 3 and 160),
  size_bytes bigint not null check (size_bytes between 1 and 31457280),
  storage_path text not null unique check (char_length(storage_path) between 10 and 600),
  drive_file_id text check (
    drive_file_id is null or char_length(drive_file_id) between 5 and 200
  ),
  status text not null default 'pending'
    check (status in ('pending', 'staged', 'synced', 'failed')),
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  synced_at timestamptz
);

create index intake_files_request_created_idx
  on public.intake_files (request_id, created_at);

alter table public.intake_requests enable row level security;
alter table public.intake_files enable row level security;

-- Sin políticas y sin grants de navegador: conocer un UUID no permite leer un
-- brief, enumerar archivos ni modificar otro intake. Las rutas públicas pasan
-- por service_role después de validar el token de capacidad.
revoke all on table public.intake_requests from anon, authenticated;
revoke all on table public.intake_files from anon, authenticated;
grant select, insert, update, delete on table public.intake_requests to service_role;
grant select, insert, update, delete on table public.intake_files to service_role;
