import { requirePlatformAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/utils/supabase/service';
import { formatCOP } from '@/lib/orders';
import NewSiteForm from '@/components/admin/platform/NewSiteForm';
import ClientCard, { type ClientSite } from '@/components/admin/platform/ClientCard';

export const dynamic = 'force-dynamic';

export default async function PlatformPage() {
  await requirePlatformAdmin();
  const service = createServiceClient();

  if (!service) {
    return <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">Falta <code>SUPABASE_SECRET_KEY</code> en el servidor.</p>;
  }

  const [sitesResult, productsResult, membersResult, keysResult, clientsResult] = await Promise.all([
    service.from('sites').select('id, client_id, slug, name, logo_url, primary_domain, repository_url, vercel_project, production_url, integration_notes, is_active').order('name'),
    service.from('site_products').select('site_id, name, price').eq('is_active', true),
    service.from('site_members').select('site_id, email, display_name').order('email'),
    service.from('site_api_keys').select('id, site_id, prefix, label, last_used_at, revoked_at').order('created_at', { ascending: false }),
    service.from('clients').select('id, name, legal_name, contact_name, contact_email, contact_phone, plan, monthly_fee, billing_day, status, onboarding_status, next_invoice_date, notes').order('name'),
  ]);

  const clientById = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));
  const sites: ClientSite[] = (sitesResult.data ?? []).map((site) => {
    const client = clientById.get(site.client_id);
    const product = productsResult.data?.find((row) => row.site_id === site.id);
    return {
      id: site.id,
      clientId: site.client_id,
      slug: site.slug,
      name: site.name,
      logoUrl: site.logo_url,
      primaryDomain: site.primary_domain,
      repositoryUrl: site.repository_url,
      vercelProject: site.vercel_project,
      productionUrl: site.production_url,
      integrationNotes: site.integration_notes,
      isActive: site.is_active,
      product: product ? { name: product.name, price: product.price } : null,
      members: (membersResult.data ?? []).filter((row) => row.site_id === site.id).map((row) => ({ email: row.email, displayName: row.display_name })),
      keys: (keysResult.data ?? []).filter((row) => row.site_id === site.id).map((row) => ({ id: row.id, prefix: row.prefix, label: row.label, lastUsedAt: row.last_used_at, revokedAt: row.revoked_at })),
      account: client ? {
        clientName: client.name,
        legalName: client.legal_name,
        contactName: client.contact_name,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
        plan: client.plan,
        monthlyFee: client.monthly_fee,
        billingDay: client.billing_day,
        status: client.status,
        onboardingStatus: client.onboarding_status,
        nextInvoiceDate: client.next_invoice_date,
        notes: client.notes,
      } : null,
    };
  });

  const clients = clientsResult.data ?? [];
  const billed = clients.reduce((total, client) => total + (client.monthly_fee ?? 0), 0);
  const incomplete = clients.filter((client) => client.onboarding_status !== 'activo').length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Clientes y landings</h1>
          <p className="mt-1 max-w-3xl text-ink-400">Central corporativa para altas, marca, accesos, integración y facturación. No expone pedidos, contactos, direcciones ni CRM.</p>
        </div>
        <NewSiteForm />
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary value={String(clients.length)} label="Clientes" />
        <Summary value={String(sites.length)} label="Landings" />
        <Summary value={formatCOP(billed)} label="Ingreso mensual registrado" note="No cobrado automáticamente" />
        <Summary value={String(incomplete)} label="Onboarding por cerrar" />
      </div>

      <div className="space-y-4">{sites.map((site) => <ClientCard key={site.id} site={site} />)}</div>
    </div>
  );
}

function Summary({ value, label, note }: { value: string; label: string; note?: string }) {
  return <div className="rounded-2xl border border-ink-800 bg-ink-950 p-5"><p className="text-2xl font-bold text-white">{value}</p><p className="text-sm text-ink-400">{label}</p>{note && <p className="mt-0.5 text-xs text-ink-500">{note}</p>}</div>;
}
