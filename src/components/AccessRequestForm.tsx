'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, MailCheck, TriangleAlert } from 'lucide-react'
import { requestAccessLink, type LoginResult } from '@/app/login/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-3.5 font-bold text-white shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      Enviarme el enlace
    </button>
  )
}

export default function AccessRequestForm({ linkExpired }: { linkExpired: boolean }) {
  const [state, formAction] = useActionState<LoginResult | null, FormData>(
    requestAccessLink,
    null,
  )

  return (
    <>
      {linkExpired && !state?.ok && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          Ese enlace ya no sirve. Son de un solo uso y se vencen: pide uno nuevo aquí abajo.
        </p>
      )}

      {state?.ok ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <MailCheck size={32} className="mx-auto mb-3 text-emerald-600" />
          <p className="font-bold text-emerald-900">Revisa tu correo</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">{state.message}</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-coffee-800" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-coffee-200 bg-coffee-50/50 px-4 py-3 outline-none transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              placeholder="nombre@ejemplo.com"
            />
          </div>

          {state && !state.ok && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600"
            >
              {state.message}
            </p>
          )}

          <SubmitButton />
        </form>
      )}
    </>
  )
}
