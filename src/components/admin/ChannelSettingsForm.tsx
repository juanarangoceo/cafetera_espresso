'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Loader2, MessageCircle, Mic, TriangleAlert } from 'lucide-react';
import { updateChannels, type ActionResult } from '@/app/admin/actions';
import { DEFAULT_WHATSAPP_MESSAGE, type SiteChannels } from '@/lib/site-config';

function Toggle({
  name,
  defaultChecked,
  checked,
  onChange,
  title,
  description,
  icon,
}: {
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-ink-800 bg-ink-950 p-5 transition-colors hover:border-ink-700">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-nitro-400">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-white">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-ink-400">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-ink-700 transition-colors peer-checked:bg-nitro-500 peer-focus-visible:ring-2 peer-focus-visible:ring-nitro-500/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl bg-nitro-500 px-6 py-3 font-bold text-ink-950 transition-colors hover:bg-nitro-400 disabled:opacity-70"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      Guardar cambios
    </button>
  );
}

export default function ChannelSettingsForm({ channels }: { channels: SiteChannels }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateChannels,
    null,
  );

  const [whatsappEnabled, setWhatsappEnabled] = useState(channels.whatsappEnabled);
  const [phone, setPhone] = useState(channels.whatsappPhone ?? '');
  const [message, setMessage] = useState(channels.whatsappMessage ?? '');

  const digits = phone.replace(/\D/g, '');
  const preview = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message.trim() || DEFAULT_WHATSAPP_MESSAGE)}`
    : null;

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Asistentes</h2>

        <Toggle
          name="chatEnabled"
          defaultChecked={channels.chatEnabled}
          title="Chat escrito"
          description="Marco responde por escrito en la esquina inferior derecha y puede tomar pedidos."
          icon={<MessageCircle size={20} />}
        />

        <Toggle
          name="voiceEnabled"
          defaultChecked={channels.voiceEnabled}
          title="Llamada en vivo"
          description="Marco atiende por voz. Consume créditos de OpenAI en cada llamada."
          icon={<Mic size={20} />}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">WhatsApp</h2>

        <Toggle
          name="whatsappEnabled"
          checked={whatsappEnabled}
          onChange={setWhatsappEnabled}
          title="Botón de WhatsApp"
          description="Botón flotante que abre la conversación con el número de abajo."
          icon={<MessageCircle size={20} />}
        />

        <div className="space-y-4 rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <div>
            <label htmlFor="whatsappPhone" className="mb-1 block font-bold text-white">
              Número
            </label>
            <p className="mb-2 text-sm text-ink-400">
              Con indicativo del país y sin signos. Para Colombia, 57 seguido del celular.
            </p>
            <input
              id="whatsappPhone"
              name="whatsappPhone"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="573001234567"
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 font-mono text-white outline-none transition-all focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
            />
          </div>

          <div>
            <label htmlFor="whatsappMessage" className="mb-1 block font-bold text-white">
              Mensaje prellenado
            </label>
            <p className="mb-2 text-sm text-ink-400">
              Lo que aparece escrito cuando se abre la conversación. Si lo dejas vacío se usa
              uno por defecto.
            </p>
            <textarea
              id="whatsappMessage"
              name="whatsappMessage"
              rows={3}
              maxLength={300}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={DEFAULT_WHATSAPP_MESSAGE}
              className="w-full resize-y rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-white outline-none transition-all focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
            />
            <p className="mt-1 text-right text-xs text-ink-500">{message.length}/300</p>
          </div>

          {preview ? (
            <div className="rounded-xl bg-ink-900 p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-400">
                Así queda el enlace
              </p>
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono text-xs text-ink-300 underline underline-offset-2 hover:text-nitro-400"
              >
                {preview}
              </a>
            </div>
          ) : (
            whatsappEnabled && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-300">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                Sin número el botón no puede encenderse.
              </p>
            )
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <SaveButton />

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
