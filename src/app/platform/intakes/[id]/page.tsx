import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { formatColombiaDateTime } from '@/lib/colombia-date';
import { INTAKE_CATEGORIES, intakeAnswersSchema, type IntakeAnswers, type IntakeCategory } from '@/lib/intake';
import { createServiceClient } from '@/utils/supabase/service';

export const dynamic = 'force-dynamic';

const sections: Array<{ title: string; fields: Array<[keyof IntakeAnswers, string]> }> = [
  { title: 'Negocio y contacto', fields: [
    ['businessName', 'Nombre comercial'], ['legalSeller', 'Vendedor legal'], ['sellerId', 'Identificación'],
    ['contactName', 'Contacto'], ['supportEmail', 'Correo de soporte'], ['supportPhone', 'Teléfono'], ['market', 'Mercado'],
  ] },
  { title: 'Producto y comprador', fields: [
    ['productName', 'Producto'], ['buyer', 'Comprador'], ['problem', 'Problema'], ['difference', 'Diferencia'],
    ['features', 'Características'], ['objections', 'Objeciones'],
  ] },
  { title: 'Oferta', fields: [
    ['price', 'Precio'], ['currency', 'Moneda'], ['includes', 'Incluye'], ['shipping', 'Envío'],
    ['delivery', 'Entrega'], ['payment', 'Pago'], ['warranty', 'Garantía'], ['returns', 'Cambios y retracto'],
  ] },
  { title: 'Marca y evidencia', fields: [
    ['personality', 'Personalidad'], ['colors', 'Colores y tipografías'], ['references', 'Referencias'],
    ['avoid', 'Evitar'], ['testimonials', 'Testimonios'], ['evidence', 'Evidencia'],
    ['prohibited', 'Afirmaciones prohibidas'], ['notes', 'Notas'],
  ] },
];

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function IntakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  const service = createServiceClient();
  if (!service) notFound();

  const [{ data: intake }, { data: files }] = await Promise.all([
    service.from('intake_requests')
      .select('id, provisional_name, slug, status, answers, created_at, updated_at, expires_at, submitted_at')
      .eq('id', id).maybeSingle(),
    service.from('intake_files')
      .select('id, category, original_name, mime_type, size_bytes, status, error_message, created_at, stored_at')
      .eq('request_id', id).order('created_at'),
  ]);
  if (!intake) notFound();

  const answers = intakeAnswersSchema.parse(intake.answers ?? {});
  const statusLabel = intake.status === 'submitted'
    ? 'Información recibida'
    : intake.status === 'revoked'
      ? 'Enlace cerrado'
      : 'Cliente completando';

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/platform" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-400 hover:text-white">
        <ArrowLeft size={15} /> Volver a clientes y landings
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-ink-800 bg-ink-950 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-nitro-400">Nitro Intake</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{intake.provisional_name}</h1>
          <p className="mt-1 text-sm text-ink-400"><code>{intake.slug}</code> · {statusLabel}</p>
          <p className="mt-2 text-xs text-ink-500">Última actividad {formatColombiaDateTime(intake.updated_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/platform/intakes/${intake.id}/export?format=brief`} className="flex min-h-10 items-center gap-2 rounded-xl border border-ink-700 px-3 py-2 text-xs font-bold text-ink-200 hover:bg-ink-800">
            <FileText size={14} /> BRIEF.md
          </a>
          <a href={`/api/platform/intakes/${intake.id}/export?format=json`} className="flex min-h-10 items-center gap-2 rounded-xl border border-ink-700 px-3 py-2 text-xs font-bold text-ink-200 hover:bg-ink-800">
            <Download size={14} /> intake.json
          </a>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-white">Información del brief</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
              <h3 className="font-bold text-white">{section.title}</h3>
              <dl className="mt-4 space-y-4">
                {section.fields.map(([key, label]) => {
                  const value = String(answers[key] ?? '').trim();
                  return (
                    <div key={key}>
                      <dt className="text-xs font-bold text-ink-500">{label}</dt>
                      <dd className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${value ? 'text-ink-200' : 'italic text-ink-600'}`}>{value || 'Pendiente'}</dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Material recibido</h2>
            <p className="mt-1 text-sm text-ink-400">{files?.length ?? 0} archivo(s), organizados por categoría y conservados en el bucket privado.</p>
          </div>
        </div>

        {!files?.length ? (
          <p className="mt-3 rounded-2xl border border-ink-800 bg-ink-950 p-5 text-sm text-ink-500">El cliente todavía no ha subido archivos.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {files.map((file) => (
              <article key={file.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-800 bg-ink-950 p-4">
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{file.original_name}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {INTAKE_CATEGORIES[file.category as IntakeCategory]} · {formatBytes(file.size_bytes)} · {file.mime_type}
                  </p>
                  <p className={`mt-1 text-xs font-bold ${file.status === 'stored' ? 'text-nitro-400' : file.status === 'failed' ? 'text-rose-400' : 'text-amber-300'}`}>
                    {file.status === 'stored' ? 'Guardado' : file.status === 'failed' ? `Error: ${file.error_message ?? 'requiere revisión'}` : 'Carga pendiente'}
                  </p>
                </div>
                {file.status === 'stored' && (
                  <div className="flex gap-2">
                    <a target="_blank" rel="noreferrer" href={`/api/platform/intakes/${intake.id}/files/${file.id}`} className="flex min-h-10 items-center gap-2 rounded-xl border border-ink-700 px-3 py-2 text-xs font-bold text-ink-200 hover:bg-ink-800">
                      <ExternalLink size={14} /> Abrir
                    </a>
                    <a href={`/api/platform/intakes/${intake.id}/files/${file.id}?download=1`} className="flex min-h-10 items-center gap-2 rounded-xl bg-nitro-500 px-3 py-2 text-xs font-bold text-ink-950 hover:bg-nitro-400">
                      <Download size={14} /> Descargar
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
