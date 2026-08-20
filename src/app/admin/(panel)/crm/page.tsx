import Link from 'next/link';
import { CalendarClock, Mail, Phone, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import ContactForm from '@/components/admin/ContactForm';
import {
  CONTACT_STAGES,
  CONTACT_STAGE_META,
  CONTACT_SOURCE_LABEL,
  formatFollowUp,
  isContactSource,
  isContactStage,
  todayInBogota,
} from '@/lib/crm';

const PAGE_SIZE = 40;

function sanitizeQuery(value: string) {
  return value.replace(/[,()%_\\*"']/g, ' ').trim().slice(0, 80);
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function readParam(params: Awaited<SearchParams>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const site = await getSelectedSite();
  const siteId = site?.id ?? '';

  const params = await searchParams;
  const stageParam = readParam(params, 'etapa');
  const activeStage = isContactStage(stageParam) ? stageParam : null;
  const onlyDue = readParam(params, 'pendientes') === '1';
  const search = sanitizeQuery(readParam(params, 'q') ?? '');
  const today = todayInBogota();

  const supabase = await createClient();

  const [stageCountEntries, dueResult] = await Promise.all([
    Promise.all(
      CONTACT_STAGES.map(async (stage) => {
        const { count } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .eq('stage', stage);
        return [stage, count ?? 0] as const;
      }),
    ),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .not('next_follow_up', 'is', null)
      .lte('next_follow_up', today),
  ]);

  const stageCounts = Object.fromEntries(stageCountEntries) as Record<string, number>;
  const dueCount = dueResult.count ?? 0;

  let query = supabase
    .from('contacts')
    .select('id, full_name, email, phone, city, stage, source, next_follow_up, created_at')
    .eq('site_id', siteId)
    .order('next_follow_up', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (activeStage) query = query.eq('stage', activeStage);
  // Vencidos incluidos: un pendiente de ayer sigue siendo un pendiente.
  if (onlyDue) query = query.not('next_follow_up', 'is', null).lte('next_follow_up', today);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`,
    );
  }

  const { data: contacts, error } = await query;

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-bold transition-all ${
      active
        ? 'border-nitro-500 bg-nitro-500 text-ink-950'
        : 'border-ink-700 bg-ink-800 text-ink-300 hover:border-ink-500 hover:text-white'
    }`;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">CRM</h1>
          <p className="mt-1 text-ink-400">
            {site?.name ?? 'Tienda'} · una ficha por persona, no por pedido
          </p>
        </div>
        <ContactForm mode="create" />
      </header>

      <form action="/admin/crm" className="mb-4">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Buscar por nombre, correo, celular o ciudad"
          aria-label="Buscar contactos"
          className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-white outline-none transition-all placeholder:text-ink-500 focus:border-nitro-500 focus:ring-2 focus:ring-nitro-500/20"
        />
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/crm" className={chip(!activeStage && !onlyDue)}>
          Todos
        </Link>

        <Link href="/admin/crm?pendientes=1" className={chip(onlyDue)}>
          <span className="flex items-center gap-2">
            <CalendarClock size={14} />
            Pendientes hoy <span className="opacity-70">{dueCount}</span>
          </span>
        </Link>

        {CONTACT_STAGES.map((stage) => (
          <Link
            key={stage}
            href={`/admin/crm?etapa=${stage}`}
            className={chip(activeStage === stage)}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${CONTACT_STAGE_META[stage].dot}`} />
              {CONTACT_STAGE_META[stage].label}
              <span className="opacity-70">{stageCounts[stage] ?? 0}</span>
            </span>
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          No pudimos cargar los contactos.
        </div>
      ) : !contacts?.length ? (
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-12 text-center">
          <Users size={40} className="mx-auto mb-4 text-ink-600" />
          <p className="font-bold text-white">No hay contactos que coincidan</p>
          <p className="mt-1 text-sm text-ink-400">
            Cada pedido crea su ficha automáticamente. También puedes crear una a mano.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {contacts.map((contact) => {
            const stage = isContactStage(contact.stage) ? contact.stage : 'nuevo';
            const source = isContactSource(contact.source) ? contact.source : 'manual';
            const due = contact.next_follow_up && contact.next_follow_up <= today;

            return (
              <li key={contact.id}>
                <Link
                  href={`/admin/crm/${contact.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-800 bg-ink-950 p-5 transition-colors hover:border-nitro-700"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{contact.full_name}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${CONTACT_STAGE_META[stage].badge}`}
                      >
                        {CONTACT_STAGE_META[stage].label}
                      </span>
                      <span className="text-xs text-ink-500">
                        {CONTACT_SOURCE_LABEL[source]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-400">
                      {contact.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-ink-600" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center gap-1.5 break-all">
                          <Mail size={13} className="text-ink-600" />
                          {contact.email}
                        </span>
                      )}
                      {contact.city && <span>{contact.city}</span>}
                    </div>
                  </div>

                  {contact.next_follow_up && (
                    <span
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
                        due
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-ink-800 text-ink-300'
                      }`}
                    >
                      <CalendarClock size={13} />
                      {formatFollowUp(contact.next_follow_up)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {contacts && contacts.length === PAGE_SIZE && (
        <p className="mt-6 text-center text-sm text-ink-500">
          Se muestran los primeros {PAGE_SIZE}. Afina con la búsqueda o el filtro de etapa.
        </p>
      )}
    </div>
  );
}
