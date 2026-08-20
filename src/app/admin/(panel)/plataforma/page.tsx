import { redirect } from 'next/navigation';

/**
 * Los clientes de la plataforma.
 *
 * Es la única sección que no es de un sitio sino de todos, y la única que lee
 * con la clave de servicio. El motivo es que las llaves de ingesta no tienen
 * política de lectura para **ninguna** sesión —ni siquiera la de plataforma—,
 * así que enumerar cuáles hay solo puede hacerse desde el servidor.
 *
 * `requirePlatformAdmin()` corta antes de llegar aquí. Que la comprobación
 * ocurra en el código y no en el RLS es una excepción consciente, y por eso es
 * la primera línea de la función.
 */

export default async function PlatformPage() {
  redirect('/platform');
}
