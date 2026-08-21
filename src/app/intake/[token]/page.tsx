import { notFound } from 'next/navigation';
import IntakeWizard from '@/components/intake/IntakeWizard';
import { intakeIsOpen, resolveIntakeToken } from '@/lib/intake-server';
import { createServiceClient } from '@/utils/supabase/service';

export const dynamic = 'force-dynamic';

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const intake = await resolveIntakeToken(token);
  if (!intake) notFound();

  const service = createServiceClient();
  const { data: files } = service
    ? await service
        .from('intake_files')
        .select('id, original_name, category, size_bytes, status, error_message')
        .eq('request_id', intake.id)
        .order('created_at')
    : { data: [] };

  return (
    <IntakeWizard
      token={token}
      brand={{ name: intake.siteName, logoUrl: intake.logoUrl }}
      initialAnswers={intake.answers}
      initialFiles={(files ?? []).map((file) => ({
        id: file.id,
        name: file.original_name,
        category: file.category,
        size: file.size_bytes,
        status: file.status,
        error: file.error_message,
      }))}
      state={
        intake.status === 'submitted'
          ? 'submitted'
          : intakeIsOpen(intake)
            ? 'open'
            : 'expired'
      }
    />
  );
}
