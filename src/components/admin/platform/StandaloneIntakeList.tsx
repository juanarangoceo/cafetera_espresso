'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Check, ClipboardCheck, Clock3, Copy, Eye, Loader2, RotateCw, TriangleAlert, UserRoundPlus, XCircle } from 'lucide-react';
import {
  convertIntakeToClient,
  reissueStandaloneIntakeLink,
  revokeIntakeLink,
} from '@/app/platform/intake-actions';
import type { PlatformResult } from '@/app/admin/platform-actions';
import { formatColombiaDate, formatColombiaDateTime } from '@/lib/colombia-date';
import type { IntakeAnswers } from '@/lib/intake';

export type StandaloneIntake = {
  id: string;
  provisionalName: string;
  slug: string;
  status: 'draft' | 'submitted';
  expiresAt: string;
  submittedAt: string | null;
  createdAt: string;
  answers: IntakeAnswers;
  fileCount: number;
  storedFileCount: number;
  totalBytes: number;
  lastActivityAt: string;
  hasProgress: boolean;
};

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function SubmitButton({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'quiet' | 'danger' }) {
  const { pending } = useFormStatus();
  const colors = tone === 'primary'
    ? 'bg-nitro-500 text-ink-950 hover:bg-nitro-400'
    : tone === 'danger'
      ? 'border border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
      : 'border border-ink-700 text-ink-200 hover:bg-ink-800';
  return <button type="submit" disabled={pending} className={`flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${colors}`}>{pending && <Loader2 size={13} className="animate-spin" />}{children}</button>;
}

function Feedback({ state }: { state: PlatformResult | null }) {
  if (!state) return null;
  return (
    <div className="mt-3">
      <p className={`flex items-start gap-2 text-sm ${state.ok ? 'text-nitro-400' : 'text-rose-400'}`}>
        {state.ok ? <Check size={15} className="mt-0.5 shrink-0" /> : <TriangleAlert size={15} className="mt-0.5 shrink-0" />}{state.message}
      </p>
      {state.secret && (
        <button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${state.secret}`)} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-nitro-400 hover:text-nitro-300">
          <Copy size={13} /> Copiar enlace nuevo
        </button>
      )}
    </div>
  );
}

function IntakeCard({ intake }: { intake: StandaloneIntake }) {
  const [renewState, renewAction] = useActionState<PlatformResult | null, FormData>(reissueStandaloneIntakeLink, null);
  const [revokeState, revokeAction] = useActionState<PlatformResult | null, FormData>(revokeIntakeLink, null);
  const [convertState, convertAction] = useActionState<PlatformResult | null, FormData>(convertIntakeToClient, null);
  const received = intake.status === 'submitted';
  const inProgress = !received && (intake.hasProgress || intake.fileCount > 0);
  const stateLabel = received ? 'Información recibida' : inProgress ? 'Cliente completando' : 'Esperando al cliente';

  return (
    <article className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {received ? <ClipboardCheck size={18} className="text-nitro-400" /> : <Clock3 size={18} className="text-amber-400" />}
            <h3 className="font-bold text-white">{intake.provisionalName}</h3>
          </div>
          <p className="mt-1 text-xs text-ink-500"><code>{intake.slug}</code> · {received ? `recibido ${formatColombiaDate(intake.submittedAt!)}` : `vence ${formatColombiaDate(intake.expiresAt)}`}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${received ? 'bg-nitro-500/10 text-nitro-400' : inProgress ? 'bg-sky-500/10 text-sky-300' : 'bg-amber-500/10 text-amber-300'}`}>{stateLabel}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
        <span>{intake.storedFileCount}/{intake.fileCount} archivos listos{intake.totalBytes > 0 ? ` · ${formatBytes(intake.totalBytes)}` : ''}</span>
        <span>Última actividad {formatColombiaDateTime(intake.lastActivityAt)}</span>
        <Link href={`/platform/intakes/${intake.id}`} className="flex items-center gap-1.5 font-bold text-nitro-400 hover:text-nitro-300">
          <Eye size={13} /> Revisar información
        </Link>
      </div>

      {received ? (
        <>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs font-bold text-ink-500">Marca</dt><dd className="mt-0.5 text-ink-200">{intake.answers.businessName}</dd></div>
            <div><dt className="text-xs font-bold text-ink-500">Producto</dt><dd className="mt-0.5 text-ink-200">{intake.answers.productName}</dd></div>
            <div><dt className="text-xs font-bold text-ink-500">Precio</dt><dd className="mt-0.5 text-ink-200">{intake.answers.price} {intake.answers.currency}</dd></div>
            <div><dt className="text-xs font-bold text-ink-500">Mercado</dt><dd className="mt-0.5 text-ink-200">{intake.answers.market}</dd></div>
          </dl>
          <form action={convertAction} className="mt-4">
            <input type="hidden" name="requestId" value={intake.id} />
            <SubmitButton><UserRoundPlus size={14} /> Crear cliente desde el brief</SubmitButton>
          </form>
          <Feedback state={convertState} />
        </>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <form action={renewAction}>
              <input type="hidden" name="requestId" value={intake.id} />
              <SubmitButton tone="quiet"><RotateCw size={13} /> Renovar enlace</SubmitButton>
            </form>
            <form action={revokeAction}>
              <input type="hidden" name="requestId" value={intake.id} />
              <SubmitButton tone="danger"><XCircle size={13} /> Cerrar</SubmitButton>
            </form>
          </div>
          <Feedback state={renewState} />
          <Feedback state={revokeState} />
        </div>
      )}
    </article>
  );
}

export default function StandaloneIntakeList({ intakes }: { intakes: StandaloneIntake[] }) {
  if (!intakes.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-white">Solicitudes antes del alta</h2>
        <p className="mt-1 text-sm text-ink-400">Prospectos que todavía no necesitan cliente, producto ni precio en la plataforma.</p>
      </div>
      <div className="space-y-3">{intakes.map((intake) => <IntakeCard key={intake.id} intake={intake} />)}</div>
    </section>
  );
}
