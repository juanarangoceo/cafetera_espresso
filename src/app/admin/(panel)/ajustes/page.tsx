import { requireAdmin } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import ChannelSettingsForm from '@/components/admin/ChannelSettingsForm';
import type { SiteChannels } from '@/lib/site-config';

export default async function AdminChannelsPage() {
  await requireAdmin();
  const site = await getSelectedSite();

  const supabase = await createClient();

  // La lectura no pasa por `getSiteChannels`: esa versión está cacheada para
  // servir la landing, y el panel tiene que mostrar lo que hay guardado ahora
  // mismo, incluso justo después de un cambio.
  const { data, error } = site
    ? await supabase
        .from('site_channels')
        .select(
          'site_id, chat_enabled, voice_enabled, whatsapp_enabled, whatsapp_phone, whatsapp_message',
        )
        .eq('site_id', site.id)
        .maybeSingle()
    : { data: null, error: null };

  if (!site || error || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-white">Canales</h1>
        <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          No pudimos cargar la configuración de la tienda.
        </p>
      </div>
    );
  }

  const channels: SiteChannels = {
    siteId: data.site_id,
    chatEnabled: data.chat_enabled,
    voiceEnabled: data.voice_enabled,
    whatsappEnabled: data.whatsapp_enabled,
    whatsappPhone: data.whatsapp_phone,
    whatsappMessage: data.whatsapp_message,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Canales</h1>
        <p className="mt-1 text-ink-400">
          Qué se muestra en <strong className="font-bold text-nitro-400">{site.name}</strong>.
          Los cambios entran de inmediato, sin desplegar.
        </p>
      </header>

      <ChannelSettingsForm channels={channels} />
    </div>
  );
}
