---
name: nitro-landing-studio
description: "Construye o rediseña landings de venta profesionales a partir del material real de un cliente, con dirección visual propia, copy basado en evidencia, revisión responsive y preparación segura para Nitro. Úsalo al crear una landing nueva, convertir una carpeta de producto en una página o elevar una landing existente; no lo uses para cambios aislados del panel de plataforma."
---

# Nitro Landing Studio

El resultado debe sentirse diseñado para este producto, no rellenado dentro de
una plantilla. Coffee Maker Pro es referencia de rigor, narrativa y acabado;
nunca es referencia visual obligatoria.

## Antes de diseñar

1. Lee `docs/PROJECT_CONTEXT.md`, consulta el registro central indicado allí y
   después lee `docs/CLIENT_BRIEF.md`, `docs/SOURCE_INVENTORY.md` y todo `_intake/`.
2. Clasifica cada afirmación como confirmada, pendiente o prohibida. No
   conviertas una inferencia en un hecho comercial.
3. Completa `docs/CONTENT_EVIDENCE.md` y `docs/CREATIVE_DIRECTION.md` antes de
   producir la interfaz. Si faltan datos que cambian la oferta, trabaja lo que
   sí está confirmado y deja bloqueos visibles en esos documentos.
4. Lee [references/creative-standard.md](references/creative-standard.md) para
   decidir narrativa, dirección visual y criterios de calidad.
5. Si tocas pedidos, leads, chat, voz, BotID o portal, lee
   `docs/NITRO_INTEGRATION.md` completo.
6. Si el contexto indica modo `demo`, lee
   [references/demo-mode.md](references/demo-mode.md). Nunca conviertas una
   oferta simulada en publicable cambiando solo una bandera.

## Construcción

- Define primero la promesa, la audiencia, el mecanismo del producto, las
  objeciones y la prueba disponible. De ahí sale el orden de secciones; no uses
  una secuencia fija por costumbre.
- Elige una dirección visual explícita y registra al menos tres decisiones que
  la distingan de Coffee Maker Pro y de una landing genérica.
- Usa los recursos reales del cliente como materia prima. Puedes corregir,
  recortar u optimizar imágenes; no fabriques apariencia del producto,
  resultados, sellos, testimonios o personas que parezcan clientes reales.
- Mantén una sola fuente de verdad para precio, contenido del kit, entrega,
  garantía, retracto, vendedor y soporte.
- Diseña móvil y escritorio como composiciones intencionales. Comprueba 375,
  768 y 1440 px; no consideres móvil como el desktop apilado.
- Integra el núcleo Nitro detrás de la experiencia visual. Los componentes de
  checkout pueden rediseñarse; el contrato, consentimiento y confirmación no.
- Trabaja en local y comparte avances verificables. No crees repositorios,
  proyectos, dominios, llaves ni deployments sin autorización explícita.
- Actualiza el registro central cuando cambien estado, próxima acción, puerto,
  URL o bloqueos. El registro es la memoria operativa entre sesiones.

## Revisión obligatoria

Antes de entregar, lee [references/review-gates.md](references/review-gates.md)
y corrige los hallazgos. Después ejecuta:

Durante el diseño ejecuta `npm run landing:check`. Antes de cualquier publicación
ejecuta `npm run release:check`; este último debe bloquear demos, datos ficticios
y preparación comercial incompleta. Un bloqueo en modo demo es el resultado
correcto, no algo que deba evadirse.

Si se levantó un servidor local, revísalo en navegador en los tres anchos,
comprueba errores de consola y recorre CTA → resumen → consentimiento → envío.
Un build correcto no sustituye la revisión visual.

La entrega informa dirección elegida, evidencia usada, archivos construidos,
datos pendientes, estado registrado y resultado de cada gate. Una URL de producción solo aparece
cuando el dueño haya autorizado el despliegue y se haya cumplido el protocolo
de Preview y pedido de prueba.
