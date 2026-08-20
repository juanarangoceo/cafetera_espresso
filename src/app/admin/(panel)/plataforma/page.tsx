import { requirePlatformAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/utils/supabase/service';
import { formatCOP } from '@/lib/orders';
import NewSiteForm from '@/components/admin/platform/NewSiteForm';
import ClientCard, { type ClientSite } from '@/components/admin/platform/ClientCard';

/**
 * Los clientes de la plataforma.
 *
 * Es la única sección que no es de un sitio sino de todos, y la única que lee
 * con la clave de servicio. El motivo es que las llaves de ingesta no tienen
 * política de lectura para **ninguna** sesión —ni siquiera la de plataforma—,
 * así que enumerar cuáles hay solo puede hacerse desde el servidor.
 *
 * `requirePlatformAdmin()` corta antes de llegar aquí. Que la comprobación
 * ocurra en el código y no en el RLS es una excepción consciente, y por eso es
 * la primera línea de la función.
 */

export const dynamic = 'force-dynamic';

export default async function PlatformPage() {
  await requirePlatformAdmin();

  const service = createServiceClient();

  if (!service) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight text-white">Clientes</h1>
        <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          Falta <code>SUPABASE_SECRET_KEY</code> en el servidor. Sin ella no se pueden dar de alta
          clientes ni emitir llaves.
        </p>
      </div>
    );
  }

  const [sitesResult, productsResult, membersResult, keysResult, accountsResult] = await Promise.all([
    service.from('sites').select('id, slug, name, logo_url, primary_domain, is_active').order('name'),
    service.from('site_products').select('site_id, name, price').eq('is_active', true),
    service.from('site_members').select('site_id, email, display_name').order('email'),
    service
      .from('site_api_keys')
      .select('id, site_id, prefix, label, last_used_at, revoked_at')
      .order('created_at', { ascending: false }),
    service
      .from('site_accounts')
      .select('site_id, client_name, plan, monthly_fee, billing_day, status, next_invoice_date, notes'),
  ]);

  const sites = sitesResult.data ?? [];

  // Un conteo por sitio en vez de traerse los pedidos: la página solo necesita
  // el número, y una tienda con historial haría inviable lo contrario.
  const orderCounts = await Promise.all(
    sites.map(async (site) => {
      const { count } = await service
        .from('orders_cod')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', site.id);
      return [site.id, count ?? 0] as const;
    }),
  );
  const ordersBySite = new Map(orderCounts);

  const clients: ClientSite[] = sites.map((site) => {
    const product = productsResult.data?.find((row) => row.site_id === site.id);
    const account = accountsResult.data?.find((row) => row.site_id === site.id);

    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      logoUrl: site.logo_url,
      primaryDomain: site.primary_domain,
      isActive: site.is_active,
      orders: ordersBySite.get(site.id) ?? 0,
      product: product ? { name: product.name, price: product.price } : null,
      members: (membersResult.data ?? [])
        .filter((row) => row.site_id === site.id)
        .map((row) => ({ email: row.email, displayName: row.display_name })),
      keys: (keysResult.data ?? [])
        .filter((row) => row.site_id === site.id)
        .map((row) => ({
          id: row.id,
          prefix: row.prefix,
          label: row.label,
          lastUsedAt: row.last_used_at,
          revokedAt: row.revoked_at,
        })),
      account: account
        ? {
            clientName: account.client_name,
            plan: account.plan,
            monthlyFee: account.monthly_fee,
            billingDay: account.billing_day,
            status: account.status,
            nextInvoiceDate: account.next_invoice_date,
            notes: account.notes,
          }
        : null,
    };
  });

  const billed = clients.reduce((total, client) => total + (client.account?.monthlyFee ?? 0), 0);
  const overdue = clients.filter((client) => client.account?.status === 'moroso').length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Clientes</h1>
          <p className="mt-1 text-ink-400">
            Cada cliente es un sitio con su producto, su gente y su llave. Nadie ve los datos de
            nadie: eso lo garantizan las políticas de la base, no esta pantalla.
          </p>
        </div>
        <NewSiteForm />
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-sm text-ink-400">Sitios</p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className="text-2xl font-bold text-white">{formatCOP(billed)}</p>
          <p className="text-sm text-ink-400">Facturación mensual</p>
          <p className="mt-0.5 text-xs text-ink-500">Registro interno, no cobrado</p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5">
          <p className={`text-2xl font-bold ${overdue ? 'text-rose-400' : 'text-white'}`}>{overdue}</p>
          <p className="text-sm text-ink-400">En mora</p>
        </div>
      </div>

      <div className="space-y-4">
        {clients.map((client) => (
          <ClientCard key={client.id} site={client} />
        ))}
      </div>
    </div>
  );
}
