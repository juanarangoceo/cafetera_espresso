import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Llaves de ingesta por sitio.
 *
 * Cada landing de cliente vive en su propio proyecto de Vercel y **no puede
 * llevar `SUPABASE_SECRET_KEY` encima**: esa clave se salta el RLS de todos los
 * inquilinos, así que una filtración en el proyecto de un cliente expondría los
 * pedidos de todos los demás. En su lugar, la landing conoce una llave que solo
 * sirve para su propio sitio y solo para crear pedidos.
 *
 * De la llave se guarda el `sha256`, nunca el valor. Quien la pierda la revoca
 * y emite otra; no hay forma de recuperarla, y esa es la intención.
 */

const PREFIX = 'nl_live_';

/** Longitud del secreto en bytes. 32 bytes son 256 bits de entropía. */
const SECRET_BYTES = 32;

export type GeneratedSiteKey = {
  /** El valor completo. Se muestra una sola vez y no se guarda en ninguna parte. */
  key: string;
  /** `sha256` en hexadecimal. Es lo único que llega a la base. */
  keyHash: string;
  /** Trozo visible para reconocerla en el panel. No permite reconstruirla. */
  prefix: string;
};

export function generateSiteKey(): GeneratedSiteKey {
  // `base64url` evita los caracteres que se rompen al viajar en una cabecera
  // o al copiarse desde una terminal.
  const secret = randomBytes(SECRET_BYTES).toString('base64url');
  const key = `${PREFIX}${secret}`;

  return {
    key,
    keyHash: hashSiteKey(key),
    prefix: `${PREFIX}${secret.slice(0, 6)}`,
  };
}

export function hashSiteKey(key: string): string {
  return createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Extrae la llave de una cabecera `Authorization: Bearer …`.
 *
 * Devuelve `null` en vez de lanzar: una cabecera ausente o mal formada es una
 * petición sin credencial, no un fallo del servidor.
 */
export function readBearerKey(header: string | null): string | null {
  if (!header) return null;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;

  const key = match[1].trim();
  if (!key.startsWith(PREFIX)) return null;

  return key;
}

/**
 * Comparación en tiempo constante de dos hashes.
 *
 * La búsqueda en la base ya se hace por hash y no por prefijo, así que el
 * margen es estrecho; aun así, comparar con `===` filtra por tiempo cuánto
 * coincide, y aquí no cuesta nada evitarlo.
 */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
