import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // IMPORTANTE: Incluye www. porque el dominio hace redirección
  const baseUrl = 'https://www.cafeteraespresso.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
