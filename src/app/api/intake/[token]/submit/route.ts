import { NextResponse } from 'next/server';
import { ensureIntakeDriveFolders, upsertDriveTextFile } from '@/lib/google-drive';
import { buildBriefMarkdown, intakeSubmissionSchema } from '@/lib/intake';
import { intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeIsOpen(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }

  const parsed = intakeSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? 'Completa la información obligatoria.',
      field: parsed.error.issues[0]?.path[0] ?? null,
    }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });

  const { data: files, error: filesError } = await service
    .from('intake_files')
    .select('id, category, original_name, mime_type, size_bytes, drive_file_id, status, synced_at')
    .eq('request_id', intake.id)
    .order('created_at');
  if (filesError) return NextResponse.json({ error: 'No pudimos comprobar los archivos.' }, { status: 500 });
  if ((files ?? []).some((file) => file.status !== 'synced')) {
    return NextResponse.json({ error: 'Espera a que todos los archivos terminen de subir o vuelve a intentarlo.' }, { status: 409 });
  }

  try {
    const folders = await ensureIntakeDriveFolders(intake.siteSlug);
    const brief = buildBriefMarkdown(parsed.data);
    const manifest = JSON.stringify({
      version: 1,
      siteSlug: intake.siteSlug,
      submittedAt: new Date().toISOString(),
      answers: parsed.data,
      files: files ?? [],
    }, null, 2);
    await Promise.all([
      upsertDriveTextFile(folders.rootId, 'BRIEF.md', brief),
      upsertDriveTextFile(folders.rootId, 'intake.json', manifest),
    ]);

    const submittedAt = new Date().toISOString();
    const { error } = await service.from('intake_requests').update({
      answers: parsed.data,
      status: 'submitted',
      submitted_at: submittedAt,
      drive_folder_id: folders.rootId,
    }).eq('id', intake.id).eq('status', 'draft');
    if (error) throw error;

    return NextResponse.json({ ok: true, submittedAt });
  } catch (error) {
    console.error('❌ No se pudo cerrar el intake en Drive:', error);
    return NextResponse.json({ error: 'No pudimos cerrar la entrega en Drive. Tu avance sigue guardado; inténtalo nuevamente.' }, { status: 502 });
  }
}
