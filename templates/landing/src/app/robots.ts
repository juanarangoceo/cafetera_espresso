import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Ni el panel de operación ni las cuentas de compradores tienen por qué
      // aparecer en resultados de búsqueda. No es una medida de seguridad —el
      // acceso lo deciden RLS y las políticas—, solo evita ruido.
      disallow: ['/admin', '/dashboard', '/login', '/auth'],
    },
    sitemap: 'https://coffeemakerprofesional.com/sitemap.xml',
  }
}
