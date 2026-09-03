import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { NITRO_BOT_CONTRACT_VERSION, verifyNitroBotRequest } from './nitro-bot-auth';

/**
 * Andamiaje común de `/api/internal/v1/*`, la superficie que consume Nitro Bot.
 *
 * Está aparte de `/api/v1/*` a propósito: aquella es la ingesta que usan las
 * landings con su llave de sitio y solo alcanza su propio sitio; esta lee datos
 * comerciales de cualquier cliente y por eso exige firma HMAC. Mezclarlas
 * haría que un error de autorización en una abriera la otra.
 */

export type NitroBotContext = {
  service: NonNullable<ReturnType<typeof createServiceClient>>;
  requestId: string;
};

type Guarded =
  | { ok: true; context: NitroBotContext }
  | { ok: false; response: NextResponse };

/** Respuesta uniforme para todo fallo de credencial: no revela cuál falló. */
function denied() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function guardNitroBotRequest(request: Request): Promise<Guarded> {
  // El cuerpo se lee una sola vez y se pasa a la firma: `Request` no se puede
  // consumir dos veces, y firmar algo distinto de lo que se procesa sería
  // firmar nada.
  const body = request.method === 'GET' ? '' : await request.text();
  const auth = verifyNitroBotRequest(request, body);
  if (!auth.ok) {
    console.warn('[nitro-bot] petición rechazada:', auth.reason);
    return { ok: false, response: denied() };
  }

  const service = createServiceClient();
  if (!service) {
    console.error('❌ CRITICAL: falta SUPABASE_SECRET_KEY; la API interna no puede leer.');
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 }),
    };
  }

  return { ok: true, context: { service, requestId: auth.requestId } };
}

export function nitroBotJson(requestId: string, payload: Record<string, unknown>) {
  return NextResponse.json(
    { ok: true, contractVersion: NITRO_BOT_CONTRACT_VERSION, requestId, ...payload },
    { headers: { 'x-request-id': requestId, 'cache-control': 'no-store' } },
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
