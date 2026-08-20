# Supabase local

**Última actualización: 4 de agosto de 2026.**

El desarrollo ocurre siempre contra una instancia local. El proyecto remoto de
producción (`rsqcumtozynvzsctvmpk`) **no se toca desde el entorno de desarrollo**.

## Requisitos

- Node.js 22 o superior
- Docker en ejecución
- `npm install`

## Primera ejecución

```bash
npm run supabase:start
npm run supabase:status
npm run dev
```

La configuración local levanta solo Database, Auth y Data API, que son los
servicios que usa la aplicación. Realtime, Storage, Edge Runtime, Analytics y
Studio quedan desactivados para reducir consumo.

`.env.local` debe usar exclusivamente la URL y la publishable key que muestra
`npm run supabase:status`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key local>
```

Nunca copies una secret key ni una `service_role` a una variable `NEXT_PUBLIC_*`.

El repositorio incluye `.env.development.local` y `.env.production.local`
ignorados por Git con estas credenciales locales, para que tanto `npm run dev`
como un build ejecutado en esta máquina apunten a Supabase local y no al
proyecto remoto.

## Flujo diario

```bash
npm run supabase:start
npm run dev
npm run supabase:stop
```

Para reconstruir desde cero y comprobar que el repositorio es reproducible:

```bash
npm run supabase:reset
npm run supabase:test
npm run supabase:verify
npm run supabase:types
```

`supabase:reset` actúa explícitamente sobre la base local. **No uses `--linked`.**

## Estructura versionada

- `supabase/config.toml` — puertos y comportamiento de Auth local
- `supabase/migrations/` — esquema, funciones, permisos y RLS en orden
- `supabase/seed.sql` — datos ficticios, solo desarrollo
- `supabase/tests/database.test.sql` — 20 pruebas pgTAP
- `scripts/verify-local-supabase.mjs` — verificación de permisos reales
- `src/database.generated.ts` — tipos generados. No editar a mano.

## Migraciones

| Versión | Qué hace |
|---|---|
| `20260803194208` | Esquema inicial: cuatro tablas, RLS, grants y restricciones |
| `20260804203000` | Trigger que limita pedidos por correo o celular |
| `20260804205500` | Revoca la escritura anónima de pedidos |

Crear una nueva:

```bash
npx supabase migration new nombre_descriptivo
# editar el SQL generado
npm run supabase:reset
npm run supabase:test
npm run supabase:verify
npm run supabase:types
```

Todo cambio permanente debe quedar en una migración. No edites la base remota
desde el Dashboard si el cambio debe conservarse.

## Qué comprueban las pruebas

`supabase:test` (pgTAP, 20 pruebas): existencia de tablas y llaves primarias,
RLS habilitado, políticas exactas por tabla, restricción de precio inalterable,
y el límite antiabuso — tres pedidos con los mismos datos pasan, el cuarto se
rechaza.

`supabase:verify` (contra la Data API real, con claves anónima y de servidor):

- Un visitante anónimo **no** puede crear pedidos
- Un visitante anónimo **no** puede leer pedidos
- El servidor sí puede escribir
- La restricción de precio rechaza valores manipulados
- Un usuario autenticado lee únicamente los pedidos de su propio correo

La clave de servidor se lee del estado de la instancia local, no de archivos de
entorno.

## Promoción a producción

`supabase link` pide la contraseña de la base por prompt interactivo, lo que
impide usarlo en modo agente. El procedimiento vigente —aplicar por API y
alinear el historial de migraciones— está en [`DEPLOYMENT.md`](DEPLOYMENT.md).

Los seeds de desarrollo **nunca** se ejecutan contra producción.

Este repositorio no se enlaza a `nitro_bot`, `Vision_Estate` ni `nitro_web`.
