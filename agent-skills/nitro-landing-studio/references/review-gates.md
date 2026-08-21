# Gates de revisión

Una landing no está lista mientras falle uno de estos gates.

## 1. Verdad comercial

- Cada cifra y característica aparece en `CONTENT_EVIDENCE.md` con fuente.
- No quedan `PENDIENTE`, textos de ejemplo, marcas del starter ni lorem ipsum
  dentro de la interfaz.
- Precio, kit, envío, entrega, garantía, retracto, vendedor y soporte tienen una
  sola fuente de verdad.
- Consentimiento, privacidad y condiciones corresponden al mercado indicado.

## 2. Estrategia y conversión

- La oferta se entiende en el primer viewport.
- Hay una acción primaria reconocible y consistente.
- El orden de la página responde a objeciones concretas.
- La prueba está cerca de la afirmación, y el checkout explica el siguiente
  paso y exige confirmación.

## 3. Diseño

- La dirección documentada se reconoce sin leer el documento.
- La landing no parece una recoloración de Coffee Maker Pro.
- Tipografía, color, imagen, espaciado y movimiento forman un sistema.
- No hay secciones repetitivas, recursos rotos, saltos de layout ni contenido
  escondido detrás de overlays.

## 4. Responsive y accesibilidad

- Revisión real a 375, 768 y 1440 px.
- Navegación por teclado, focus visible, labels, alt y contraste comprobados.
- Diálogos y checkout gestionan foco y cierre.
- `prefers-reduced-motion` evita movimiento no esencial.

## 5. Rendimiento y código

- Sin errores de consola o hidratación.
- Imágenes con dimensiones/sizes adecuados y hero sin carga innecesaria.
- No se envían secretos ni dependencias de servidor al bundle.
- TypeScript y build pasan sin ignorar errores.

## 6. Nitro

- No existe Supabase en la landing.
- `NITRO_SITE_KEY` solo se lee en servidor.
- BotID se ejecuta antes de crear un pedido.
- Precio visible y producto configurado en Nitro coinciden.
- Landing desconectada no acepta pedidos.
- Formulario, chat y voz resumen y obtienen confirmación explícita.
- El portal del comprador apunta a `NEXT_PUBLIC_NITRO_PORTAL_URL`.

## 7. Publicación

- `npm run release:check` aprueba; no está en modo demo ni contiene datos ficticios.
- Preview autorizada y verificada en navegador normal.
- Pedido real atribuido al sitio correcto y oculto a otro cliente.
- Pedido de prueba cancelado o eliminado.
- Producción autorizada explícitamente en la conversación actual.
