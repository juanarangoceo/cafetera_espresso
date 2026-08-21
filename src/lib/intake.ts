import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const INTAKE_BUCKET = 'nitro-intake';
export const MAX_INTAKE_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_INTAKE_TOTAL_BYTES = 300 * 1024 * 1024;
export const MAX_INTAKE_FILES = 60;

export const INTAKE_CATEGORIES = {
  marca: '01_marca',
  producto: '02_producto',
  fotos_videos: '03_fotos_videos',
  oferta: '04_oferta',
  legal: '05_legal',
} as const;

export type IntakeCategory = keyof typeof INTAKE_CATEGORIES;

const shortText = z.string().trim().max(240).default('');
const longText = z.string().trim().max(4000).default('');
const email = z.string().trim().max(240).default('').refine(
  (value) => !value || z.string().email().safeParse(value).success,
  'Escribe un correo válido.',
);

export const intakeAnswersSchema = z.object({
  businessName: shortText,
  legalSeller: shortText,
  sellerId: shortText,
  contactName: shortText,
  supportEmail: email,
  supportPhone: shortText,
  market: shortText,
  productName: shortText,
  buyer: longText,
  problem: longText,
  difference: longText,
  features: longText,
  objections: longText,
  price: shortText,
  currency: shortText,
  includes: longText,
  shipping: longText,
  delivery: shortText,
  payment: longText,
  warranty: longText,
  returns: longText,
  personality: longText,
  colors: longText,
  references: longText,
  avoid: longText,
  testimonials: longText,
  evidence: longText,
  prohibited: longText,
  notes: longText,
  consent: z.boolean().default(false),
});

export type IntakeAnswers = z.infer<typeof intakeAnswersSchema>;

export const EMPTY_INTAKE_ANSWERS: IntakeAnswers = intakeAnswersSchema.parse({});

export const intakeDraftSchema = intakeAnswersSchema.partial();

export const intakeSubmissionSchema = intakeAnswersSchema.superRefine((value, context) => {
  const required: Array<[keyof IntakeAnswers, string]> = [
    ['businessName', 'Completa el nombre comercial.'],
    ['legalSeller', 'Completa el nombre legal del vendedor.'],
    ['sellerId', 'Completa la identificación del vendedor.'],
    ['supportEmail', 'Completa el correo de soporte.'],
    ['market', 'Indica dónde se venderá el producto.'],
    ['productName', 'Completa el nombre del producto.'],
    ['buyer', 'Cuéntanos quién compra el producto.'],
    ['problem', 'Cuéntanos qué problema resuelve.'],
    ['price', 'Completa el precio exacto.'],
    ['currency', 'Completa la moneda.'],
    ['includes', 'Indica qué incluye la compra.'],
    ['shipping', 'Completa las condiciones de envío.'],
    ['delivery', 'Completa el tiempo de entrega.'],
    ['payment', 'Completa las formas de pago.'],
    ['warranty', 'Completa la garantía.'],
    ['returns', 'Completa la política de cambios, devoluciones o retracto.'],
  ];

  for (const [field, message] of required) {
    if (!String(value[field] ?? '').trim()) {
      context.addIssue({ code: 'custom', path: [field], message });
    }
  }

  if (!value.consent) {
    context.addIssue({
      code: 'custom',
      path: ['consent'],
      message: 'Debes confirmar la veracidad y autorización del material.',
    });
  }
});

export const allowedIntakeMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
]);

export function generateIntakeToken() {
  return randomBytes(32).toString('base64url');
}

export function hashIntakeToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function safeFileName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 180);
  return cleaned || 'archivo';
}

function valueOrPending(value: string) {
  return value.trim() || 'PENDIENTE';
}

export function buildBriefMarkdown(answers: IntakeAnswers) {
  return `# Brief del cliente

Generado por Nitro Intake a partir de información confirmada por el cliente.
Lo que no fue respondido permanece como **PENDIENTE**; no debe inventarse.

## Negocio y contacto

- Nombre comercial: ${valueOrPending(answers.businessName)}
- Nombre legal del vendedor: ${valueOrPending(answers.legalSeller)}
- Identificación del vendedor: ${valueOrPending(answers.sellerId)}
- Persona de contacto: ${valueOrPending(answers.contactName)}
- Correo de soporte: ${valueOrPending(answers.supportEmail)}
- Teléfono de soporte: ${valueOrPending(answers.supportPhone)}
- Mercado o países de venta: ${valueOrPending(answers.market)}

## Producto y comprador

- Nombre del producto: ${valueOrPending(answers.productName)}
- Quién lo compra y en qué situación: ${valueOrPending(answers.buyer)}
- Problema principal que resuelve: ${valueOrPending(answers.problem)}
- Diferencia real frente a alternativas: ${valueOrPending(answers.difference)}
- Características confirmadas: ${valueOrPending(answers.features)}
- Objeciones frecuentes: ${valueOrPending(answers.objections)}

## Oferta

- Precio: ${valueOrPending(answers.price)}
- Moneda: ${valueOrPending(answers.currency)}
- Qué incluye: ${valueOrPending(answers.includes)}
- Costo y cobertura del envío: ${valueOrPending(answers.shipping)}
- Tiempo de entrega: ${valueOrPending(answers.delivery)}
- Forma de pago: ${valueOrPending(answers.payment)}
- Garantía: ${valueOrPending(answers.warranty)}
- Retracto, cambios o devoluciones: ${valueOrPending(answers.returns)}

## Marca y diseño

- Personalidad de marca: ${valueOrPending(answers.personality)}
- Colores o tipografías existentes: ${valueOrPending(answers.colors)}
- Sitios o estilos de referencia y razones: ${valueOrPending(answers.references)}
- Estilos que deben evitarse: ${valueOrPending(answers.avoid)}

## Evidencia

- Testimonios autorizados y origen: ${valueOrPending(answers.testimonials)}
- Demostraciones, pruebas o certificaciones: ${valueOrPending(answers.evidence)}
- Afirmaciones que no se deben hacer: ${valueOrPending(answers.prohibited)}

## Observaciones

${valueOrPending(answers.notes)}
`;
}
