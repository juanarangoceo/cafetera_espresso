'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, LockKeyhole, Zap } from 'lucide-react';
import { adminSignIn, type ActionResult } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-nitro-500 py-3.5 font-bold text-ink-950 shadow-lg shadow-nitro-500/20 transition-all hover:bg-nitro-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      Entrar al panel
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    adminSignIn,
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nitro-500 text-ink-950 shadow-lg shadow-nitro-500/30">
            <Zap size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Nitro <span className="text-nitro-400">Landing</span></h1>
          <p className="mt-2 text-center text-ink-400">Panel de operación</p>
        </div>

        <form
          action={formAction}
          className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900 p-8 shadow-2xl"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-ink-200" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
              placeholder="operacion@ejemplo.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink-200" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
              placeholder="••••••••"
            />
          </div>

          {state?.message && !state.ok && (
            <p
              role="alert"
              className="rounded-lg bg-rose-500/10 p-3 text-sm font-medium text-rose-300"
            >
              {state.message}
            </p>
          )}

          <SubmitButton />

          <p className="flex items-start gap-2 border-t border-ink-800 pt-5 text-xs leading-relaxed text-ink-400">
            <LockKeyhole size={14} className="mt-0.5 shrink-0" />
            <span>
              El acceso al panel no se solicita desde aquí. Las cuentas se crean por
              terminal con <code className="font-mono text-nitro-400">npm run admin:create</code>.
            </span>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          ¿Compraste y buscas tu pedido?{' '}
          <a href="/login" className="font-bold text-nitro-400 underline underline-offset-2">
            Entra por aquí
          </a>
        </p>
      </div>
    </div>
  );
}
