/**
 * Etapas de un contacto. Replican la restricción `check` de `contacts.stage`:
 * si cambia una, la otra cambia por migración.
 */
export const CONTACT_STAGES = [
  'nuevo',
  'por_contactar',
  'no_contesta',
  'reagendar',
  'cliente',
  'perdido',
] as const;

export type ContactStage = (typeof CONTACT_STAGES)[number];

export const CONTACT_STAGE_META: Record<
  ContactStage,
  { label: string; hint: string; badge: string; dot: string }
> = {
  nuevo: {
    label: 'Nuevo',
    hint: 'Llegó y nadie lo ha tocado todavía.',
    badge: 'bg-ink-700/40 text-ink-200 border-ink-600',
    dot: 'bg-ink-400',
  },
  por_contactar: {
    label: 'Por contactar',
    hint: 'Hay que escribirle o llamarlo.',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  no_contesta: {
    label: 'No contesta',
    hint: 'Se intentó y no hubo respuesta.',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dot: 'bg-orange-500',
  },
  reagendar: {
    label: 'Reagendar',
    hint: 'Pidió que lo busquen después.',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-500',
  },
  cliente: {
    label: 'Cliente',
    hint: 'Ya tiene al menos un pedido.',
    badge: 'bg-nitro-500/15 text-nitro-300 border-nitro-500/30',
    dot: 'bg-nitro-500',
  },
  perdido: {
    label: 'Perdido',
    hint: 'No sigue la conversación.',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
  },
};

export const CONTACT_SOURCES = ['pedido', 'lead', 'whatsapp', 'manual'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_SOURCE_LABEL: Record<ContactSource, string> = {
  pedido: 'Pedido',
  lead: 'Guía descargada',
  whatsapp: 'WhatsApp',
  manual: 'Alta manual',
};

export function isContactStage(value: unknown): value is ContactStage {
  return typeof value === 'string' && (CONTACT_STAGES as readonly string[]).includes(value);
}

export function isContactSource(value: unknown): value is ContactSource {
  return typeof value === 'string' && (CONTACT_SOURCES as readonly string[]).includes(value);
}

/** Fecha corta para la bandeja de pendientes. */
export function formatFollowUp(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayInBogota() {
  // La operación es colombiana: usar la fecha del servidor haría que los
  // pendientes cambiaran de día a las 7 de la tarde.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
