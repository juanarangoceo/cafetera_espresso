import { client, POSTS_QUERY, urlFor } from '@/lib/sanity';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await client.fetch(POSTS_QUERY);

  return (
    <main className="min-h-screen bg-coffee-50 pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 md:mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-coffee-900 mb-4 md:mb-6 tracking-tight">
            El Diario del Barista
          </h1>
          <p className="text-lg md:text-2xl font-sans text-coffee-700 max-w-2xl mx-auto leading-relaxed px-2">
            Descubre secretos, recetas y técnicas para perfeccionar tu ritual del café en casa.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12">
          {posts.length > 0 ? (
            posts.map((post: any) => (
              <article 
                key={post._id} 
                className="group bg-white rounded-2xl overflow-hidden border border-coffee-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
              >
                {post.mainImage && (
                  <div className="relative h-56 md:h-64 w-full overflow-hidden bg-coffee-100">
                    <Image
                      src={urlFor(post.mainImage).url()}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <div className="mb-3 md:mb-4 flex items-center text-xs md:text-sm font-sans text-coffee-500">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </time>
                  </div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-coffee-900 mb-3 md:mb-4 leading-tight group-hover:text-gold-600 transition-colors">
                    <Link href={`/blog/${post.slug.current}`}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-coffee-700 font-sans mb-6 line-clamp-3 leading-relaxed text-sm md:text-base">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto">
                    <Link 
                        href={`/blog/${post.slug.current}`}
                        className="inline-flex items-center text-gold-600 font-sans font-semibold hover:text-gold-700 transition-colors uppercase tracking-wider text-xs md:text-sm"
                    >
                        Leer artículo 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
             <div className="col-span-full text-center py-20">
              <p className="text-xl font-sans text-coffee-600">No hay artículos publicados aún.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
