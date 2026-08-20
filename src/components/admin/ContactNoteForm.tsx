'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { addContactNote } from '@/app/admin/crm-actions';
import type { ActionResult } from '@/app/admin/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-nitro-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition-colors hover:bg-nitro-400 disabled:opacity-70"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Guardar nota
    </button>
  );
}

export default function ContactNoteForm({ contactId }: { contactId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    addContactNote,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Vaciar el campo tras guardar evita que la siguiente nota salga duplicada
  // por un segundo envío accidental.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="contactId" value={contactId} />

      <label className="sr-only" htmlFor="body">
        Nueva nota
      </label>
      <textarea
        id="body"
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder="Qué pasó en la conversación, qué quedó pendiente…"
        className="w-full resize-y rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
      />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        {state && !state.ok && (
          <p role="alert" className="flex items-center gap-1 text-sm font-bold text-rose-400">
            <TriangleAlert size={14} />
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
