import { Coffee } from 'lucide-react'
import AccessRequestForm from '@/components/AccessRequestForm'
import { PRODUCT } from '@/lib/product'

/**
 * Acceso del comprador. Es servidor a propósito: leer el parámetro aquí evita
 * `useSearchParams` en cliente, que obligaría a envolver la página en Suspense
 * para poder prerenderizarla.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const linkExpired = params.estado === 'enlace-invalido'

  return (
    <div className="flex min-h-screen items-center justify-center bg-coffee-50 px-4 py-24">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-coffee-200 bg-white p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-coffee-900 text-gold-500">
              <Coffee size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-serif text-3xl font-bold text-coffee-900">Tu pedido</h1>
            <p className="mt-2 text-coffee-600">
              Escribe el correo con el que compraste y te enviamos un enlace para ver el
              estado de tu envío.
            </p>
          </div>

          <AccessRequestForm linkExpired={linkExpired} />

          <p className="mt-8 border-t border-coffee-100 pt-6 text-center text-sm leading-relaxed text-coffee-600">
            No hace falta crear una cuenta ni recordar contraseñas. Si aún no has comprado,
            no tendrás nada que ver aquí todavía.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-coffee-500">
          ¿Problemas para entrar? Escríbenos a{' '}
          <a
            href={`mailto:${PRODUCT.supportEmail}`}
            className="font-bold text-gold-600 underline underline-offset-2"
          >
            {PRODUCT.supportEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
