# Nitro Landing — la plataforma multi-cliente

**Última actualización: 26 de agosto de 2026.**

Cómo Nitro Landing gestiona varias landings de varios clientes sobre una sola
base de datos. Para las reglas de trabajo ve a `../AGENTS.md`; para el panel en
sí, a `ADMIN_DASHBOARD.md`.

## La forma del sistema

```
        ┌─────────────────────────────────────┐
        │  Plataforma (este repositorio)      │
        │ /platform + /admin + API /api/v1    │
        │  ÚNICO lugar con SUPABASE_SECRET_KEY│
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │  Supabase compartido                │
        │  El RLS por sitio es la frontera    │
        └──────────────────▲──────────────────┘
                           │  (nunca directo)
   ┌───────────────────────┼───────────────────────┐
   │                       │                       │
 landing A              landing B              landing C
 proyecto Vercel        proyecto Vercel        proyecto Vercel
 BotID → server action → POST /api/v1/orders con NITRO_SITE_KEY
```

**Una landing de cliente nunca toca Supabase.** Conoce su llave de sitio y nada
más. Es la decisión que sostiene todo lo demás: `SUPABASE_SECRET_KEY` se salta
el RLS de **todos** los inquilinos, así que ponerla en el proyecto de Vercel de
un cliente convertiría una filtración suya en una filtración de todos.

BotID se queda en la landing porque protege la ruta donde está el formulario. La
llamada a la API ya es de servidor a servidor.

## Dos clases de identidad

| Tabla | Quién | Alcance |
|---|---|---|
| `platform_admins` | La central corporativa de Nitro | Fichas y configuración por acciones de servidor; sin pedidos ni CRM. |
| `client_members` | El cliente y su equipo | Todas las landings actuales y futuras del cliente. |

`admin_users` **ya no existe**. Era una sola lista global: cualquier cuenta en
ella leía los pedidos, los contactos y las métricas de todos los sitios. Con un
cliente no se notaba; con dos era una filtración.

Toda política se apoya en el mismo par de funciones:

- `private.is_platform_admin()` — ¿esta sesión es de la plataforma?
- `private.accessible_site_ids()` — ¿en qué sitios es miembro el usuario?

Ambas pasan por `private.verified_email()`, que lee `auth.users` y exige
`email_confirmed_at`. **No** usan `auth.jwt() ->> 'email'`, que refleja el correo
con el que se creó la sesión, verificado o no.

`private.accessible_site_ids()` **no** incluye a `platform_admins`. La central
consulta datos corporativos mediante acciones de servidor que primero ejecutan
`requirePlatformAdmin()` y después usan `service_role`. La sesión del
superadmin recibe cero filas de pedidos, CRM, contactos, métricas y canales
operativos. No existe impersonación.

`clients` es la entidad comercial y `sites` contiene sus landings. Una misma
fila de `clients` puede agrupar varias filas de `sites` mediante
`sites.client_id`. Nombre legal, contacto, onboarding, plan y facturación viven
en `clients`; marca, dominio, repositorio, proyecto Vercel y URL de producción
viven por landing en `sites`.

El patrón se repite igual en todas las tablas:

```sql
using (site_id in (select private.accessible_site_ids()))
```

`contact_notes` es la excepción de forma: no tiene `site_id`, cuelga del
contacto, así que pasa por `contacts`.

Las vistas `order_daily_stats` y `order_city_stats` son `security_invoker`, de
modo que arrastran la frontera sin necesitar política propia. Hay una prueba
pgTAP que lo comprueba: si alguien las recreara sin esa opción, entregarían
agregados de todos los clientes sin que ninguna política lo impidiera.

## La API interna que consume Nitro Bot

Nitro Bot presenta las landings de un cliente dentro de su propio dashboard, para
que el cliente vea **un solo producto** con una sola cuenta. Nitro Landing no
cede nada por ello: conserva su base, su renderer, su editor, sus dominios y sus
publicaciones. Lo que entrega es lectura, por contrato.

```text
Nitro Bot ──HMAC──> /api/internal/v1/clients/…  ──> Supabase Landing
   │
   └─ proyecta pedidos y contactos en SU base (Pedidos, CRM, Métricas)
```

| Ruta | Para qué |
|---|---|
| `GET /api/internal/v1/clients` | Listar clientes, para vincular uno con un tenant del bot |
| `POST /api/internal/v1/clients` | Alta de cliente desde Nitro Admin |
| `GET /api/internal/v1/clients/:id/summary` | Lo que pinta la pantalla del cliente |
| `GET /api/internal/v1/clients/:id/changes?since=` | Pedidos y contactos cambiados, para proyectar |
| `POST /api/internal/v1/clients/:id/sites` | Alta de landing, con su llave de ingesta |
| `PATCH /api/internal/v1/clients/:id/sites/:siteId` | Canales, Meta Pixel y pausa |
| `POST /api/internal/v1/clients/:id/intakes` | Emitir el enlace del brief |
| `GET /api/internal/v1/clients/:id/intakes` | En qué va cada solicitud |
| `PATCH /api/internal/v1/clients/:id/orders/:orderId` | Estado y guía del pedido |
| `PATCH /api/internal/v1/clients/:id/contacts/:contactId` | Etapa, seguimiento y nota |

La landing, el pedido y el contacto van **anidados bajo su cliente** en la ruta:
es la declaración de alcance de Nitro Bot, y aquí se comprueba la pertenencia
contra `sites.client_id`. Un id filtrado no alcanza lo de otro cliente.

**El historial de estados lo escribe el trigger**
`orders_cod_record_status_event`, no el endpoint. Insertar también dejaba dos
filas por despacho. Lo que el trigger no puede saber —quién lo movió, porque usa
`private.verified_email()` que es NULL con `service_role`, ni por qué— se
completa después sobre su misma fila.

**El formulario del brief no se duplica en Nitro Bot.** Sigue en
`/intake/{token}`, que es una página pública con token y no un panel. Pedir dos
veces el mismo brief reemite el enlace de la solicitud abierta en vez de crear
otra: del token solo se guarda el hash, así que rechazarlo dejaría al cliente
sin forma de volver.

Está **separada de `/api/v1`** a propósito. Aquella es la ingesta que usan las
landings con su llave de sitio y solo alcanza su propio sitio; esta lee datos
comerciales de cualquier cliente. Mezclarlas haría que un error de autorización
en una abriera la otra.

Autoriza `NITRO_BOT_INTEGRATION_SECRET` mediante HMAC sobre
`timestamp.método.ruta.sha256(cuerpo)`, con ventana de cinco minutos. No es una
llave estática como las de sitio porque el alcance es mucho mayor: una llave que
viaja tal cual se reutiliza tal cual si alguien la ve en un log.
`NITRO_BOT_INTEGRATION_SECRET_PREVIOUS` existe solo para rotar sin caída.

**El vínculo tenant ↔ cliente NO vive aquí, sino en Nitro Bot.** Es lo que
permite que esta integración no necesite ni una migración en Nitro Landing, y
que vincular a un cliente no dependa de que este despliegue esté en pie.

La sincronización es *pull* con cursor sobre `updated_at`, comparado con `>=` y
no con `>`: con `>` se perdería en silencio cualquier fila que compartiera el
milisegundo del corte. La fila del borde se reenvía y la descarta la
idempotencia del consumidor. Perder un pedido es peor que repetirlo.

**Lo que esta API no puede dar, y no hay que buscarlo:** visitas, sesiones,
scroll ni tasa de conversión. Nitro Landing no guarda analítica de
comportamiento —eso vive en Meta Pixel, del lado del navegador—, así que las
únicas cifras que entrega salen de los pedidos.

## El precio vive en la base, por sitio

`orders_cod` tenía `check (total_price = 490000)`. Con eso, un segundo cliente
**no podía vender nada**: la base rechazaba cualquier otro importe.

Ahora el precio está en `site_products` y lo hace cumplir
`private.enforce_order_price()`, un trigger `before insert`:

- Sin `product_id` explícito lo resuelve solo, pero únicamente si el sitio tiene
  **exactamente un** producto activo. Con varios rechaza en vez de adivinar:
  elegir mal es cobrar un precio que no era.
- El producto tiene que pertenecer al mismo sitio del pedido. Cruzarlos es la
  forma obvia de intentar cobrar de menos.
- Si `total_price` no coincide con el del producto, rechaza con `23514`.

> **Cuidado:** `src/lib/product.ts` sigue siendo la fuente de verdad comercial
> de la landing de Coffee Maker Pro, y `site_products` lo es del cobro. Mientras
> compartan despliegue deben coincidir; `createOrder` lo comprueba y prefiere no
> vender antes que vender al precio equivocado.

## Campos opcionales del formulario

`orders_cod` exigía los cinco datos del comprador. Servía con una landing; con
varias, no: cada mercado pide lo suyo.

Ahora `email` y `city` aceptan nulo, y `site_channels.require_email` /
`require_city` deciden por sitio. Ambas nacen en `true`, así que ninguna landing
existente cambia de comportamiento hasta que alguien las apague.

**Solo esos dos.** Nombre, celular y dirección siguen siendo `not null` en la
base: sin ellos no se puede despachar un contraentrega, y el celular además
sostiene el límite antiabuso y la unión con el contacto.

Relajar la obligatoriedad no relaja el formato. Los checks pasaron a "nulo o
válido": un correo presente sigue teniendo que estar en minúsculas y con forma
de correo.

La comprobación real vive en `createOrderForSite`, no en el formulario. El
navegador se puede modificar; ese camino no. Sin fila de canales se exige todo:
un sitio a medio configurar debe pedir de más, no de menos.

Se configura desde la pestaña **Canales** de `/platform` y desde
**Ajustes de la landing** en el panel del cliente. `/api/v1/site` lo entrega en
`form.requireEmail` y `form.requireCity`.

## Medición por landing

`site_tracking` guarda el ID numérico público de Meta Pixel y su interruptor.
No admite scripts ni tokens de Conversions API. La lectura es pública porque el
ID termina en la landing; la escritura usa RLS y solo alcanza las landings del
cliente autenticado. La central actualiza mediante una acción protegida con
`requirePlatformAdmin()` y `service_role`.

`/api/v1/site` entrega `tracking.metaPixelEnabled` y
`tracking.metaPixelId`. Sin fila, ID válido o activación, las plantillas fallan
cerradas. El navegador exige consentimiento antes de cargar Meta y vuelve a
comprobarlo en `InitiateCheckout` y `Purchase`; retirarlo impide eventos nuevos.
Coffee Maker somete además Google Analytics y Speed Insights a esa decisión.

## Llaves de ingesta

`site_api_keys` guarda el `sha256` de la llave en hexadecimal, **nunca la
llave**. El prefijo visible (`nl_live_a1b2…`) solo sirve para reconocerla.

La tabla tiene RLS activo y **ninguna política**, y además no tiene concedido el
permiso de tabla a `authenticated`. Son dos capas: una consulta desde una sesión
del navegador falla antes de llegar al RLS. Solo `service_role` la lee.

```bash
npm run site:key -- emitir demo-cliente 'Landing de producción'
npm run site:key -- listar demo-cliente
npm run site:key -- revocar <id>
```

También desde `/platform`. La llave se muestra **una sola vez**: quien la
pierda, revoca y emite otra.

El endpoint devuelve el mismo `401` para llave inexistente, revocada y sitio
inactivo. Distinguirlos lo convertiría en un oráculo de llaves válidas.

## Recibir el brief y dar de alta un cliente

Antes de usar `/admin`, el cliente acepta por separado los términos del servicio
y la autorización de tratamiento de datos. El layout bloquea todas las rutas,
salvo aceptar o cerrar sesión. `legal_documents` conserva versiones publicadas
inmutables; `client_legal_acceptances` guarda cliente, usuario autenticado,
correo, fecha del servidor, versión, SHA-256, declaración, IP y user-agent. Una
versión nueva obliga a aceptar de nuevo. El superadmin publica texto revisado y
audita cada evidencia desde la pestaña **Términos**; no puede editarla o borrarla.

Los intakes independientes siguen disponibles antes del alta porque todavía no
existe una identidad corporativa a la cual atribuir la aceptación. Deben
convertirse en cliente, crear su usuario y obtener aceptación antes de iniciar
el trabajo operativo de la landing.

El alta ya no tiene que ocurrir antes de hablar con el prospecto:

1. **Intake independiente.** En `/platform`, pulsa **Nuevo intake** y escribe
   únicamente un nombre provisional y un identificador. No hacen falta cliente,
   producto ni precio. Comparte el enlace privado que aparece una sola vez.
2. **Brief recibido.** Cuando el cliente entrega los seis pasos, la solicitud
   aparece como lista en **Solicitudes antes del alta**. El botón **Crear cliente
   desde el brief** crea `clients` + `sites` + `site_channels` + `site_tracking` + `site_products`
   con la información confirmada. La landing queda desconectada hasta terminar
   su configuración. La conversión automática admite por ahora precios en COP.
3. **Usuario.** `npm run admin:create -- --site <slug> correo 'Clave' 'Nombre'`.
4. **Llave.** `npm run site:key -- emitir <slug>`.
5. **Landing.** Usa el material de `openclaw/clientes/<slug>` con
   `npm run landing:new -- --client <slug> --target <ruta>`.

También sigue disponible el alta manual desde `/platform`:

1. **Cliente y primera landing.** Crea `clients` + `sites` + `site_channels` +
   `site_tracking` + `site_products` de una vez. Las cinco filas van juntas: un sitio sin producto no puede
   vender y uno sin canales no puede pintar la landing. El panel revierte el
   alta si alguna falla, para no dejar un cliente a medio crear. En el mismo
   formulario se define el nombre visible y se puede subir un logo opcional.
   El dashboard de ese cliente usa ambos; la vista del superadmin sigue usando
   la identidad Nitro.
2. **Usuario.** `npm run admin:create -- --site <slug> correo 'Clave' 'Nombre'`.
   El correo queda confirmado; sin eso la cuenta entra al panel y no ve nada.
3. **Llave.** `npm run site:key -- emitir <slug>`.
4. **Landing.** Sube el material a `openclaw/clientes/<slug>` y crea el proyecto
   neutro con `npm run landing:new -- --client <slug> --target <ruta>`. El
   agente diseña desde la evidencia del cliente y conserva el núcleo Nitro.
   Instrucciones completas en `docs/LANDING_FACTORY.md`.

### Nitro Intake: recibir y revisar el material en Supabase

Se puede crear un intake global antes del alta o emitirlo desde la pestaña
**Brief** de un cliente existente. Al crear un enlace:

- se genera un token aleatorio y solo se guarda su hash;
- un enlace nuevo revoca el borrador anterior del mismo sitio; los intakes
  independientes pueden renovarse y el enlace anterior deja de funcionar;
- el cliente completa seis pasos con guardado automático desde el celular;
- cada carga recibe una firma para un único path y queda permanentemente en el
  bucket privado `nitro-intake`, organizada por solicitud y categoría;
- `/platform` muestra si el cliente no empezó, está completando o ya entregó,
  junto con actividad, cantidad de archivos y el detalle completo;
- la revisión permite abrir o descargar cada archivo mediante una URL firmada
  de 60 segundos y exportar `BRIEF.md` e `intake.json` bajo demanda.

El enlace dura 30 días y puede cerrarse manualmente. El cliente no puede
enumerar Storage ni leer archivos de otra solicitud. Si una carga se interrumpe,
puede reintentar o quitar ese archivo; un pendiente no obliga a empezar el
formulario de nuevo. Nitro Intake ya no requiere Google Drive ni OAuth.

Si el diseño ya existe en otro repositorio, no se copia la interfaz de la
plantilla. Se prepara ese repositorio desde aquí:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio --client <slug>
```

Esto instala instrucciones para Codex/Claude, el contrato de integración, el
brief y un verificador, conservando el diseño existente. Flujo completo en
`LANDING_FACTORY.md`.

El logo puede cambiarse después desde la pestaña **Marca** de la tarjeta del
cliente. PNG, JPG y WebP tienen límite de 750 KB. Se almacenan públicamente en
Supabase Storage porque son identidad visual pública, pero solo el superadmin
puede cargarlos o borrarlos mediante una acción de servidor.

## Los starters de landing

`templates/nitro-starter/` es el punto de partida recomendado: un proyecto
mínimo y visualmente neutro con checkout Nitro, documentos creativos y gates.
`scripts/create-landing-workspace.mjs` agrega el material y el skill portable.

`templates/landing/` es un proyecto Next completo e independiente, derivado de
la landing de Coffee Maker Pro. Se conserva como referencia funcional y para
migraciones, no como estilo predeterminado. Compila por su cuenta y **no depende
de este repositorio en tiempo de ejecución**.

Lo que se le quitó respecto de la landing original:

| Se fue | Por qué |
|---|---|
| `src/utils/supabase/` entera | No tiene ni debe tener credenciales de base de datos. |
| `/admin`, `/dashboard`, `/login`, `/auth` | Panel y portal viven en la plataforma. |
| `@supabase/*` de `package.json` | Sin dependencia, no hay forma de añadir la clave por descuido. |
| La sesión del `Navbar` | Leer la sesión exigía el cliente de navegador de Supabase. El enlace al portal ahora apunta a `NEXT_PUBLIC_NITRO_PORTAL_URL`. |
| La persistencia del chat | Escribía en `chat_sessions`. El chat conversa y vende igual; se pierde el historial. |

Lo que se edita por cliente: `src/lib/product.ts`, `src/lib/data.ts`,
`src/lib/marco-voice-prompt.ts`, `public/`, `tailwind.config.ts` y los metadatos
de `src/app/layout.tsx`.

## Desconectar la landing de un cliente

Botón **Conectada / Desconectada** en su tarjeta de `/platform`. Apaga
la venta sin desplegar nada y sin entrar al proyecto del cliente:

- `resolveSiteFromKey` comprueba `is_active`, así que la API responde `401` a
  cualquier pedido de ese sitio.
- La landing, al revalidar su configuración, esconde el checkout, apaga chat y
  voz, y muestra un aviso.

Comprobado de extremo a extremo en local: con el sitio conectado la API devuelve
`201`; al desconectarlo, `401`, y la landing se apagó sola en unos 30 segundos.

Ese retraso es inherente: la landing de un cliente vive en otro despliegue,
donde la invalidación de caché del panel no llega, así que revalida por tiempo
(60 s). La landing propia sí se entera al instante.

## Variables por tipo de proyecto

| Variable | Plataforma | Landing de cliente |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Sí | **Nunca** |
| `NEXT_PUBLIC_SUPABASE_*` | Sí | No |
| `NITRO_SITE_KEY` | No | Sí |
| `NITRO_API_URL` | No | Sí |
| `SITE_SLUG` | — | Sí |

`src/app/actions/order.ts` decide su modo por la presencia de `NITRO_SITE_KEY`:
con ella reenvía a la API, sin ella resuelve el sitio por slug y escribe directo.
Eso es lo que permite que Coffee Maker Pro siga compartiendo despliegue con la
plataforma mientras los clientes nuevos ya no lo hacen.

## Lo que sigue sin resolverse

- **El límite antiabuso de pedidos no filtra por sitio.**
  `private.enforce_order_rate_limit()` cuenta pedidos recientes con
  `where (email = new.email or phone = new.phone)`, sin `site_id`. Con un solo
  inquilino daba igual; con dos, el tráfico de un cliente puede bloquear al
  comprador de otro, y deja adivinar si un teléfono ya compró en otra tienda.
  Detectado el 25 de agosto de 2026; no se cambió porque tocar la regla
  antiabuso merece su propia decisión.

- **El panel comparte despliegue con la landing de Coffee Maker Pro.** Un cliente
  entra a su panel por el dominio de otra tienda. Funciona, pero es incómodo de
  explicar.
- **Un producto por sitio.** `site_products` es plural y el trigger ya rechaza la
  ambigüedad, pero ni el panel ni la API saben elegir entre varios.
- **Los dominios se conectan a mano** en Vercel. `sites.primary_domain` es un
  registro, no una automatización.
- **La facturación es un registro, no un cobro.** Sin pasarela y sin dato de
  tarjeta, a propósito.
- **Vercel y DNS se conectan a mano.** El panel crea la identidad lógica, el
  usuario y la llave, pero no crea repositorios, proyectos ni dominios externos.
- **Resend está aplazado.** Sin `RESEND_API_KEY`, la plataforma guarda el pedido
  y omite el correo. Al activarlo, asunto y contenido usan sitio y producto por
  cliente; un remitente distinto exige verificar cada dominio.
