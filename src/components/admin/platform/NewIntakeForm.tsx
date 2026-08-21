'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, ClipboardList, Copy, Loader2, TriangleAlert, X } from 'lucide-react';
import { createStandaloneIntake } from '@/app/platform/intake-actions';
import type { PlatformResult } from '@/app/admin/platform-actions';

const field = 'w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-white outline-none transition placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-nitro-500 px-5 py-2.5 font-bold text-ink-950 transition hover:bg-nitro-400 disabled:opacity-60">
      {pending ? <Loader2 size={17} className="animate-spin" /> : <ClipboardList size={17} />}
      Crear enlace
    </button>
  );
}

export default function NewIntakeForm() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState<PlatformResult | null, FormData>(createStandaloneIntake, null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl border border-nitro-500/50 bg-nitro-500/10 px-5 py-2.5 font-bold text-nitro-300 transition hover:bg-nitro-500/20">
        <ClipboardList size={18} /> Nuevo intake
      </button>
    );
  }

  return (
    <form action={action} className="w-full rounded-2xl border border-ink-800 bg-ink-950 p-6 lg:max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Intake antes del alta</h2>
          <p className="mt-1 text-sm leading-6 text-ink-400">Solo identifica el proyecto. El cliente completará producto, precio, oferta y datos legales.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar formulario" className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white"><X size={18} /></button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-sm font-bold text-ink-200">Nombre provisional</span>
          <input name="provisionalName" required maxLength={160} className={field} placeholder="Café La Montaña" />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-bold text-ink-200">Identificador</span>
          <input name="slug" required maxLength={40} pattern="[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])" className={field} placeholder="cafe-la-montana" />
          <span className="mt-1 block text-xs text-ink-500">Será la carpeta y el identificador de la futura landing.</span>
        </label>
      </div>

      {state && (
        <div className="mt-4">
          <p className={`flex items-start gap-2 text-sm ${state.ok ? 'text-nitro-400' : 'text-rose-400'}`}>
            {state.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <TriangleAlert size={16} className="mt-0.5 shrink-0" />}
            {state.message}
          </p>
          {state.secret && (
            <div className="mt-3 rounded-xl border border-nitro-700 bg-ink-900 p-3">
              <code className="block overflow-x-auto text-xs text-nitro-300">{state.secret}</code>
              <button type="button" onClick={() => {
                void navigator.clipboard.writeText(`${window.location.origin}${state.secret}`);
                setCopied(true);
              }} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-nitro-400 hover:text-nitro-300">
                <Copy size={13} /> {copied ? 'Copiado' : 'Copiar enlace completo'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5"><Submit /></div>
    </form>
  );
}
