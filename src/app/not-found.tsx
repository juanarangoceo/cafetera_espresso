import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-coffee-50 p-4 text-center">
      <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">404 - Página no encontrada</h2>
      <p className="text-coffee-600 mb-8">Lo sentimos, no pudimos encontrar el café que buscabas.</p>
      <Link 
        href="/"
        className="bg-gold-500 text-coffee-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-gold-500/20 hover:scale-105 transition-all"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
