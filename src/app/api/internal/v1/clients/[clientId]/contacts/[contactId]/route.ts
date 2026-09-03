import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardNitroBotRequest, isUuid, nitroBotJson } from '@/lib/nitro-bot-api';

/**
 * El seguimiento comercial de un contacto, editado desde Nitro Bot.
 *
 * Es lo último que obligaba al equipo a entrar al panel de Nitro Landing: la
 * etapa, cuándo hay que volver a llamar y la nota de lo que se habló. Los
 * contactos ya se proyectaban en el CRM de Nitro Bot, pero el seguimiento se
 * trabajaba allá, y trabajar el mismo contacto en dos sitios es la forma segura
 * de que uno de los dos quede desactualizado.
 */
export const dynamic = 'force-dynamic';

/** El mismo vocabulario que el `check` de `contacts.stage`. */
const STAGES = ['nuevo', 'por_contactar', 'no_contesta', 'reagendar', 'cliente', 'perdido'] as const;

const patchSchema = z.object({
  stage: z.enum(STAGES).optional(),
  // `null` significa «quitar el recordatorio», que es distinto de no tocarlo.
  nextFollowUp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  note: z.string().trim().min(1).max(2000).optional(),
  authorEmail: z.string().trim().email().max(320),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ clientId: string; contactId: string }> },
) {
  const guard = await guardNitroBotRequest(request);
  if (!guard.ok) return guard.response;
  const { service, requestId, body } = guard.context;

  const { clientId, contactId } = await context.params;
  if (!isUuid(clientId) || !isUuid(contactId)) {
    return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', detail: parsed.error.issues[0]?.message ?? 'inválido' },
      { status: 422 },
    );
  }

  // El contacto tiene que colgar de una landing de ESTE cliente.
  const { data: contact } = await service
    .from('contacts')
    .select('id, site_id, sites!inner(client_id)')
    .eq('id', contactId)
    .maybeSingle();
  const owner = (contact as { sites?: { client_id?: string } } | null)?.sites?.client_id;
  if (!contact || owner !== clientId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.stage) patch.stage = parsed.data.stage;
  // `undefined` es «no lo toques»; `null` es «bórralo». Colapsarlos borraría el
  // recordatorio de cualquiera que solo quisiera cambiar la etapa.
  if (parsed.data.nextFollowUp !== undefined) patch.next_follow_up = parsed.data.nextFollowUp;

  if (Object.keys(patch).length > 0) {
    const { error } = await service.from('contacts').update(patch).eq('id', contactId);
    if (error) {
      console.error('[nitro-bot] no se pudo mover el contacto:', error.message);
      return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
    }
  }

  if (parsed.data.note) {
    const { error } = await service.from('contact_notes').insert({
      contact_id: contactId,
      body: parsed.data.note,
      author_email: parsed.data.authorEmail.toLowerCase(),
    });
    if (error) {
      console.error('[nitro-bot] no se pudo guardar la nota:', error.message);
      // La nota es lo que el agente acaba de escribir: perderla en silencio
      // sería peor que decir que no se guardó, aunque la etapa sí cambiara.
      return NextResponse.json({ ok: false, error: 'note_failed' }, { status: 500 });
    }
  }

  return nitroBotJson(requestId, { contactId });
}
