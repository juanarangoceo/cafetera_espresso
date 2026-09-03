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
