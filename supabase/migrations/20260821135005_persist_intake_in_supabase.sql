-- Supabase Storage pasa de ser una escala temporal antes de Google Drive a ser
-- la fuente permanente de los archivos de Nitro Intake. Las tablas conservan
-- RLS sin politicas y sin grants de navegador; las cargas siguen entrando con
-- una URL firmada para un unico objeto.

alter table public.intake_files
  drop constraint intake_files_status_check;

-- Los archivos que estaban a mitad de la copia permanecen en Storage. Los que
-- ya se habian sincronizado con Drive fueron retirados del bucket por el flujo
-- anterior y no se pueden declarar almacenados sin comprobar el objeto.
update public.intake_files
set status = case
      when status = 'staged' then 'stored'
      when status = 'synced' then 'failed'
      else status
    end,
    error_message = case
      when status = 'synced' then 'Archivo legado: vuelve a cargarlo para conservarlo en Supabase.'
      else error_message
    end,
    synced_at = case
      when status = 'staged' then coalesce(synced_at, uploaded_at, now())
      else null
    end;

alter table public.intake_files
  rename column synced_at to stored_at;

alter table public.intake_files
  drop column drive_file_id,
  add constraint intake_files_status_check
    check (status in ('pending', 'stored', 'failed')),
  add constraint intake_files_stored_at_check
    check ((status = 'stored') = (stored_at is not null));

alter table public.intake_requests
  drop column drive_folder_id;
