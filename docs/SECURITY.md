# Seguridad y protección antiabuso

**Última actualización: 20 de agosto de 2026.**

## El riesgo particular de este negocio

La venta es **contraentrega**: un pedido no requiere pago para generarse. Un
pedido falso no es una fila basura en una tabla, es un despacho físico, un flete
pagado y tiempo perdido. Por eso las defensas están puestas sobre la creación de
pedidos y no sobre el costo de cómputo.

Segundo hecho estructural: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **viaja al
navegador**. Tiene que hacerlo, porque el login la necesita. Cualquiera puede
extraerla del bundle en segundos. Está diseñada para ser pública y RLS es la
frontera de seguridad real — no la clave.

De ahí la regla de diseño: **ninguna protección que viva solo en el cliente o
solo en la aplicación es suficiente.**

## Las cuatro capas

### Capa 1 — Límite de frecuencia en la base

**Activa en producción.** Migración `20260804203000_order_rate_limit.sql`.

Trigger `before insert` sobre `orders_cod` que rechaza más de 3 pedidos con el
mismo correo **o** el mismo celular en una hora.

Vive en Postgres, así que cubre todos los caminos a la vez: formulario, chat,
voz y llamadas directas a la Data API. Es la única capa que no se puede rodear.

Lanza `check_violation` (SQLSTATE 23514). `order.ts` distingue ese caso del
error de precio manipulado y muestra el mensaje real al cliente en vez de un
error genérico que lo invitaría a reintentar.

**Protege:** doble clic, reintentos, scripts que repiten datos.
**No protege:** un atacante que varíe correo y celular en cada intento.

### Capa 2 — Verificación de humano

**Activa en producción.** `botid@1.5.11`.

- `src/instrumentation-client.ts` declara qué se protege: `POST /`. Las server actions se envían por POST a la ruta de la página que las invoca, y todo el checkout vive en la landing.
- `next.config.mjs` envuelve la config con `withBotId`.
- `src/app/actions/order.ts` llama a `checkBotId()` antes de cualquier otra cosa.

Es invisible: el comprador no ve nada. Esto es deliberado — el sitio se financia
con pauta y cualquier fricción en el checkout cuesta conversión.

En desarrollo local siempre resuelve como humano, así que no estorba.

**Protege:** scripts que se hacen pasar por navegador contra la aplicación.
**No protege:** peticiones directas a la Data API, que no ejecutan tu JavaScript.

### Capa 3 — Límite volumétrico en el borde

**En borrador, sin publicar.** Dos reglas en el Firewall de Vercel, ambas en
modo `log`: observan y registran, no bloquean.

| Regla | Condición | Límite |
|---|---|---|
| Límite de pedidos por IP | `POST /` | 20 por 5 min por IP |
| Límite de token de voz por IP | `/api/realtime` | 15 por 5 min por IP |

Publicar con `vercel firewall publish` **solo después** de revisar tráfico real
en el dashboard. Los contadores son por región, así que N regiones pueden
superar el límite configurado en conjunto.

Esta decisión es del dueño del proyecto, no de un agente.

### Capa 4 — Escritura solo desde el servidor

**Activa en producción.** Migración `20260804205500_close_anon_order_insert.sql`.

- Se eliminó la política `visitors_can_create_pending_orders`.
- Se revocó `insert` sobre `orders_cod` a `anon` y `authenticated`.
- Se otorgó `insert` explícito a `service_role`.

Resultado: la publishable key ya no sirve para crear pedidos. El único camino es
`createOrder`, que escribe con `SUPABASE_SECRET_KEY` — y ahí está BotID.

> **Trampa documentada.** El `grant` explícito a `service_role` es
> indispensable. La migración inicial hizo `revoke all` sobre la tabla y solo
> otorgó columnas a `anon`. Sin ese grant, revocar el acceso anónimo deja el
> checkout **sin ningún camino de escritura** y los pedidos fallan en silencio.
> Esto se detectó probando en local; en remoto el comportamiento por defecto de
> `service_role` difería.

## Manejo de claves

| Variable | Ámbito | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Va al navegador. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Público | Va al navegador. Protegida por RLS. |
| `SUPABASE_SECRET_KEY` | **Servidor** | Se salta RLS. Marcada como *Sensitive* en Vercel: ni el CLI puede leerla de vuelta. |
| `OPENAI_API_KEY` | **Servidor** | Solo genera credenciales efímeras. |
| `GEMINI_API_KEY` | **Servidor** | |
| `RESEND_API_KEY` | **Servidor** | |

Reglas:

- Ningún secreto lleva prefijo `NEXT_PUBLIC_`.
- Los secretos se agregan por el dashboard de Vercel o por terminal propia, nunca pegándolos en una conversación con un agente.
- Si un secreto queda escrito en una conversación, **rótalo**: revócalo y genera uno nuevo.

## Identidad: el correo verificado

**Corregido el 5 de agosto de 2026.** Migración
`20260805120000_admin_dashboard_sites_and_channels.sql`.

La lectura de pedidos se resolvía contra `auth.jwt() ->> 'email'`. Ese claim
refleja el correo con el que se creó la sesión, **esté verificado o no**. Con
`enable_confirmations = false` y registro abierto, registrarse con el correo de
un comprador devolvía sesión al instante y entregaba su pedido completo: nombre,
celular, ciudad y dirección.

La corrección tiene dos mitades y ninguna basta sola:

1. `supabase/config.toml`: `enable_confirmations = true`. Sin esto Supabase
   marca `email_confirmed_at` en el propio registro y no habría nada que
   distinguir.
2. `private.verified_email()` lee `auth.users.email_confirmed_at` con
   `security definer`. No usa el JWT, y tampoco `user_metadata`, que el propio
   usuario puede reescribir con `updateUser`.

`private.is_platform_admin()` se apoya en la misma función. Un correo en `platform_admins`
cuya cuenta no haya confirmado **no es administrador**.

> **Trampa:** `supabase db reset` no recarga `config.toml`. Un cambio de
> autenticación exige `supabase stop && supabase start`.

En producción, activar `enable_confirmations` en el dashboard de Supabase es
**parte de la migración**, no un paso opcional posterior.

## Acceso al panel

| Puerta | Quién | Mecanismo |
|---|---|---|
| `/admin` | Operación | Correo y contraseña. Cuentas creadas con `npm run admin:create`. |
| `/dashboard` | Comprador | Enlace de un solo uso, y solo si su correo tiene un pedido. |

Dos decisiones deliberadas:

- **El panel escribe con la sesión del administrador, no con
  `SUPABASE_SECRET_KEY`.** Así deciden la política RLS y el permiso por columna,
  no la comprobación del código. Usar la clave de servidor convertiría un
  descuido en el código en acceso total.
- **Un administrador solo puede cambiar `status`.** El permiso está otorgado
  columna por columna. No puede reescribir dirección, precio ni correo, así que
  una sesión del panel comprometida no altera el registro de una venta.
- **Las altas de administrador no pasan por la aplicación.** Si el panel pudiera
  darse permisos, una sesión robada bastaría para crear más administradores.

El portal del cliente responde lo mismo tenga pedidos o no. Decir "ese correo no
tiene pedidos" convertiría el formulario en una forma de averiguar quién compró.

## Estado de RLS

Todas las tablas públicas tienen RLS habilitado. Advisors de seguridad de
Supabase: **cero hallazgos** al 4 de agosto de 2026. Conviene volver a correrlos
tras aplicar la migración del panel.

| Tabla | Anónimo | Autenticado | Administrador | Servidor |
|---|---|---|---|---|
| `orders_cod` | — | Comprador: su correo; miembro: su sitio | Plataforma: — | Inserta y lee |
| `leads` | Inserta | Inserta | — | — |
| `chat_sessions` | Inserta | Inserta | — | — |
| `chat_messages` | Inserta | Inserta | — | — |
| `sites` | Lee campos públicos | Miembro: sus sitios | Plataforma: — | Lee y escribe |
| `site_channels` | Lee | Miembro: lee y actualiza los suyos | Plataforma: — | Lee y escribe |
| `platform_admins` | — | — | Lee si es de plataforma | Lee y escribe |
| `site_members` | — | — | Lee los de sus sitios | Lee y escribe |
| `site_api_keys` | — | — | **Nada: sin grant ni política** | Lee y escribe |
| `clients` | — | — | Sin grant de sesión | Lee y escribe tras guard de plataforma |
| `intake_requests` | — | — | Sin grant de sesión | Lee y escribe tras guard o token privado |
| `intake_files` | — | — | Sin grant de sesión | Lee y escribe tras guard o token privado |
| `order_status_events` | — | Miembro: los de su sitio | Plataforma: — | Lee y escribe |
| `contacts` | — | Miembro: su sitio | Plataforma: — | Lee y escribe |
| `contact_notes` | — | Miembro: su sitio | Plataforma: — | Lee y escribe |

La identidad de plataforma autoriza las acciones corporativas del servidor,
pero no aparece en `private.accessible_site_ids()`. Por tanto, abrir `/admin`
manualmente o llamar PostgREST con esa sesión devuelve cero filas operativas.

El CRM es interno: un comprador no ve su propia ficha ni las notas que la
operación escribe sobre él. El historial de estados **no tiene permiso de
`update` ni `delete` para nadie** desde la aplicación, ni siquiera para un
administrador: es un registro, no un campo editable.

Los grants a `service_role` sobre las tablas nuevas son **explícitos y
obligatorios**: los defaults de Supabase de 2026 no otorgan nada sobre una tabla
nueva. Es la misma trampa documentada en la capa 4.

### Nitro Intake

El enlace de intake es una capacidad privada de 256 bits. La base guarda solo
su SHA-256; un volcado no permite reconstruir enlaces activos. La misma
respuesta se usa para token inválido, vencido o revocado.

`intake_requests` e `intake_files` tienen RLS sin políticas y ningún grant para
`anon` o `authenticated`. Las rutas públicas usan `service_role` únicamente
después de validar el token. Los archivos entran al bucket privado
`nitro-intake` mediante una URL firmada para un solo path, con máximo 30 MB por
archivo, 60 archivos y 300 MB por solicitud, y permanecen allí como fuente de
verdad. Tipos activos como HTML, SVG o JavaScript no se aceptan.

La central `/platform` usa `service_role` solo después de validar una sesión de
plataforma. Para abrir o descargar un archivo emite una URL firmada de 60
segundos; el navegador recibe únicamente el path de ese objeto y un token
temporal, nunca una credencial general. Los miembros de clientes no pueden usar
esas rutas ni enumerar el bucket.

Una solicitud puede existir sin `client` ni `site`: conserva solo nombre e
identificador provisionales. La conversión exige sesión de plataforma y un
brief entregado y válido; crea el sitio desactivado, de modo que recibir datos
del prospecto nunca habilita ventas ni acceso administrativo por sí solo.

Las rutas `/intake/*` no cargan Google Analytics, Meta Pixel ni Speed Insights,
y declaran `Referrer-Policy: no-referrer`: enviar el token en una URL a
terceros convertiría la analítica o una carga externa en una filtración de
acceso. El cliente no recibe credenciales de Storage ni acceso para enumerar
otros objetos.

### Logos de clientes

Los logos viven en el bucket público `site-logos`: son recursos comerciales que
deben poder mostrarse sin sesión. “Público” solo permite descargar con la URL;
no habilita subir, reemplazar, listar ni borrar. Esas operaciones pasan por
`updateSiteBranding()` o `createClientSite()`, ambas comprueban primero el rol de
plataforma y usan la clave de servidor. Se rechazan SVG y otros formatos
activos; solo PNG, JPG y WebP, con límite de 750 KB en la aplicación y 1 MB en
el bucket.

## Lo que sigue expuesto

- **`leads`, `chat_sessions` y `chat_messages` aceptan inserciones anónimas.** Riesgo menor —no generan despachos— pero es la misma clase de exposición si el spam llega a molestar.
- **`/api/realtime/token` usa un `Map` en memoria** para limitar (8 por minuto por IP). Con varias instancias en Vercel el límite real se multiplica, y cada reciclaje lo reinicia. La capa 3 lo cubriría mejor cuando se publique.
- **El envío del enlace de acceso no tiene límite propio.** Se apoya en
  `auth.rate_limit` de Supabase, que cuenta por IP. Un atacante con muchas IP
  podría usarlo para generar correos, aunque solo hacia direcciones que ya
  compraron.
- **El historial no tiene aún analítica de tiempos.** `order_status_events`
  registra quién y cuándo cambió cada estado, pero el panel no calcula todavía
  cuánto tarda un pedido en cada etapa.

## Cómo verificar que las capas siguen en pie

```bash
npm run supabase:reset
npm run supabase:test      # 59 pruebas: límite de frecuencia, permisos por
                           # columna e identidad verificada
npm run supabase:verify    # extremo a extremo contra PostgREST: creación,
                           # lectura, panel y canales
```

Si `supabase:verify` falla diciendo que un registro sin confirmar obtuvo sesión,
el problema casi siempre es que `config.toml` no se recargó: hace falta
`supabase stop && supabase start`, no `db reset`.

En producción, contra el proyecto remoto:

```sql
-- debe devolver 0
select count(*) from pg_policies
where tablename = 'orders_cod' and policyname = 'visitors_can_create_pending_orders';

-- debe devolver 0
select count(*) from information_schema.role_table_grants
where table_name = 'orders_cod' and grantee = 'anon' and privilege_type = 'INSERT';
```

Y correr los advisors de seguridad de Supabase tras cualquier cambio de esquema.
