<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Coffee Maker Pro

Landing de venta directa contraentrega en Colombia. Kit de cafetera espresso con
molino y guía digital, con checkout propio, asistente de voz y chat escrito.

**En producción:** `https://coffee-maker-pro.vercel.app`

## Ejecución local

Requisitos: Node.js 22+ y Docker.

```bash
npm install
npm run supabase:start
npm run dev
```

- Aplicación: `http://localhost:3000`
- Supabase local API: `http://127.0.0.1:54321`

Copia `.env.example` a `.env.local` y complétalo. `OPENAI_API_KEY`,
`GEMINI_API_KEY` y `RESEND_API_KEY` son opcionales en local: sin ellas la
landing y el checkout funcionan, pero voz, chat y correos quedan inactivos.

Ninguna clave secreta debe llevar el prefijo `NEXT_PUBLIC_` — ese prefijo
publica el valor en el bundle del navegador.

## Comandos

```bash
npm run dev               # servidor de desarrollo
npm run build             # build de producción, valida tipos
npm run supabase:start    # levanta Supabase local (Docker)
npm run supabase:reset    # recrea la base desde las migraciones
npm run supabase:test     # pruebas pgTAP de esquema, RLS y restricciones
npm run supabase:verify   # verificación de permisos contra la base local
npm run supabase:types    # regenera src/database.generated.ts
npm run email             # previsualiza plantillas de correo
npm run landing:prepare -- --target /ruta/al/repo  # prepara un diseño externo para Nitro
```

## Documentación

| Documento | Contenido |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Reglas para agentes (Codex, Claude Code). Punto de entrada. |
| [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) | Estado actual, decisiones tomadas y pendientes. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, mapa de archivos y flujo de pedido. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Capas antiabuso, RLS y manejo de claves. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Infraestructura, variables y procedimiento de despliegue. |
| [`docs/SUPABASE_LOCAL.md`](docs/SUPABASE_LOCAL.md) | Entorno local de base de datos. |
| [`docs/marco-voice-agent.md`](docs/marco-voice-agent.md) | Asistente de voz. |
| [`docs/ADMIN_DASHBOARD.md`](docs/ADMIN_DASHBOARD.md) | Panel operativo y acceso. |
| [`docs/PLATFORM.md`](docs/PLATFORM.md) | Arquitectura multi-tenant. |
| [`docs/LANDING_FACTORY.md`](docs/LANDING_FACTORY.md) | Flujo para landings nuevas o diseños externos. |

## Tres cosas que conviene saber de entrada

**`src/lib/product.ts` es la fuente única** de precio, kit, garantía, entrega,
retracto e identificación del vendedor. Landing, asistentes, checkout, FAQ,
correos y políticas consumen de ahí. No dupliques esos datos.

**Los pedidos solo se crean desde el servidor.** La landing propia escribe a
través de la plataforma; una landing externa reenvía a `/api/v1/orders` con su
`NITRO_SITE_KEY`. Solo la plataforma conoce `SUPABASE_SECRET_KEY`. El rol
anónimo no escribe pedidos.

**Una landing por cliente.** Si el diseño ya existe, prepáralo con
`npm run landing:prepare -- --target <ruta>`; no reemplaces su UI con la
plantilla. Ver [`docs/LANDING_FACTORY.md`](docs/LANDING_FACTORY.md).
