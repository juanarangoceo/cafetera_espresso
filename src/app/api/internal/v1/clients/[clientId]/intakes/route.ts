import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';
import {
  EMPTY_INTAKE_ANSWERS,
  generateIntakeToken,
  hashIntakeToken,
  intakePrefillSchema,
  mergeIntakePrefill,
  intakeAnswersSchema,
} from '@/lib/intake';

/**
 * El brief de una landing nueva, pedido desde Nitro Bot.
 *
 * El formulario en sí **no se duplica**: vive donde siempre, en
 * `/intake/{token}`, que es una página pública con token y no un panel. Lo que
 * hace Nitro Bot es emitir el enlace y enseñar en qué va. Duplicar el wizard
 * —16 campos obligatorios, borrador automático y subida de archivos a un
 * bucket— significaría mantener dos formularios que tienen que coincidir, y el
 * día que dejen de coincidir nadie se entera hasta que un cliente lo llena mal.
 *
 * Del token solo se guarda el `sha256`. Se devuelve en claro una vez, igual que
 * las llaves de sitio: quien lo pierda emite otro.
 */
export const dynamic = 'force-dynamic';

const newIntakeSchema = z.object({
  provisionalName: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/, 'El identificador va en minúsculas, sin espacios.'),
  createdBy: z.string().trim().email().max(320),
  // Opcional a propósito: un Nitro Bot anterior a esta versión sigue pidiendo
  // briefs en blanco y este endpoint sigue emitiéndolos. La ausencia de
  // prellenado no es un error, es el caso «empezar de cero».
  prefill: intakePrefillSchema.optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId } = guard.context;

  const clientId = (await context.params).clientId;
  if (!isUuid(clientId)) {
    return NextResponse.json({ ok: false, error: 'bad_client_id' }, { status: 400 });
  }

  const { data } = await service
    .from('intake_requests')
    .select('id, provisional_name, slug, status, site_id, created_at, submitted_at, expires_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20);

  return nitroBotJson(requestId, {
    // El token NO viaja aquí: solo se entrega al emitirlo. Un listado que lo
    // devolviera convertiría cualquier lectura en una copia del enlace.
    intakes: (data ?? []).map((row) => ({
      id: row.id,
      provisionalName: row.provisional_name,
      slug: row.slug,
      status: row.status,
      converted: Boolean(row.site_id),
      createdAt: row.created_at,
      submittedAt: row.submitted_at,
      expiresAt: row.expires_at,
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId, body } = guard.context;

  const clientId = (await context.params).clientId;
  if (!isUuid(clientId)) {
    return NextResponse.json({ ok: false, error: 'bad_client_id' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const parsed = newIntakeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  const { data: client } = await service
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  // Un identificador que ya es de un sitio no puede volver a pedirse: el brief
  // acabaría creando un duplicado del que ya existe.
  const { data: existingSite } = await service
    .from('sites')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();
  if (existingSite) {
    return NextResponse.json({ ok: false, error: 'slug_taken' }, { status: 409 });
  }

  // Pedir dos veces lo mismo es lo normal cuando alguien cierra la pestaña. En
  // vez de rechazarlo —y dejar al cliente sin enlace, porque del token solo
  // guardamos el hash— se REEMITE el de la solicitud abierta. Es la misma
  // solicitud, con un enlace nuevo; no se crea un brief a medias más.
  const { data: open } = await service
    .from('intake_requests')
    .select('id, expires_at, answers, prefill')
    .eq('client_id', clientId)
    .eq('slug', parsed.data.slug)
    .eq('status', 'draft')
    .is('site_id', null)
    .maybeSingle();

  if (open) {
    const reissued = generateIntakeToken();
    // El prellenado de una reemisión solo RELLENA HUECOS. Quien vuelve a pedir
    // el enlace suele traer ya medio brief escrito, y pisarlo con lo que sabe
    // el catálogo sería castigarlo por haber cerrado la pestaña.
    const merged = parsed.data.prefill
      ? mergeIntakePrefill(
          intakeAnswersSchema.parse(open.answers ?? {}),
          parsed.data.prefill.answers,
        )
      : null;
    const previousKeys = Array.isArray((open.prefill as { keys?: unknown } | null)?.keys)
      ? ((open.prefill as { keys?: string[] }).keys ?? [])
      : [];

    const { error: reissueError } = await service
      .from('intake_requests')
      .update({
        token_hash: hashIntakeToken(reissued),
        // El plazo vuelve a contar: si el anterior estaba por caducar, el
        // cliente no debería heredar tres días para llenar el brief.
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        ...(merged
          ? {
              answers: merged.answers,
              prefill: {
                source: parsed.data.prefill!.source,
                productRef: parsed.data.prefill!.productRef ?? null,
                keys: Array.from(new Set([...previousKeys, ...merged.keys])),
              },
            }
          : {}),
      })
      .eq('id', open.id);
    if (reissueError) {
      console.error('[nitro-bot] no se pudo reemitir el intake:', reissueError.message);
      return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
    }
    return nitroBotJson(requestId, {
      intake: {
        id: open.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        path: `/intake/${reissued}`,
        reissued: true,
        prefilledCount: merged?.keys.length ?? 0,
      },
    });
  }

  const token = generateIntakeToken();
  const prefilled = parsed.data.prefill
    ? mergeIntakePrefill(EMPTY_INTAKE_ANSWERS, parsed.data.prefill.answers)
    : null;

  const { data, error } = await service
    .from('intake_requests')
    .insert({
      site_id: null,
      client_id: clientId,
      provisional_name: parsed.data.provisionalName,
      slug: parsed.data.slug,
      token_hash: hashIntakeToken(token),
      created_by: parsed.data.createdBy.toLowerCase(),
      ...(prefilled && prefilled.keys.length
        ? {
            answers: prefilled.answers,
            prefill: {
              source: parsed.data.prefill!.source,
              productRef: parsed.data.prefill!.productRef ?? null,
              keys: prefilled.keys,
            },
          }
        : {}),
    })
    .select('id, expires_at')
    .single();

  if (error?.code === '23505') {
    return NextResponse.json({ ok: false, error: 'slug_taken' }, { status: 409 });
  }
  if (error || !data) {
    console.error('[nitro-bot] no se pudo crear el intake:', error?.message);
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
  }

  return nitroBotJson(requestId, {
    intake: {
      id: data.id,
      expiresAt: data.expires_at,
      path: `/intake/${token}`,
      reissued: false,
      prefilledCount: prefilled?.keys.length ?? 0,
    },
  });
}
