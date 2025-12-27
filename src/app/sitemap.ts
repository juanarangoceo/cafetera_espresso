import { MetadataRoute } from 'next'
import { client, SITEMAP_POSTS_QUERY } from '@/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // IMPORTANTE: Incluye www. porque el dominio hace redirección
  const baseUrl = 'https://www.cafeteraespresso.com'

  // Rutas estáticas con prioridad alta
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  try {
    // Fetch de posts desde Sanity (solo campos necesarios para el sitemap)
    const posts = await client.fetch<Array<{
      slug: string;
      publishedAt: string;
    }>>(SITEMAP_POSTS_QUERY)

    // Generar URLs dinámicas para cada post
    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    // Combinar rutas estáticas y dinámicas
    return [...staticRoutes, ...blogRoutes]
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error)
    // Si hay error, retornar solo las rutas estáticas
    return staticRoutes
  }
}
