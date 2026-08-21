import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminIdentity } from '@/lib/admin-auth';
import { INTAKE_BUCKET, safeFileName } from '@/lib/intake';
import { createServiceClient } from '@/utils/supabase/service';

const paramsSchema = z.object({ requestId: z.string().uuid(), fileId: z.string().uuid() });

export async function GET(request: Request, context: { params: Promise<{ requestId: string; fileId: string }> }) {
  const identity = await getAdminIdentity();
  if (identity?.role !== 'platform') return NextResponse.json({ error: 'No disponible.' }, { status: 404 });

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return NextResponse.json({ error: 'No disponible.' }, { status: 404 });
  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 });

  const { data: file } = await service.from('intake_files')
    .select('storage_path, original_name, status')
    .eq('id', parsed.data.fileId)
    .eq('request_id', parsed.data.requestId)
    .maybeSingle();
  if (!file || file.status !== 'stored') return NextResponse.json({ error: 'No disponible.' }, { status: 404 });

  const download = new URL(request.url).searchParams.get('download') === '1';
  const { data: signed, error } = await service.storage.from(INTAKE_BUCKET).createSignedUrl(
    file.storage_path,
    60,
    download ? { download: safeFileName(file.original_name) } : undefined,
  );
  if (error || !signed) return NextResponse.json({ error: 'No pudimos abrir el archivo.' }, { status: 500 });

  const response = NextResponse.redirect(signed.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
