import { NextResponse } from 'next/server';
import { intakeDraftSchema } from '@/lib/intake';
import { intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const intake = await resolveIntakeToken(token);
  if (!intake || !intakeIsOpen(intake)) {
    return NextResponse.json({ error: 'Este enlace ya no está disponible.' }, { status: 404 });
  }

  const parsed = intakeDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'El servicio no está disponible.' }, { status: 503 });

  const answers = { ...intake.answers, ...parsed.data };
  const { error } = await service
    .from('intake_requests')
    .update({ answers })
    .eq('id', intake.id)
    .eq('status', 'draft');
  if (error) {
    console.error('❌ No se pudo guardar el borrador de intake:', error);
    return NextResponse.json({ error: 'No pudimos guardar el avance.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
