'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Loader2, Plus, TriangleAlert } from 'lucide-react';
import { createClientSite, type PlatformResult } from '@/app/admin/platform-actions';

const field =
  'w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20';
const label = 'mb-1.5 block text-sm font-bold text-ink-200';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl bg-nitro-500 px-5 py-2.5 font-bold text-ink-950 transition-colors hover:bg-nitro-400 disabled:opacity-70"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      Crear cliente
    </button>
  );
}

export default function NewSiteForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<PlatformResult | null, FormData>(
    createClientSite,
    null,
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-nitro-500 px-5 py-2.5 font-bold text-ink-950 transition-colors hover:bg-nitro-400"
      >
        <Plus size={18} />
        Nuevo cliente
      </button>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-ink-800 bg-ink-950 p-6">
      <h2 className="text-lg font-bold text-white">Nuevo cliente</h2>
      <p className="mt-1 text-sm text-ink-400">
        Crea la ficha corporativa, la primera landing, su producto y sus canales de una sola vez. Una landing sin producto
        no puede vender: la base rechaza cualquier pedido sin precio con el que compararlo.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">
            Nombre del sitio
          </label>
          <input id="name" name="name" required className={field} placeholder="Tienda del Cliente" />
        </div>

        <div>
          <label className={label} htmlFor="logo">
            Logo del cliente
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={`${field} file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white`}
          />
          <p className="mt-1 text-xs text-ink-500">
            Opcional. PNG, JPG o WebP, máximo 750 KB. Aparece en el dashboard del cliente.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={label} htmlFor="slug">
            Identificador
          </label>
          <input
            id="slug"
            name="slug"
            required
            className={field}
            placeholder="tienda-del-cliente"
            pattern="[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])"
          />
          <p className="mt-1 text-xs text-ink-500">
            Minúsculas y guiones. Es lo que la landing usa como <code>SITE_SLUG</code>.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="clientName">
            Nombre del cliente
          </label>
          <input id="clientName" name="clientName" required className={field} placeholder="Nombre y apellido" />
        </div>

        <div>
          <label className={label} htmlFor="contactEmail">
            Correo de contacto
          </label>
          <input id="contactEmail" name="contactEmail" type="email" className={field} placeholder="cliente@ejemplo.com" />
        </div>

        <div>
          <label className={label} htmlFor="legalName">Razón social</label>
          <input id="legalName" name="legalName" className={field} />
        </div>

        <div>
          <label className={label} htmlFor="contactName">Contacto principal</label>
          <input id="contactName" name="contactName" className={field} />
        </div>

        <div>
          <label className={label} htmlFor="contactPhone">Celular de contacto</label>
          <input id="contactPhone" name="contactPhone" inputMode="numeric" className={field} placeholder="573001234567" />
        </div>

        <div>
          <label className={label} htmlFor="productName">
            Producto que vende
          </label>
          <input id="productName" name="productName" required className={field} placeholder="Kit de ejemplo" />
        </div>

        <div>
          <label className={label} htmlFor="price">
            Precio en pesos
          </label>
          <input id="price" name="price" type="number" min="1" required className={field} placeholder="250000" />
          <p className="mt-1 text-xs text-ink-500">
            Es el importe que se cobra contraentrega. La base rechaza cualquier pedido que no
            coincida con él.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="primaryDomain">
            Dominio
          </label>
          <input id="primaryDomain" name="primaryDomain" className={field} placeholder="tienda.com" />
        </div>

        <div>
          <label className={label} htmlFor="monthlyFee">
            Tarifa mensual
          </label>
          <input id="monthlyFee" name="monthlyFee" type="number" min="0" className={field} placeholder="150000" />
          <p className="mt-1 text-xs text-ink-500">Registro interno. No cobra nada por su cuenta.</p>
        </div>

        <div>
          <label className={label} htmlFor="repositoryUrl">Repositorio de la landing</label>
          <input id="repositoryUrl" name="repositoryUrl" type="url" className={field} placeholder="https://github.com/..." />
        </div>

        <div>
          <label className={label} htmlFor="vercelProject">Proyecto en Vercel</label>
          <input id="vercelProject" name="vercelProject" className={field} placeholder="landing-cliente" />
        </div>

        <div className="md:col-span-2">
          <label className={label} htmlFor="productionUrl">URL de producción</label>
          <input id="productionUrl" name="productionUrl" type="url" className={field} placeholder="https://landing-cliente.vercel.app" />
        </div>
      </div>

      {state && (
        <p
          className={`mt-4 flex items-start gap-2 text-sm ${
            state.ok ? 'text-nitro-400' : 'text-rose-400'
          }`}
        >
          {state.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <TriangleAlert size={16} className="mt-0.5 shrink-0" />}
          {state.message}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-ink-700 px-5 py-2.5 font-bold text-ink-300 transition-colors hover:text-white"
        >
          Cerrar
        </button>
      </div>
    </form>
  );
}
