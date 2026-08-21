'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import {
  EMPTY_INTAKE_ANSWERS,
  INTAKE_CATEGORIES,
  MAX_INTAKE_FILE_BYTES,
  type IntakeAnswers,
  type IntakeCategory,
} from '@/lib/intake';

type IntakeFile = {
  id: string;
  name: string;
  category: string;
  size: number;
  status: string;
  error: string | null;
};

type Field = {
  key: keyof IntakeAnswers;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'textarea';
  required?: boolean;
};

const steps: Array<{ title: string; eyebrow: string; fields?: Field[] }> = [
  {
    eyebrow: 'Tu negocio',
    title: 'Empecemos por quién vende',
    fields: [
      { key: 'businessName', label: 'Nombre comercial', placeholder: 'La marca que verá el comprador', required: true },
      { key: 'legalSeller', label: 'Nombre legal del vendedor', hint: 'Persona o empresa responsable de la venta.', required: true },
      { key: 'sellerId', label: 'Identificación del vendedor', placeholder: 'Cédula o NIT', required: true },
      { key: 'contactName', label: 'Persona de contacto', placeholder: 'Con quién hablaremos durante el proyecto' },
      { key: 'supportEmail', label: 'Correo de soporte al comprador', type: 'email', required: true },
      { key: 'supportPhone', label: 'Teléfono de soporte', placeholder: 'Con código de país' },
      { key: 'market', label: '¿Dónde vas a vender?', placeholder: 'Ejemplo: Colombia, cobertura nacional', required: true },
    ],
  },
  {
    eyebrow: 'El producto',
    title: 'Cuéntanos por qué importa',
    fields: [
      { key: 'productName', label: 'Nombre del producto', required: true },
      { key: 'buyer', label: '¿Quién suele comprarlo y en qué situación?', type: 'textarea', required: true },
      { key: 'problem', label: '¿Qué problema principal resuelve?', type: 'textarea', required: true },
      { key: 'difference', label: '¿Qué diferencia real tiene frente a otras opciones?', type: 'textarea' },
      { key: 'features', label: 'Características confirmadas', hint: 'Medidas, materiales, funciones o especificaciones que puedas demostrar.', type: 'textarea' },
      { key: 'objections', label: '¿Qué dudas pone normalmente el comprador?', type: 'textarea' },
    ],
  },
  {
    eyebrow: 'La oferta',
    title: 'Dejemos las condiciones sin ambigüedades',
    fields: [
      { key: 'price', label: 'Precio exacto', placeholder: 'Ejemplo: 249000', required: true },
      { key: 'currency', label: 'Moneda', placeholder: 'COP', required: true },
      { key: 'includes', label: '¿Qué recibe exactamente el comprador?', type: 'textarea', required: true },
      { key: 'shipping', label: 'Costo y cobertura del envío', type: 'textarea', required: true },
      { key: 'delivery', label: 'Tiempo de entrega', placeholder: 'Ejemplo: 2 a 5 días hábiles', required: true },
      { key: 'payment', label: 'Formas de pago', type: 'textarea', required: true },
      { key: 'warranty', label: 'Garantía', type: 'textarea', required: true },
      { key: 'returns', label: 'Cambios, devoluciones o retracto', type: 'textarea', required: true },
    ],
  },
  {
    eyebrow: 'La marca',
    title: 'Démosle una dirección propia',
    fields: [
      { key: 'personality', label: '¿Cómo debe sentirse la marca?', placeholder: 'Ejemplo: cercana, enérgica y confiable', type: 'textarea' },
      { key: 'colors', label: 'Colores, tipografías o elementos existentes', type: 'textarea' },
      { key: 'references', label: 'Páginas o estilos que te gustan y por qué', hint: 'Pega los enlaces y señala qué rescatarías de cada uno.', type: 'textarea' },
      { key: 'avoid', label: '¿Qué estilos o elementos debemos evitar?', type: 'textarea' },
      { key: 'testimonials', label: 'Testimonios autorizados y su origen', type: 'textarea' },
      { key: 'evidence', label: 'Pruebas, demostraciones o certificaciones', type: 'textarea' },
      { key: 'prohibited', label: 'Afirmaciones que no debemos hacer', type: 'textarea' },
      { key: 'notes', label: 'Algo más que debamos saber', type: 'textarea' },
    ],
  },
  { eyebrow: 'Material', title: 'Sube lo que nos ayudará a diseñar' },
  { eyebrow: 'Confirmación', title: 'Revisa y entrega tu información' },
];

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function IntakeWizard({
  token,
  brand,
  initialAnswers,
  initialFiles,
  state,
}: {
  token: string;
  brand: { name: string; logoUrl: string | null };
  initialAnswers: IntakeAnswers;
  initialFiles: IntakeFile[];
  state: 'open' | 'submitted' | 'expired';
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>({ ...EMPTY_INTAKE_ANSWERS, ...initialAnswers });
  const [files, setFiles] = useState<IntakeFile[]>(initialFiles);
  const [category, setCategory] = useState<IntakeCategory>('fotos_videos');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(state === 'submitted');
  const [submitting, setSubmitting] = useState(false);
  const firstRender = useRef(true);

  const progress = Math.round(((step + 1) / steps.length) * 100);
  const syncedFiles = files.filter((file) => file.status === 'synced');
  const incompleteFiles = files.filter((file) => file.status !== 'synced');
  const summary = [
    ['Marca', answers.businessName || 'Pendiente'],
    ['Producto', answers.productName || 'Pendiente'],
    ['Oferta', answers.price ? `${answers.price} ${answers.currency}` : 'Pendiente'],
    ['Mercado', answers.market || 'Pendiente'],
    ['Archivos', `${syncedFiles.length} recibidos`],
  ];

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = window.setTimeout(async () => {
      setSaveState('saving');
      const response = await fetch(`/api/intake/${token}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      setSaveState(response.ok ? 'saved' : 'error');
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [answers, token]);

  if (submitted) {
    return <StatusScreen brand={brand} title="Material recibido" description="Tu información y tus archivos quedaron organizados. Ya podemos comenzar la revisión para diseñar tu landing." />;
  }
  if (state === 'expired') {
    return <StatusScreen brand={brand} title="Este enlace ya cerró" description="Pídele a tu contacto de Nitro un enlace nuevo para continuar." />;
  }

  function update(key: keyof IntakeAnswers, value: string | boolean) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage(null);
  }

  async function uploadFile(file: File) {
    if (file.size > MAX_INTAKE_FILE_BYTES) throw new Error(`${file.name} supera el límite de 30 MB.`);
    const prepare = await fetch(`/api/intake/${token}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, category }),
    });
    const prepared = await prepare.json();
    if (!prepare.ok) throw new Error(prepared.error || 'No se pudo preparar la carga.');

    const supabase = createClient();
    const { error } = await supabase.storage
      .from('nitro-intake')
      .uploadToSignedUrl(prepared.path, prepared.uploadToken, file, { contentType: file.type });
    if (error) {
      await fetch(`/api/intake/${token}/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: prepared.fileId }),
      });
      throw new Error(`No se pudo subir ${file.name}.`);
    }

    setFiles((current) => [...current, { id: prepared.fileId, name: file.name, category, size: file.size, status: 'staged', error: null }]);
    const commit = await fetch(`/api/intake/${token}/upload/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: prepared.fileId }),
    });
    const committed = await commit.json();
    if (!commit.ok) {
      setFiles((current) => current.map((item) => item.id === prepared.fileId ? { ...item, status: 'failed', error: committed.error } : item));
      throw new Error(committed.error || `No se pudo copiar ${file.name} a Drive.`);
    }
    setFiles((current) => current.map((item) => item.id === prepared.fileId ? { ...item, status: 'synced', error: null } : item));
  }

  async function retryFile(fileId: string) {
    setMessage(null);
    setFiles((current) => current.map((item) => item.id === fileId ? { ...item, status: 'staged', error: null } : item));
    const response = await fetch(`/api/intake/${token}/upload/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });
    const result = await response.json();
    if (response.ok) {
      setFiles((current) => current.map((item) => item.id === fileId ? { ...item, status: 'synced', error: null } : item));
      setMessage('Archivo recibido y organizado correctamente.');
    } else {
      setFiles((current) => current.map((item) => item.id === fileId ? { ...item, status: 'failed', error: result.error } : item));
      setMessage(result.error || 'No pudimos reintentar la copia.');
    }
  }

  async function removeFile(fileId: string) {
    setMessage(null);
    const response = await fetch(`/api/intake/${token}/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });
    const result = await response.json();
    if (response.ok) setFiles((current) => current.filter((item) => item.id !== fileId));
    else setMessage(result.error || 'No pudimos quitar el archivo.');
  }

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setUploading(true);
    setMessage(null);
    try {
      for (const file of Array.from(selected)) await uploadFile(file);
      setMessage('Archivos recibidos y organizados correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la carga.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    const response = await fetch(`/api/intake/${token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });
    const result = await response.json();
    if (response.ok) setSubmitted(true);
    else setMessage(result.error || 'No pudimos completar la entrega.');
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-slate-950">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_52%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_42%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
                <Image src={brand.logoUrl} alt={`Logo de ${brand.name}`} fill sizes="44px" className="object-contain p-1.5" />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400 shadow-lg">
                <Sparkles size={20} />
              </div>
            )}
            <div>
              <p className="font-bold tracking-tight text-slate-950">{brand.name}</p>
              <p className="text-xs text-slate-500">Brief privado · Nitro Landing</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <LockKeyhole size={14} className="text-emerald-600" /> Enlace privado
          </div>
        </header>

        <div className="mb-5 overflow-hidden rounded-full bg-slate-200" aria-label={`Progreso: ${progress}%`}>
          <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <section className="grid overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[270px_1fr]">
          <aside className="bg-slate-950 p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">Paso {step + 1} de {steps.length}</p>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight">{steps[step].title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Responde con lo que sabes. Si algo no está confirmado, puedes dejarlo pendiente y volver más tarde.</p>
            <div className="mt-8 hidden space-y-3 lg:block">
              {steps.map((item, index) => (
                <div key={item.eyebrow} className={`flex items-center gap-3 text-sm ${index === step ? 'font-bold text-white' : index < step ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${index <= step ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800'}`}>
                    {index < step ? <Check size={14} /> : index + 1}
                  </span>
                  {item.eyebrow}
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <div className="mb-7 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{steps[step].eyebrow}</p>
                <p className="mt-1 text-sm text-slate-500">Los campos con * son necesarios para entregar el brief.</p>
              </div>
              <span className="text-xs text-slate-400" aria-live="polite">
                {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Avance guardado' : saveState === 'error' ? 'Sin guardar' : ''}
              </span>
            </div>

            {steps[step].fields && (
              <div className="grid gap-5 md:grid-cols-2">
                {steps[step].fields!.map((field) => (
                  <label key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <span className="mb-1.5 block text-sm font-bold text-slate-800">{field.label}{field.required ? ' *' : ''}</span>
                    {field.type === 'textarea' ? (
                      <textarea rows={4} value={String(answers[field.key])} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} className={`${fieldClass} resize-y`} />
                    ) : (
                      <input type={field.type ?? 'text'} value={String(answers[field.key])} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} className={fieldClass} />
                    )}
                    {field.hint && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{field.hint}</span>}
                  </label>
                ))}
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-800">Tipo de material</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value as IntakeCategory)} className={fieldClass}>
                      {Object.entries(INTAKE_CATEGORIES).map(([value, folder]) => <option key={value} value={value}>{folder.replace(/^\d+_/, '').replace('_', ' ')}</option>)}
                    </select>
                  </label>
                  <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                    {uploading ? <Loader2 className="animate-spin text-emerald-600" /> : <UploadCloud className="text-emerald-600" />}
                    <span className="mt-2 text-sm font-bold text-slate-800">{uploading ? 'Organizando archivos…' : 'Selecciona fotos, videos o documentos'}</span>
                    <span className="mt-1 text-xs text-slate-500">Máximo 30 MB por archivo</span>
                    <input type="file" multiple disabled={uploading} onChange={(event) => void handleFiles(event.target.files)} className="sr-only" />
                  </label>
                </div>

                {files.length > 0 && (
                  <ul className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                    {files.map((file) => (
                      <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                        {file.status === 'synced' ? <FileCheck2 size={18} className="shrink-0 text-emerald-600" /> : file.status === 'failed' ? <ImagePlus size={18} className="shrink-0 text-rose-500" /> : <Loader2 size={18} className="shrink-0 animate-spin text-amber-500" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">{INTAKE_CATEGORIES[file.category as IntakeCategory]} · {formatBytes(file.size)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {file.status === 'failed' && (
                            <button type="button" onClick={() => void retryFile(file.id)} className="text-xs font-bold text-amber-700 hover:text-amber-800">Reintentar</button>
                          )}
                          <button type="button" onClick={() => void removeFile(file.id)} className="text-xs font-bold text-rose-500 hover:text-rose-700">Quitar</button>
                          <span className={`text-xs font-bold ${file.status === 'synced' ? 'text-emerald-600' : file.status === 'failed' ? 'text-rose-500' : 'text-amber-600'}`}>
                            {file.status === 'synced' ? 'Listo' : file.status === 'failed' ? 'Revisar' : 'Subiendo'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <label className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <input type="checkbox" checked={answers.consent} onChange={(event) => update('consent', event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />
                  <span className="text-sm leading-6 text-slate-700">Confirmo que la información es verdadera y que tengo autorización para entregar estos textos, imágenes, videos y testimonios para crear la landing.</span>
                </label>
                {incompleteFiles.length > 0 && <p className="mt-3 text-sm font-semibold text-amber-700">Hay {incompleteFiles.length} archivo(s) que aún no terminaron de copiarse a Drive.</p>}
              </div>
            )}

            {message && <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${message.includes('correctamente') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`} role="status">{message}</p>}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:invisible">
                <ArrowLeft size={17} /> Atrás
              </button>
              {step < steps.length - 1 ? (
                <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700">
                  Continuar <ArrowRight size={17} />
                </button>
              ) : (
                <button type="button" onClick={() => void submit()} disabled={submitting || !answers.consent || incompleteFiles.length > 0} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                  Entregar material
                </button>
              )}
            </div>
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-500">Tu material se usa únicamente para preparar este proyecto. No compartas este enlace.</p>
      </div>
    </main>
  );
}

function StatusScreen({ brand, title, description }: { brand: { name: string; logoUrl: string | null }; title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] px-4 py-12 text-slate-950">
      <section className="w-full max-w-lg rounded-[28px] border border-white bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={30} /></div>
        <p className="mt-6 text-sm font-bold text-emerald-700">{brand.name}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
      </section>
    </main>
  );
}
