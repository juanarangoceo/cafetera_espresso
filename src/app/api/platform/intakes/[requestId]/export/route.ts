import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminIdentity } from '@/lib/admin-auth';
import { buildBriefMarkdown, intakeAnswersSchema, safeFileName } from '@/lib/intake';
import { createServiceClient } from '@/utils/supabase/service';

export async function GET(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const identity = await getAdminIdentity();
  if (identity?.role !== 'platform') return NextResponse.json({ error: 'No disponible.' }, { status: 404 });

  const requestId = z.string().uuid().safeParse((await context.params).requestId);
  if (!requestId.success) return NextResponse.json({ error: 'No disponible.' }, { status: 404 });
  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 });

  const [{ data: intake }, { data: files }] = await Promise.all([
    service.from('intake_requests')
      .select('provisional_name, slug, status, answers, submitted_at, updated_at')
      .eq('id', requestId.data).maybeSingle(),
    service.from('intake_files')
      .select('category, original_name, mime_type, size_bytes, status, stored_at')
      .eq('request_id', requestId.data).order('created_at'),
  ]);
  if (!intake) return NextResponse.json({ error: 'No disponible.' }, { status: 404 });

  const answers = intakeAnswersSchema.parse(intake.answers ?? {});
  const format = new URL(request.url).searchParams.get('format');
  const baseName = safeFileName(intake.slug);
  if (format === 'brief') {
    return new Response(buildBriefMarkdown(answers), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${baseName}-BRIEF.md"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }
  if (format !== 'json') return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 });

  const manifest = {
    version: 2,
    source: 'supabase',
    siteSlug: intake.slug,
    provisionalName: intake.provisional_name,
    status: intake.status,
    submittedAt: intake.submitted_at,
    updatedAt: intake.updated_at,
    answers,
    files: files ?? [],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${baseName}-intake.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
