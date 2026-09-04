import { NextResponse } from 'next/server';
import { z } from 'zod';
import { INTAKE_BUCKET } from '@/lib/intake';
import { intakeAcceptsFiles, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

const commitSchema = z.object({ fileId: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeAcceptsFiles(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }

  const parsed = commitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });

  const { data: file } = await service
    .from('intake_files')
    .select('id, original_name, size_bytes, storage_path, status')
    .eq('id', parsed.data.fileId)
    .eq('request_id', intake.id)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 404 });
  if (file.status === 'stored') {
    return NextResponse.json({ ok: true, file: { id: file.id, name: file.original_name, status: 'stored' } });
  }

  try {
    const { data: storedObject, error: infoError } = await service.storage
      .from(INTAKE_BUCKET)
      .info(file.storage_path);
    if (infoError || !storedObject) throw new Error('El archivo no terminó de subir.');
    if (storedObject.size !== undefined && storedObject.size !== file.size_bytes) {
      throw new Error('El tamaño recibido no coincide con el archivo preparado.');
    }

    const { data: storedFile, error: updateError } = await service.from('intake_files').update({
      status: 'stored',
      uploaded_at: new Date().toISOString(),
      stored_at: new Date().toISOString(),
      error_message: null,
    }).eq('id', file.id).eq('request_id', intake.id).select('id');
    if (updateError || !storedFile?.length) throw new Error('No se pudo registrar el archivo recibido.');

    return NextResponse.json({ ok: true, file: { id: file.id, name: file.original_name, status: 'stored' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar el archivo.';
    console.error('❌ No se pudo confirmar un archivo de intake en Storage:', error);
    await service.from('intake_files').update({ status: 'failed', error_message: message.slice(0, 500) }).eq('id', file.id);
    return NextResponse.json({ error: 'No pudimos confirmar el archivo. Intenta subirlo nuevamente.' }, { status: 502 });
  }
}
