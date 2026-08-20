# Coffee Maker Pro — instrucciones para agentes

Punto de entrada para Codex, Claude Code y cualquier agente que trabaje en este
repositorio. `CLAUDE.md` apunta aquí.

**Última actualización: 20 de agosto de 2026.**

## Qué es esto

Landing de venta directa contraentrega en Colombia, **en producción**, con
pedidos reales. No es un proyecto de laboratorio: un cambio equivocado en el
checkout se traduce en ventas perdidas o en despachos físicos indebidos.

- Producción: `https://coffee-maker-pro.vercel.app`
- Estado completo: `docs/PROJECT_HANDOFF.md`

## Antes de tocar código

Lee, en este orden y según la tarea:

| Documento | Cuándo |
|---|---|
| `docs/PROJECT_HANDOFF.md` | Siempre. Estado actual y decisiones vigentes. |
| `docs/ARCHITECTURE.md` | Antes de modificar cualquier flujo. |
| `docs/SECURITY.md` | Si tocas pedidos, autenticación, RLS o endpoints. |
| `docs/DEPLOYMENT.md` | Si vas a desplegar o cambiar variables. |
| `docs/SUPABASE_LOCAL.md` | Si tocas datos, migraciones o autenticación. |
| `docs/marco-voice-agent.md` | Si tocas voz, OpenAI o pedidos conversacionales. |
| `docs/ADMIN_DASHBOARD.md` | Si tocas el panel `/admin`, el acceso, los estados de pedido o los canales. |
| `docs/PLATFORM.md` | Si tocas la separación entre clientes, las llaves de ingesta o el precio por sitio. |
| `docs/LANDING_FACTORY.md` | Si creas o adaptas una landing independiente para un cliente. |

## Reglas duras

**Producción**

1. No despliegues a producción sin autorización explícita en la conversación actual.
2. Toda promoción a producción pasa primero por Preview y por una prueba de pedido real.
3. No publiques reglas de firewall (`vercel firewall publish`); esa decisión es del dueño.

**Secretos**

4. No leas, imprimas ni copies valores de archivos `.env*`. Solo comprueba presencia de forma redactada (`grep -c '^VAR=' archivo`).
5. Nunca pongas un secreto en una variable con prefijo `NEXT_PUBLIC_`. Ese prefijo publica el valor en el bundle del navegador.
6. `SUPABASE_SECRET_KEY` se salta todas las políticas RLS. Solo servidor.
7. Si un secreto aparece en la conversación, indícale al usuario que lo rote antes de seguir.

**Base de datos**

8. Todo cambio persistente entra por `supabase/migrations/` y se acompaña de pruebas en `supabase/tests/`.
9. Prueba siempre en local antes de aplicar a producción: `npm run supabase:reset && npm run supabase:test && npm run supabase:verify`.
10. `supabase link` pide contraseña por prompt interactivo y no funciona en modo agente. Aplica migraciones remotas por la API de Supabase y luego alinea `supabase_migrations.schema_migrations` con el nombre del archivo local.
11. No enlaces este repositorio a `nitro_bot`, `Vision_Estate` ni `nitro_web`.

**Contenido comercial**

12. `src/lib/product.ts` es la fuente única de precio, garantía, kit, entrega, retracto e identificación del vendedor. No dupliques esos datos en componentes.
13. Si cambia el precio de Coffee Maker, actualiza `product.ts` y
    `site_products` mediante una migración con prueba. La base hace cumplir el
    precio activo del sitio mediante `private.enforce_order_price()`.
14. No inventes cifras, estadísticas ni características. Si un dato no está en `product.ts`, no existe.

**Repositorio**

15. El worktree tiene muchos cambios legítimos sin commit. No reviertas ni formatees archivos fuera del alcance de tu tarea.
16. No crees ni enlaces recursos externos de pago sin autorización explícita.

## Verificación obligatoria antes de entregar

```bash
npx tsc --noEmit          # siempre
npm run build             # cambios amplios
npm run supabase:test     # cambios de base de datos
npm run supabase:verify   # cambios de base de datos
```

## Comandos

```bash
npm install
npm run supabase:start    # requiere Docker
npm run dev               # http://localhost:3000
npm run supabase:reset    # recrea la base local desde migraciones
npm run supabase:types    # regenera src/database.generated.ts
npm run supabase:stop

npm run admin:create -- correo@ejemplo.com 'Contraseña' 'Nombre'   # administrador de plataforma
npm run admin:create -- --site <slug> correo@ejemplo.com 'Clave'   # usuario de un cliente
npm run site:key -- emitir <slug> 'Etiqueta'                       # llave de ingesta de una landing
npm run access:link -- cliente@ejemplo.com    # enlace del portal, sin correo
npm run demo:seed         # datos de demostración para capturas. Solo local.
```

**`supabase db reset` no recarga `supabase/config.toml`.** Cualquier cambio de
autenticación exige `supabase stop && supabase start`, o parecerá que la
comprobación falla sin motivo.

## Contexto legal

Venta a distancia en Colombia. Aplican la Ley 1480 de 2011 (Estatuto del
Consumidor: retracto de 5 días hábiles, identificación del vendedor) y la
Ley 1581 de 2012 (habeas data: autorización, finalidades, derechos del titular).

El checkout exige casilla de consentimiento. No la elimines ni la marques por
defecto. Ante dudas de redacción legal, señálalo al usuario en vez de improvisar.
