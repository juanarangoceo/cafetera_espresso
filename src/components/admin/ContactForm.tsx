'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Loader2, TriangleAlert, UserPlus } from 'lucide-react';
import { saveContact } from '@/app/admin/crm-actions';
import type { ActionResult } from '@/app/admin/actions';
import { CONTACT_STAGES, CONTACT_STAGE_META, type ContactStage } from '@/lib/crm';

export type ContactFormValues = {
  id?: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  stage: ContactStage;
  nextFollowUp: string | null;
};

const field =
  'w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20';
const label = 'mb-1.5 block text-sm font-bold text-ink-200';

function SaveButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl bg-nitro-500 px-5 py-2.5 font-bold text-ink-950 transition-colors hover:bg-nitro-400 disabled:opacity-70"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export default function ContactForm({
  contact,
  mode,
}: {
  contact?: ContactFormValues;
  mode: 'create' | 'edit';
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveContact, null);
  const [open, setOpen] = useState(mode === 'edit');
  const [stage, setStage] = useState<ContactStage>(contact?.stage ?? 'por_contactar');

  if (mode === 'create' && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-5 py-2.5 font-bold text-ink-100 transition-colors hover:border-nitro-500 hover:text-nitro-400"
      >
        <UserPlus size={18} />
        Nuevo contacto
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-ink-800 bg-ink-950 p-6"
    >
      {mode === 'edit' && contact?.id && (
        <input type="hidden" name="contactId" value={contact.id} />
      )}
      {mode === 'create' && <input type="hidden" name="source" value="manual" />}

      {mode === 'create' && (
        <h2 className="text-lg font-bold text-white">Nuevo contacto</h2>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="fullName">
            Nombre
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={contact?.fullName ?? ''}
            className={field}
            placeholder="Nombre y apellido"
          />
        </div>

        <div>
          <label className={label} htmlFor="phone">
            Celular
          </label>
          <input
            id="phone"
            name="phone"
            inputMode="numeric"
            defaultValue={contact?.phone ?? ''}
            className={field}
            placeholder="3001234567"
          />
        </div>

        <div>
          <label className={label} htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ''}
            className={field}
            placeholder="nombre@ejemplo.com"
          />
        </div>

        <div>
          <label className={label} htmlFor="city">
            Ciudad
          </label>
          <input
            id="city"
            name="city"
            defaultValue={contact?.city ?? ''}
            className={field}
            placeholder="Bogotá"
          />
        </div>

        <div>
          <label className={label} htmlFor="nextFollowUp">
            Próximo contacto
          </label>
          <input
            id="nextFollowUp"
            name="nextFollowUp"
            type="date"
            defaultValue={contact?.nextFollowUp ?? ''}
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="stage">
            Etapa
          </label>
          <select
            id="stage"
            name="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as ContactStage)}
            className={`${field} cursor-pointer`}
          >
            {CONTACT_STAGES.map((value) => (
              <option key={value} value={value} className="bg-ink-900">
                {CONTACT_STAGE_META[value].label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-500">{CONTACT_STAGE_META[stage].hint}</p>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Hace falta al menos un correo o un celular: son la identidad del contacto y lo que
        evita fichas duplicadas de la misma persona.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <SaveButton>{mode === 'create' ? 'Crear contacto' : 'Guardar cambios'}</SaveButton>

        {mode === 'create' && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-bold text-ink-400 transition-colors hover:text-white"
          >
            Cancelar
          </button>
        )}

        {state && (
          <p
            role="status"
            className={`flex items-center gap-2 text-sm font-bold ${
              state.ok ? 'text-nitro-400' : 'text-rose-400'
            }`}
          >
            {state.ok ? <Check size={16} /> : <TriangleAlert size={16} />}
            {state.message ?? (state.ok ? 'Guardado.' : 'No se pudo guardar.')}
          </p>
        )}
      </div>
    </form>
  );
}
