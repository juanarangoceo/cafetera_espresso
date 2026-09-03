import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';
import { NextResponse } from 'next/server';

/**
 * Lo que Nitro Bot pinta cuando el cliente abre «Nitro Landing»: sus landings,
 * cómo van sus pedidos y a dónde ir para editarlas.
 *
 * Lo que NO devuelve, y conviene saberlo antes de buscarlo: visitas, sesiones,
 * scroll ni tasa de conversión. Nitro Landing no guarda analítica de
 * comportamiento —la medición vive en Meta Pixel, del lado del navegador—, así
 * que las únicas cifras honestas aquí salen de los pedidos. Inventar un
 * embudo con los datos que hay sería peor que no mostrarlo.
 */
export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 30;

export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId } = guard.context;

  const clientId = (await context.params).clientId;
  if (!isUuid(clientId)) {
    return NextResponse.json({ ok: false, error: 'bad_client_id' }, { status: 400 });
  }

  const { data: client } = await service
    .from('clients')
    .select('id, name, legal_name, plan, status, onboarding_status, currency')
    .eq('id', clientId)
    .maybeSingle();
  // 404 y no 403: para Nitro Bot «no vinculado» y «cliente inexistente» son la
  // misma pantalla, y no hay nada que ganar distinguiéndolos.
  if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const { data: sites } = await service
    .from('sites')
    .select('id, name, slug, is_active, primary_domain, production_url, vercel_project, created_at, updated_at')
    .eq('client_id', clientId)
    .order('name');

  const siteIds = (sites ?? []).map((site) => site.id);
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000).toISOString();

  // Sin landings no hay nada que agregar, y un `.in()` con lista vacía es una
  // consulta que PostgREST resuelve pero que no hace falta pagar.
  const orders = siteIds.length
    ? (
        await service
          .from('orders_cod')
          .select('id, site_id, status, total_price, created_at')
          .in('site_id', siteIds)
          .gte('created_at', since)
      ).data ?? []
    : [];

  const recent = siteIds.length
    ? (
        await service
          .from('orders_cod')
          .select('id, site_id, full_name, phone, city, status, total_price, created_at')
          .in('site_id', siteIds)
          .order('created_at', { ascending: false })
          .limit(20)
      ).data ?? []
    : [];

  const metricsFor = (rows: typeof orders) => {
    const cancelled = rows.filter((row) => row.status === 'cancelled');
    return {
      orders: rows.length,
      // Bruto y cancelado por separado: restarlos aquí escondería cuánto se
      // está cayendo, que es justo el número que hay que vigilar.
      revenue: rows.reduce((sum, row) => sum + Number(row.total_price ?? 0), 0),
      revenueCancelled: cancelled.reduce((sum, row) => sum + Number(row.total_price ?? 0), 0),
      ordersCancelled: cancelled.length,
    };
  };

  return nitroBotJson(requestId, {
    client: {
      id: client.id,
      name: client.name,
      legalName: client.legal_name,
      plan: client.plan,
      status: client.status,
      onboardingStatus: client.onboarding_status,
      currency: client.currency ?? 'COP',
    },
    sites: (sites ?? []).map((site) => ({
      id: site.id,
      name: site.name,
      slug: site.slug,
      isActive: site.is_active !== false,
      publicUrl: site.production_url ?? (site.primary_domain ? `https://${site.primary_domain}` : null),
      primaryDomain: site.primary_domain,
      vercelProject: site.vercel_project,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      metrics30d: metricsFor(orders.filter((order) => order.site_id === site.id)),
    })),
    totals30d: metricsFor(orders),
    recentOrders: recent.map((order) => ({
      id: order.id,
      siteId: order.site_id,
      customerName: order.full_name,
      customerPhone: order.phone,
      city: order.city,
      status: order.status,
      totalAmount: Number(order.total_price ?? 0),
      createdAt: order.created_at,
    })),
    windowDays: WINDOW_DAYS,
  });
}
