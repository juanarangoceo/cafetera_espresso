/**
 * Fuente única de verdad comercial. Sustituye todos los PENDIENTE únicamente
 * con información confirmada en docs/CONTENT_EVIDENCE.md.
 */
export const PRODUCT = {
  mode: 'real' as 'real' | 'demo',
  commercialReady: false,
  brand: 'PENDIENTE',
  name: 'PENDIENTE',
  shortPromise: 'PENDIENTE',
  price: 0,
  currency: 'COP',
  includes: ['PENDIENTE'],
  shipping: 'PENDIENTE',
  delivery: 'PENDIENTE',
  warranty: 'PENDIENTE',
  returns: 'PENDIENTE',
  seller: {
    legalName: 'PENDIENTE',
    identification: 'PENDIENTE',
    supportEmail: 'PENDIENTE',
  },
} as const;

export function formatPrice(value = PRODUCT.price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: PRODUCT.currency,
    maximumFractionDigits: 0,
  }).format(value);
}
