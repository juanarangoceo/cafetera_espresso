import { PRODUCT } from '@/lib/product';

export type SiteConfig = {
  siteId: string;
  name: string;
  isActive: boolean;
  channels: {
    chatEnabled: boolean;
    voiceEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappPhone: string | null;
    whatsappMessage: string | null;
  };
  product: { name: string; price: number; currency: string } | null;
};

const SAFE_FALLBACK: SiteConfig = {
  siteId: '',
  name: PRODUCT.brand,
  isActive: false,
  channels: {
    chatEnabled: false,
    voiceEnabled: false,
    whatsappEnabled: false,
    whatsappPhone: null,
    whatsappMessage: null,
  },
  product: null,
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const endpoint = process.env.NITRO_API_URL?.trim();
  const key = process.env.NITRO_SITE_KEY?.trim();
  if (!endpoint || !key) return SAFE_FALLBACK;

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/api/v1/site`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      console.error(`Nitro rechazó la configuración del sitio (${response.status}).`);
      return SAFE_FALLBACK;
    }
    return (await response.json()) as SiteConfig;
  } catch (error) {
    console.error('No fue posible consultar la configuración de Nitro.', error);
    return SAFE_FALLBACK;
  }
}
