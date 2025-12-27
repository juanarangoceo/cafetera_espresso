import { client, POST_QUERY } from '@/lib/sanity';
import { PortableText, PortableTextComponents } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

const ptComponents: PortableTextComponents = {
  block: {
    h2: ({children}) => <h2 className="text-2xl md:text-3xl font-serif font-bold text-coffee-900 mt-8 mb-4">{children}</h2>,
    h3: ({children}) => <h3 className="text-xl md:text-2xl font-serif font-bold text-coffee-900 mt-6 mb-3">{children}</h3>,
    normal: ({children}) => <p className="text-base md:text-lg font-sans text-coffee-800 mb-6 leading-relaxed">{children}</p>,
    blockquote: ({children}) => <blockquote className="border-l-4 border-gold-500 pl-4 italic text-coffee-700 my-6 text-lg">{children}</blockquote>,
  },
  list: {
    bullet: ({children}) => <ul className="list-disc pl-5 font-sans text-coffee-900 mb-6 space-y-2 text-base md:text-lg">{children}</ul>,
    number: ({children}) => <ol className="list-decimal pl-5 font-sans text-coffee-900 mb-6 space-y-2 text-base md:text-lg">{children}</ol>,
  },
  listItem: {
    bullet: ({children}) => <li className="pl-1">{children}</li>,
    number: ({children}) => <li className="pl-1">{children}</li>,
  },
};

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-coffee-50 pt-32 pb-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-coffee-600 hover:text-gold-600 font-sans transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Volver al blog
          </Link>
        </div>

        <article className="bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-coffee-100">
          <header className="mb-8 md:mb-10 text-center">
             <div className="mb-4 text-xs md:text-sm font-sans text-coffee-500 uppercase tracking-wider">
              {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
             </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 leading-tight mb-6">
              {post.title}
            </h1>
          </header>

          <div className="prose prose-coffee prose-lg max-w-none text-coffee-900">
             <PortableText value={post.body} components={ptComponents} />
          </div>
        </article>
      </div>
    </main>
  );
}
