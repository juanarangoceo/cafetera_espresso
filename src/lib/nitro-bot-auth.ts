import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Autenticación de las llamadas que llegan desde Nitro Bot.
 *
 * Nitro Bot y Nitro Landing son dos proyectos con dos bases separadas. La
 * integración va por contrato HTTP de servidor a servidor: Nitro Bot **nunca**
 * recibe `SUPABASE_SECRET_KEY`, porque esa clave se salta el RLS de todos los
 * inquilinos y una filtración suya expondría los pedidos de todos.
 *
 * Por qué HMAC y no una llave estática al estilo `site_api_keys`:
 *
 *   - Las llaves de sitio autorizan **escribir un pedido en un sitio**. Esto
 *     autoriza **leer datos comerciales de cualquier cliente**, que es un
 *     alcance mucho mayor; una llave que viaja tal cual en cada petición se
 *     puede reutilizar tal cual si alguien la ve en un log.
 *   - La firma cubre el instante, el método, la ruta y el cuerpo, así que una
 *     petición capturada no se puede reenviar contra otra ruta ni fuera de su
 *     ventana de cinco minutos.
 *
 * `NITRO_BOT_INTEGRATION_SECRET_PREVIOUS` existe solo para rotar el secreto sin
 * una ventana de caída: se acepta el anterior mientras ambos despliegues se
 * ponen de acuerdo, y se borra después.
 */

/** Versión del contrato. Un cambio incompatible sube este número. */
export const NITRO_BOT_CONTRACT_VERSION = 'nitro-landing-internal-v2' as const;

/** Fuera de esta ventana la petición se rechaza aunque la firma sea válida. */
const MAX_SKEW_SECONDS = 300;

export type NitroBotAuthResult =
  | { ok: true; requestId: string }
  | { ok: false; reason: string };

function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // `timingSafeEqual` lanza si difieren en longitud, y comparar longitudes
  // antes filtra sin revelar nada que la propia longitud no revele ya.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function expectedSignature(input: {
  secret: string;
  timestamp: string;
  method: string;
  pathname: string;
  body: string;
}): string {
  const bodyHash = createHash('sha256').update(input.body, 'utf8').digest('hex');
  const canonical = `${input.timestamp}.${input.method}.${input.pathname}.${bodyHash}`;
  return `sha256=${createHmac('sha256', input.secret).update(canonical).digest('hex')}`;
}

/**
 * Verifica una petición de Nitro Bot. Devuelve el `requestId` para poder
 * correlacionar los logs de los dos proyectos ante una incidencia.
 *
 * No distingue en la respuesta entre «firma mala», «reloj desviado» y «secreto
 * sin configurar»: el motivo se registra en el servidor, pero al cliente se le
 * responde igual, para no convertir el endpoint en un oráculo.
 */
export function verifyNitroBotRequest(
  request: Request,
  body: string,
): NitroBotAuthResult {
  const secrets = [
    process.env.NITRO_BOT_INTEGRATION_SECRET,
    process.env.NITRO_BOT_INTEGRATION_SECRET_PREVIOUS,
  ].filter((value): value is string => Boolean(value && value.length >= 32));

  if (secrets.length === 0) return { ok: false, reason: 'secret_not_configured' };

  const version = request.headers.get('x-nitro-contract-version');
  if (version !== NITRO_BOT_CONTRACT_VERSION) {
    return { ok: false, reason: 'contract_version_mismatch' };
  }

  const requestId = request.headers.get('x-nitro-request-id') ?? '';
  const timestamp = request.headers.get('x-nitro-timestamp') ?? '';
  const signature = request.headers.get('x-nitro-signature') ?? '';
  if (!requestId || !timestamp || !signature) {
    return { ok: false, reason: 'missing_headers' };
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return { ok: false, reason: 'bad_timestamp' };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - sentAt);
  if (skew > MAX_SKEW_SECONDS) return { ok: false, reason: 'timestamp_out_of_window' };

  // La ruta se toma de la URL ya parseada y no de la cabecera: un proxy puede
  // reescribir cabeceras, pero lo que se sirve es este pathname.
  const pathname = new URL(request.url).pathname;
  const method = request.method.toUpperCase();

  for (const secret of secrets) {
    const expected = expectedSignature({ secret, timestamp, method, pathname, body });
    if (signaturesMatch(expected, signature)) return { ok: true, requestId };
  }
  return { ok: false, reason: 'signature_mismatch' };
}
