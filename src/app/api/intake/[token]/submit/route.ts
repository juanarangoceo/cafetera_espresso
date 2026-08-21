import { NextResponse } from 'next/server';
import { intakeSubmissionSchema } from '@/lib/intake';
import { intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

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
    .select('id, status')
    .eq('request_id', intake.id)
    .order('created_at');
  if (filesError) return NextResponse.json({ error: 'No pudimos comprobar los archivos.' }, { status: 500 });
  if ((files ?? []).some((file) => file.status !== 'stored')) {
    return NextResponse.json({ error: 'Espera a que todos los archivos terminen de subir o vuelve a intentarlo.' }, { status: 409 });
  }

  const submittedAt = new Date().toISOString();
  const { data: submitted, error } = await service.from('intake_requests').update({
    answers: parsed.data,
    status: 'submitted',
    submitted_at: submittedAt,
  }).eq('id', intake.id).eq('status', 'draft').select('id');
  if (error || !submitted?.length) {
    console.error('❌ No se pudo cerrar el intake en Supabase:', error);
    return NextResponse.json({ error: 'No pudimos completar la entrega. Tu avance sigue guardado; inténtalo nuevamente.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submittedAt });
}
