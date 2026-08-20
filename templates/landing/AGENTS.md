<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Landing de cliente de Nitro — instrucciones para agentes

Este repositorio es una landing independiente conectada a Nitro Landing. Puede
haber partido de esta plantilla o de un diseño externo. El diseño actual es
autoritativo: no lo reemplaces por la interfaz de Coffee Maker Pro ni por otra
plantilla salvo solicitud explícita.

## Antes de tocar código

1. Lee `docs/CLIENT_BRIEF.md` completo.
2. Lee `docs/NITRO_INTEGRATION.md` completo si tocas formularios, pedidos,
   leads, BotID, variables, configuración remota o despliegue.
3. Lee `src/lib/product.ts` y localiza cualquier otra fuente comercial antes de
   editar textos o precios.
4. Si un dato del brief está como `PENDIENTE`, pregúntalo o repórtalo; no lo
   inventes.

## Reglas duras

- Nunca instales Supabase ni añadas claves de Supabase. Esta landing solo habla
  con Nitro mediante `NITRO_API_URL` y `NITRO_SITE_KEY` desde servidor.
- Nunca uses `NEXT_PUBLIC_NITRO_SITE_KEY`; expondría la llave en el navegador.
- Todo pedido nace en una Server Action protegida por BotID y termina en
  `/api/v1/orders`. No insertes datos por otra vía.
- Formulario, chat y voz deben mostrar el resumen y exigir confirmación explícita
  antes de crear un pedido.
- El consentimiento para tratamiento de datos es obligatorio, visible y nunca
  viene marcado por defecto.
- Precio, entrega, garantía, retracto y vendedor tienen una sola fuente de
  verdad. No dupliques esos datos en componentes.
- No inventes testimonios, cifras, características, urgencia ni escasez.
- No despliegues a producción sin autorización explícita en la conversación.
- Producción siempre pasa por Preview, pedido real, comprobación en el panel y
  cancelación o limpieza del pedido de prueba.
- No leas ni imprimas valores de `.env*`; comprueba únicamente la presencia de
  nombres de variables.

## Archivos que normalmente se adaptan

- `src/lib/product.ts`: oferta y hechos comerciales.
- `src/lib/data.ts`: contenido editorial y políticas.
- `src/lib/marco-voice-prompt.ts` y `src/app/actions/chat.ts`: identidad y venta
  conversacional.
- `src/app/layout.tsx`, `robots.ts`, `sitemap.ts`: dominio y metadatos.
- `public/`: recursos definitivos del cliente.
- Componentes visuales: solo según el diseño entregado.

La lista no garantiza que no queden referencias base. Ejecuta siempre:

```bash
npm run nitro:check
npx tsc --noEmit
npm run build
```

## Entrega

Informa qué quedó adaptado, qué datos siguen pendientes, resultados de pruebas,
URL de Preview y acciones manuales. Si la integración afecta pedidos, no la des
por terminada sin un pedido real atribuido al cliente correcto.
