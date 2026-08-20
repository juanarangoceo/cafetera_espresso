'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Globe, ImageIcon, KeyRound, Loader2, Power, TriangleAlert, UserPlus } from 'lucide-react';
import {
  createSiteMember,
  issueSiteKey,
  revokeSiteKey,
  toggleSiteActive,
  updateSiteAccount,
  updateSiteBranding,
  type PlatformResult,
} from '@/app/admin/platform-actions';
import { formatCOP } from '@/lib/orders';

const field =
  'w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20';
const label = 'mb-1 block text-xs font-bold text-ink-300';

export type ClientSite = {
  id: string;
  clientId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryDomain: string | null;
  repositoryUrl: string | null;
  vercelProject: string | null;
  productionUrl: string | null;
  integrationNotes: string | null;
  isActive: boolean;
  product: { name: string; price: number } | null;
  members: { email: string; displayName: string | null }[];
  keys: { id: string; prefix: string; label: string | null; lastUsedAt: string | null; revokedAt: string | null }[];
  account: {
    clientName: string;
    legalName: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    plan: string;
    monthlyFee: number | null;
    billingDay: number | null;
    status: string;
    onboardingStatus: string;
    nextInvoiceDate: string | null;
    notes: string | null;
  } | null;
};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl bg-nitro-500 px-4 py-2 text-sm font-bold text-ink-950 transition-colors hover:bg-nitro-400 disabled:opacity-70"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function Feedback({ state }: { state: PlatformResult | null }) {
  if (!state) return null;

  return (
    <div className="mt-3">
      <p className={`flex items-start gap-2 text-sm ${state.ok ? 'text-nitro-400' : 'text-rose-400'}`}>
        {state.ok ? (
          <Check size={15} className="mt-0.5 shrink-0" />
        ) : (
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
        )}
        {state.message}
      </p>

      {/* La llave se muestra una sola vez. De la base solo sale su hash, así que
          si se pierde aquí, se revoca y se emite otra. */}
      {state.secret && (
        <pre className="mt-2 overflow-x-auto rounded-xl border border-nitro-700 bg-ink-900 p-3 text-xs text-nitro-300">
          {state.secret}
        </pre>
      )}
    </div>
  );
}

type Tab = 'marca' | 'acceso' | 'llaves' | 'cuenta';

export default function ClientCard({ site }: { site: ClientSite }) {
  const [tab, setTab] = useState<Tab | null>(null);

  const [memberState, memberAction] = useActionState<PlatformResult | null, FormData>(createSiteMember, null);
  const [keyState, keyAction] = useActionState<PlatformResult | null, FormData>(issueSiteKey, null);
  const [revokeState, revokeAction] = useActionState<PlatformResult | null, FormData>(revokeSiteKey, null);
  const [accountState, accountAction] = useActionState<PlatformResult | null, FormData>(updateSiteAccount, null);
  const [brandingState, brandingAction] = useActionState<PlatformResult | null, FormData>(updateSiteBranding, null);
  const [activeState, activeAction] = useActionState<PlatformResult | null, FormData>(toggleSiteActive, null);

  const activeKeys = site.keys.filter((key) => !key.revokedAt);

  return (
    <article className="rounded-2xl border border-ink-800 bg-ink-950 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {site.logoUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink-700 bg-white">
              <Image src={site.logoUrl} alt={`Logo de ${site.name}`} fill sizes="48px" className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 text-ink-500">
              <ImageIcon size={20} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{site.name}</h3>
            <p className="mt-0.5 truncate text-sm text-ink-400">
              {site.account?.clientName ?? 'Sin cuenta'} · <code className="text-ink-500">{site.slug}</code>
            </p>
            {site.primaryDomain && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
                <Globe size={13} />
                {site.primaryDomain}
              </p>
            )}
          </div>
        </div>

        <div className="text-right text-sm">
          {/* Desconectar apaga la venta de esa landing sin desplegar nada y sin
              entrar a su proyecto: la API deja de aceptarle pedidos y la propia
              landing esconde el checkout al releer su configuración. */}
          <form action={activeAction} className="mb-2 flex justify-end">
            <input type="hidden" name="siteId" value={site.id} />
            <input type="hidden" name="isActive" value={site.isActive ? 'false' : 'true'} />
            <button
              type="submit"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors ${
                site.isActive
                  ? 'border-nitro-700 text-nitro-400 hover:bg-nitro-500/10'
                  : 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Power size={12} />
              {site.isActive ? 'Conectada' : 'Desconectada'}
            </button>
          </form>

          <p className="text-ink-400">
            {site.product ? `${site.product.name} · ${formatCOP(site.product.price)}` : 'Sin producto'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {activeKeys.length} {activeKeys.length === 1 ? 'llave activa' : 'llaves activas'} ·{' '}
            {site.members.length} {site.members.length === 1 ? 'usuario' : 'usuarios'}
          </p>
        </div>
      </header>

      {activeState && (
        <p className={`mt-3 text-sm ${activeState.ok ? 'text-nitro-400' : 'text-rose-400'}`}>
          {activeState.message}
        </p>
      )}

      {!site.isActive && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          <Power size={15} className="mt-0.5 shrink-0" />
          Desconectada. Su landing no acepta pedidos y esconde el checkout.
        </p>
      )}

      {/* Un cliente sin usuario no puede entrar; uno sin llave no puede vender.
          Se avisa porque son las dos formas de dejar un alta a medias. */}
      {(!site.members.length || !activeKeys.length) && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {!site.members.length && !activeKeys.length
            ? 'Sin usuario y sin llave: el cliente no puede entrar ni su landing puede vender.'
            : !site.members.length
              ? 'Sin usuario: el cliente todavía no puede entrar al panel.'
              : 'Sin llave activa: su landing no puede crear pedidos.'}
        </p>
      )}

      <nav className="mt-5 flex gap-2">
        {(['marca', 'acceso', 'llaves', 'cuenta'] as Tab[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(tab === name ? null : name)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold capitalize transition-colors ${
              tab === name ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </nav>

      {tab === 'marca' && (
        <div className="mt-4 border-t border-ink-800 pt-4">
          <form action={brandingAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="siteId" value={site.id} />
            <div>
              <label className={label}>Nombre visible</label>
              <input name="name" defaultValue={site.name} required className={field} />
            </div>
            <div>
              <label className={label}>Dominio</label>
              <input name="primaryDomain" defaultValue={site.primaryDomain ?? ''} className={field} placeholder="cliente.com" />
            </div>
            <div>
              <label className={label}>Repositorio Git</label>
              <input name="repositoryUrl" type="url" defaultValue={site.repositoryUrl ?? ''} className={field} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className={label}>Proyecto en Vercel</label>
              <input name="vercelProject" defaultValue={site.vercelProject ?? ''} className={field} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>URL de producción</label>
              <input name="productionUrl" type="url" defaultValue={site.productionUrl ?? ''} className={field} placeholder="https://..." />
            </div>
            <div>
              <label className={label}>Nuevo logo</label>
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={`${field} file:mr-2 file:rounded-md file:border-0 file:bg-ink-700 file:px-2 file:py-1 file:text-xs file:font-bold file:text-white`}
              />
              <p className="mt-1 text-xs text-ink-500">PNG, JPG o WebP, máximo 750 KB.</p>
            </div>
            {site.logoUrl && (
              <label className="flex items-center gap-2 text-sm text-ink-300 md:col-span-2">
                <input name="removeLogo" type="checkbox" value="true" className="h-4 w-4 accent-nitro-500" />
                Quitar el logo actual si no selecciono uno nuevo
              </label>
            )}
            <div className="md:col-span-2">
              <label className={label}>Instrucciones internas de integración</label>
              <textarea name="integrationNotes" rows={3} defaultValue={site.integrationNotes ?? ''} className={field} />
            </div>
            <div className="md:col-span-2">
              <Submit>Guardar marca</Submit>
            </div>
          </form>
          <Feedback state={brandingState} />
        </div>
      )}

      {tab === 'acceso' && (
        <div className="mt-4 border-t border-ink-800 pt-4">
          {site.members.length > 0 && (
            <ul className="mb-4 space-y-1 text-sm text-ink-300">
              {site.members.map((member) => (
                <li key={member.email}>
                  {member.displayName ? `${member.displayName} · ` : ''}
                  {member.email}
                </li>
              ))}
            </ul>
          )}

          <form action={memberAction} className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="siteId" value={site.id} />
            <div>
              <label className={label}>Correo</label>
              <input name="email" type="email" required className={field} placeholder="cliente@ejemplo.com" />
            </div>
            <div>
              <label className={label}>Contraseña</label>
              <input name="password" type="password" required minLength={8} className={field} placeholder="mínimo 8" />
            </div>
            <div>
              <label className={label}>Nombre</label>
              <input name="displayName" className={field} placeholder="opcional" />
            </div>
            <div className="md:col-span-3">
              <Submit>
                <UserPlus size={14} />
                Crear usuario
              </Submit>
            </div>
          </form>

          <Feedback state={memberState} />
        </div>
      )}

      {tab === 'llaves' && (
        <div className="mt-4 border-t border-ink-800 pt-4">
          {site.keys.length > 0 && (
            <ul className="mb-4 space-y-2">
              {site.keys.map((key) => (
                <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className={key.revokedAt ? 'text-ink-500 line-through' : 'text-ink-200'}>
                    <code>{key.prefix}…</code>
                    {key.label ? ` · ${key.label}` : ''}
                    <span className="ml-2 text-xs text-ink-500">
                      {key.revokedAt
                        ? 'revocada'
                        : key.lastUsedAt
                          ? `último uso ${new Date(key.lastUsedAt).toLocaleDateString('es-CO')}`
                          : 'sin usar'}
                    </span>
                  </span>

                  {!key.revokedAt && (
                    <form action={revokeAction}>
                      <input type="hidden" name="keyId" value={key.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-500/40 px-2.5 py-1 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        Revocar
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form action={keyAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="siteId" value={site.id} />
            <div className="min-w-[200px] flex-1">
              <label className={label}>Etiqueta</label>
              <input name="label" className={field} placeholder="Landing de producción" />
            </div>
            <Submit>
              <KeyRound size={14} />
              Emitir llave
            </Submit>
          </form>

          <p className="mt-2 text-xs text-ink-500">
            Va en el proyecto de Vercel de esa landing como <code>NITRO_SITE_KEY</code>. Es lo único
            que la landing necesita: nunca le des una clave de Supabase.
          </p>

          <Feedback state={keyState} />
          <Feedback state={revokeState} />
        </div>
      )}

      {tab === 'cuenta' && site.account && (
        <div className="mt-4 border-t border-ink-800 pt-4">
          <form action={accountAction} className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="clientId" value={site.clientId} />
            <div>
              <label className={label}>Cliente / nombre comercial</label>
              <input name="clientName" defaultValue={site.account.clientName} required className={field} />
            </div>
            <div>
              <label className={label}>Razón social</label>
              <input name="legalName" defaultValue={site.account.legalName ?? ''} className={field} />
            </div>
            <div>
              <label className={label}>Contacto principal</label>
              <input name="contactName" defaultValue={site.account.contactName ?? ''} className={field} />
            </div>
            <div>
              <label className={label}>Correo corporativo</label>
              <input name="contactEmail" type="email" defaultValue={site.account.contactEmail ?? ''} className={field} />
            </div>
            <div>
              <label className={label}>Celular corporativo</label>
              <input name="contactPhone" inputMode="numeric" defaultValue={site.account.contactPhone ?? ''} className={field} />
            </div>
            <div>
              <label className={label}>Plan</label>
              <input name="plan" defaultValue={site.account.plan} required className={field} />
            </div>
            <div>
              <label className={label}>Tarifa mensual</label>
              <input
                name="monthlyFee"
                type="number"
                min="0"
                defaultValue={site.account.monthlyFee ?? ''}
                className={field}
              />
            </div>
            <div>
              <label className={label}>Día de corte</label>
              <input
                name="billingDay"
                type="number"
                min="1"
                max="28"
                defaultValue={site.account.billingDay ?? ''}
                className={field}
              />
            </div>
            <div>
              <label className={label}>Estado</label>
              <select name="status" defaultValue={site.account.status} className={field}>
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="moroso">Moroso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            <div>
              <label className={label}>Onboarding</label>
              <select name="onboardingStatus" defaultValue={site.account.onboardingStatus} className={field}>
                <option value="pendiente">Pendiente</option>
                <option value="configurando">Configurando</option>
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <div>
              <label className={label}>Próxima factura</label>
              <input
                name="nextInvoiceDate"
                type="date"
                defaultValue={site.account.nextInvoiceDate ?? ''}
                className={field}
              />
            </div>
            <div className="md:col-span-3">
              <label className={label}>Notas</label>
              <textarea name="notes" rows={2} defaultValue={site.account.notes ?? ''} className={field} />
            </div>
            <div className="md:col-span-3">
              <Submit>Guardar</Submit>
            </div>
          </form>

          <Feedback state={accountState} />
        </div>
      )}
    </article>
  );
}
