import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, nitroBotJson } from '@/lib/nitro-bot-api';

/**
 * Los clientes de Nitro Landing, para que Nitro Admin pueda vincular uno de
 * ellos con un tenant de Nitro Bot.
 *
 * Devuelve el nombre de sus landings además del conteo: quien vincula está
 * mirando dos listas distintas —«Elegance Colombia» en el bot y «Elegance
 * Colombia» aquí— y el nombre de la landing es lo que confirma que son el mismo
 * negocio y no dos homónimos.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId } = guard.context;

  const [{ data: clients, error }, { data: sites }] = await Promise.all([
    service
      .from('clients')
      .select('id, name, legal_name, plan, status, onboarding_status, currency')
      .order('name'),
    service.from('sites').select('id, client_id, name, is_active'),
  ]);

  if (error) {
    console.error('[nitro-bot] no se pudieron listar clientes:', error.message);
    return nitroBotJson(requestId, { clients: [] });
  }

  const byClient = new Map<string, { name: string; isActive: boolean }[]>();
  for (const site of sites ?? []) {
    if (!site.client_id) continue;
    const list = byClient.get(site.client_id) ?? [];
    list.push({ name: site.name, isActive: site.is_active !== false });
    byClient.set(site.client_id, list);
  }

  return nitroBotJson(requestId, {
    clients: (clients ?? []).map((client) => {
      const own = byClient.get(client.id) ?? [];
      return {
        id: client.id,
        name: client.name,
        legalName: client.legal_name,
        plan: client.plan,
        status: client.status,
        onboardingStatus: client.onboarding_status,
        currency: client.currency,
        siteCount: own.length,
        siteNames: own.map((site) => site.name),
      };
    }),
  });
}

const newClientSchema = z.object({
  name: z.string().trim().min(2).max(160),
  legalName: z.string().trim().min(2).max(200).nullable().optional(),
  contactEmail: z.string().trim().email().max(320).nullable().optional(),
  contactPhone: z.string().trim().regex(/^[0-9]{10,15}$/).nullable().optional(),
  plan: z.string().trim().min(2).max(60).optional(),
});

/**
 * Alta de un cliente de Nitro Landing desde Nitro Admin.
 *
 * Es el «dar de alta» que antes solo existía en el panel `/platform`. No crea
 * landings ni miembros: un cliente recién creado es una ficha comercial vacía,
 * y la landing se añade después con su propio endpoint. Separarlo evita el alta
 * a medias que deja un sitio sin producto ni canales.
 */
export async function POST(request: Request) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId, body } = guard.context;

  let payload: unknown;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = newClientSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  const { data, error } = await service
    .from('clients')
    .insert({
      name: parsed.data.name,
      legal_name: parsed.data.legalName ?? null,
      contact_email: parsed.data.contactEmail ?? null,
      contact_phone: parsed.data.contactPhone ?? null,
      ...(parsed.data.plan ? { plan: parsed.data.plan } : {}),
    })
    .select('id, name')
    .single();

  if (error || !data) {
    console.error('[nitro-bot] no se pudo crear el cliente:', error?.message);
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
  }

  return nitroBotJson(requestId, { client: { id: data.id, name: data.name } });
}
