# Coffee Maker Pro — contexto para Claude Code

**Las reglas de trabajo viven en [`AGENTS.md`](AGENTS.md). Léelo primero.**
Este archivo solo añade lo específico de Claude Code.

## Resumen en tres líneas

Landing de venta directa contraentrega en Colombia, **en producción** y con
pedidos reales. Un error en el checkout cuesta ventas o provoca despachos
físicos indebidos. Trabaja con ese supuesto.

## Documentación

| Archivo | Cuándo leerlo |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Siempre, antes de tocar nada. |
| [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) | Estado actual, decisiones y pendientes. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Antes de modificar cualquier flujo. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Pedidos, auth, RLS o endpoints. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Desplegar o cambiar variables. |
| [`docs/SUPABASE_LOCAL.md`](docs/SUPABASE_LOCAL.md) | Datos, migraciones o autenticación. |
| [`docs/marco-voice-agent.md`](docs/marco-voice-agent.md) | Voz, OpenAI o pedidos conversacionales. |
| [`docs/ADMIN_DASHBOARD.md`](docs/ADMIN_DASHBOARD.md) | Panel `/admin`, acceso, estados de pedido o canales. |
| [`docs/PLATFORM.md`](docs/PLATFORM.md) | Separación entre clientes, llaves de ingesta, precio por sitio. |
| [`docs/LANDING_FACTORY.md`](docs/LANDING_FACTORY.md) | Crear o adaptar landings independientes. |

## Notas de herramientas

- **Vercel CLI ≥ 58.5.1.** Las versiones anteriores no escriben variables de Preview sin prompts.
- **`supabase link` no funciona en modo agente**: pide contraseña por prompt interactivo. Aplica migraciones remotas por la API de Supabase y alinea el historial después. Procedimiento en `docs/DEPLOYMENT.md`.
- **`vercel env pull` no devuelve secretos marcados como *Sensitive*** — retorna `[SENSITIVE`. `SUPABASE_SECRET_KEY` es uno de ellos.
- **Cuidado con `pkill -f "next dev"`**: el patrón coincide con el propio comando y mata la sesión. Usa el ID de tarea en segundo plano.

## Recordatorios que este proyecto ya cobró caro

- Verifica en local **antes** de aplicar migraciones a producción. Revocar permisos sin otorgar el equivalente a `service_role` deja el checkout sin camino de escritura, y falla en silencio.
- No leas ni imprimas secretos de `.env*`. Si el usuario pega uno en la conversación, dile que lo rote.
- No inventes cifras ni características. Si no está en `src/lib/product.ts`, no existe.
- **Ninguna landing de cliente lleva `SUPABASE_SECRET_KEY`.** Esa clave se salta el
  RLS de todos los inquilinos: en el proyecto de un cliente, su filtración es la de
  todos. Las landings hablan con `/api/v1/orders` usando su `NITRO_SITE_KEY`.
- Cambios amplios: `npx tsc --noEmit` **y** `npm run build`. Cambios de base: además `npm run supabase:test` y `npm run supabase:verify`.
