export const PRODUCT = {
  name: "Coffee Maker Pro",
  kitName: "Kit Coffee Maker Pro",
  price: 490_000,
  priceLabel: "$490.000",
  currency: "COP",
  shipping: "Envío gratis en Colombia",
  paymentMethod: "Pago contraentrega",
  warranty: "3 meses de garantía por funcionamiento",
  supportEmail: "coffeemakerpro@gmail.com",
  includes: [
    "Coffee Maker Pro y accesorios",
    "Molino eléctrico incluido",
    "Guía digital de preparación",
  ],
  capabilities: [
    "Preparar uno o dos espressos",
    "Texturizar leche con vapor",
  ],
  specifications: {
    power: "850 W",
    servings: "1 o 2 tazas",
    system: "Espresso + vapor",
  },
  boxContents: [
    "Cafetera Coffee Maker Pro",
    "Portafiltro",
    "Filtro sencillo",
    "Filtro doble",
    "Cuchara medidora con compactador",
    "Manual de uso",
    "Molino eléctrico",
    "Guía digital de preparación",
  ],
  deliveryEstimate: "2 a 5 días hábiles, según la ciudad y la transportadora",
  withdrawalRight:
    "Derecho de retracto dentro de los 5 días hábiles siguientes a la entrega, conforme al Estatuto del Consumidor",
  merchant: {
    legalName: "Juan David Arango",
    idLabel: "C.C. 1.088.018.943",
    taxRegime: "Régimen simplificado",
    location: "Bogotá D.C., Colombia",
  },
} as const;

export const PRODUCT_FACTS = `
- Producto: ${PRODUCT.name}.
- Capacidades: ${PRODUCT.capabilities.join("; ")}.
- Especificaciones: ${PRODUCT.specifications.power}; ${PRODUCT.specifications.servings}; sistema ${PRODUCT.specifications.system}.
- El kit incluye: ${PRODUCT.includes.join("; ")}.
- Contenido exacto de la caja: ${PRODUCT.boxContents.join("; ")}.
- Precio final: ${PRODUCT.priceLabel} pesos colombianos.
- Entrega y pago: ${PRODUCT.shipping}; ${PRODUCT.paymentMethod}.
- Tiempo de entrega: ${PRODUCT.deliveryEstimate}.
- Garantía: ${PRODUCT.warranty}. Cubre fallas de funcionamiento, no arrepentimiento.
- Retracto: ${PRODUCT.withdrawalRight}. El proceso se gestiona escribiendo a ${PRODUCT.supportEmail}.
- Soporte: ${PRODUCT.supportEmail}.
`.trim();
