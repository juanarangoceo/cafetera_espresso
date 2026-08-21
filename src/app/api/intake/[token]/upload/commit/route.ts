import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureIntakeDriveFolders, uploadDriveStream } from '@/lib/google-drive';
import { INTAKE_BUCKET, safeFileName, type IntakeCategory } from '@/lib/intake';
import { intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

const commitSchema = z.object({ fileId: z.string().uuid() });

export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeIsOpen(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }

  const parsed = commitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });

  const { data: file } = await service
    .from('intake_files')
    .select('id, category, original_name, mime_type, size_bytes, storage_path, status, drive_file_id')
    .eq('id', parsed.data.fileId)
    .eq('request_id', intake.id)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 404 });
  if (file.status === 'synced') {
    return NextResponse.json({ ok: true, file: { id: file.id, name: file.original_name, status: 'synced' } });
  }

  await service.from('intake_files').update({ status: 'staged', uploaded_at: new Date().toISOString(), error_message: null }).eq('id', file.id);

  try {
    const { data: signed, error: signError } = await service.storage
      .from(INTAKE_BUCKET)
      .createSignedUrl(file.storage_path, 300);
    if (signError || !signed) throw new Error('No se pudo abrir el archivo temporal.');

    const source = await fetch(signed.signedUrl);
    if (!source.ok || !source.body) throw new Error('El archivo temporal no está disponible.');

    const folders = await ensureIntakeDriveFolders(intake.siteSlug);
    if (intake.driveFolderId !== folders.rootId) {
      await service.from('intake_requests').update({ drive_folder_id: folders.rootId }).eq('id', intake.id);
    }
    const uploaded = await uploadDriveStream({
      parentId: folders.categories[file.category as IntakeCategory],
      name: safeFileName(file.original_name),
      mimeType: file.mime_type,
      size: file.size_bytes,
      body: source.body,
    });

    await service.from('intake_files').update({
      status: 'synced',
      drive_file_id: uploaded.id,
      synced_at: new Date().toISOString(),
      error_message: null,
    }).eq('id', file.id);
    const { error: removeError } = await service.storage.from(INTAKE_BUCKET).remove([file.storage_path]);
    if (removeError) console.error('⚠️ Archivo sincronizado, pero no se pudo retirar el temporal:', removeError);

    return NextResponse.json({ ok: true, file: { id: file.id, name: file.original_name, status: 'synced' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo copiar a Drive.';
    console.error('❌ No se pudo sincronizar un archivo de intake:', error);
    await service.from('intake_files').update({ status: 'failed', error_message: message.slice(0, 500) }).eq('id', file.id);
    return NextResponse.json({ error: 'El archivo quedó guardado temporalmente, pero no pudimos copiarlo a Drive. Intenta de nuevo.' }, { status: 502 });
  }
}
