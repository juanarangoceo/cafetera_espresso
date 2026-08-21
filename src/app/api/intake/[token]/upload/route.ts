import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  allowedIntakeMimeTypes,
  INTAKE_BUCKET,
  INTAKE_CATEGORIES,
  MAX_INTAKE_FILE_BYTES,
  MAX_INTAKE_FILES,
  MAX_INTAKE_TOTAL_BYTES,
  safeFileName,
} from '@/lib/intake';
import { ensureIntakeBucket, intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(240),
  type: z.string().trim().min(3).max(160),
  size: z.number().int().min(1).max(MAX_INTAKE_FILE_BYTES),
  category: z.enum(Object.keys(INTAKE_CATEGORIES) as [keyof typeof INTAKE_CATEGORIES, ...(keyof typeof INTAKE_CATEGORIES)[]]),
});

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeIsOpen(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }

  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Archivo inválido.' }, { status: 400 });
  }
  if (!allowedIntakeMimeTypes.has(parsed.data.type)) {
    return NextResponse.json({ error: 'Este tipo de archivo no está permitido.' }, { status: 415 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });
  const bucketError = await ensureIntakeBucket();
  if (bucketError) return NextResponse.json({ error: bucketError }, { status: 503 });

  const { data: files, error: filesError } = await service
    .from('intake_files')
    .select('size_bytes')
    .eq('request_id', intake.id);
  if (filesError) return NextResponse.json({ error: 'No pudimos preparar la carga.' }, { status: 500 });
  const total = (files ?? []).reduce((sum, file) => sum + file.size_bytes, 0);
  if ((files?.length ?? 0) >= MAX_INTAKE_FILES || total + parsed.data.size > MAX_INTAKE_TOTAL_BYTES) {
    return NextResponse.json({ error: 'La solicitud alcanzó el límite total de archivos.' }, { status: 413 });
  }

  const id = crypto.randomUUID();
  const fileName = safeFileName(parsed.data.name);
  const storagePath = `${intake.id}/${parsed.data.category}/${id}-${fileName}`;
  const { error: insertError } = await service.from('intake_files').insert({
    id,
    request_id: intake.id,
    category: parsed.data.category,
    original_name: parsed.data.name,
    mime_type: parsed.data.type,
    size_bytes: parsed.data.size,
    storage_path: storagePath,
  });
  if (insertError) {
    console.error('❌ No se pudo registrar el archivo de intake:', insertError);
    return NextResponse.json({ error: 'No pudimos preparar la carga.' }, { status: 500 });
  }

  const { data: signed, error: signError } = await service.storage
    .from(INTAKE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });
  if (signError || !signed) {
    await service.from('intake_files').delete().eq('id', id);
    console.error('❌ No se pudo firmar la carga de intake:', signError);
    return NextResponse.json({ error: 'No pudimos abrir el canal de carga.' }, { status: 500 });
  }

  return NextResponse.json({ fileId: id, path: storagePath, uploadToken: signed.token });
}

const deleteSchema = z.object({ fileId: z.string().uuid() });

export async function DELETE(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeIsOpen(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });
  const { data: file } = await service
    .from('intake_files')
    .select('id, storage_path')
    .eq('id', parsed.data.fileId)
    .eq('request_id', intake.id)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 404 });

  const { error: removeError } = await service.storage.from(INTAKE_BUCKET).remove([file.storage_path]);
  if (removeError) {
    console.error('❌ No se pudo retirar el archivo de Storage:', removeError);
    return NextResponse.json({ error: 'No pudimos quitar el archivo.' }, { status: 502 });
  }
  const { error } = await service.from('intake_files').delete().eq('id', file.id);
  if (error) return NextResponse.json({ error: 'No pudimos quitar el archivo.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
