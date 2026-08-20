# Nitro Landing — la plataforma multi-cliente

**Última actualización: 20 de agosto de 2026.**

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
| `site_members` | El cliente y su equipo | Solo los sitios donde tiene fila. |

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

## Dar de alta un cliente

Desde `/platform`, o a mano:

1. **Cliente y primera landing.** Crea `clients` + `sites` + `site_channels` +
   `site_products` de una vez. Las cuatro filas van juntas: un sitio sin producto no puede
   vender y uno sin canales no puede pintar la landing. El panel revierte el
   alta si alguna falla, para no dejar un cliente a medio crear. En el mismo
   formulario se define el nombre visible y se puede subir un logo opcional.
   El dashboard de ese cliente usa ambos; la vista del superadmin sigue usando
   la identidad Nitro.
2. **Usuario.** `npm run admin:create -- --site <slug> correo 'Clave' 'Nombre'`.
   El correo queda confirmado; sin eso la cuenta entra al panel y no ve nada.
3. **Llave.** `npm run site:key -- emitir <slug>`.
4. **Landing.** Copia `templates/landing/` a un repositorio nuevo y despliégalo
   con `NITRO_SITE_KEY` y `NITRO_API_URL`. Sin ninguna variable de Supabase.
   Instrucciones completas en `templates/landing/README.md`.

Si el diseño ya existe en otro repositorio, no se copia la interfaz de la
plantilla. Se prepara ese repositorio desde aquí:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio
```

Esto instala instrucciones para Codex/Claude, el contrato de integración, el
brief y un verificador, conservando el diseño existente. Flujo completo en
`LANDING_FACTORY.md`.

El logo puede cambiarse después desde la pestaña **Marca** de la tarjeta del
cliente. PNG, JPG y WebP tienen límite de 750 KB. Se almacenan públicamente en
Supabase Storage porque son identidad visual pública, pero solo el superadmin
puede cargarlos o borrarlos mediante una acción de servidor.

## La plantilla de landing

`templates/landing/` es un proyecto Next completo e independiente, derivado de
la landing de Coffee Maker Pro. Compila por su cuenta y **no depende de este
repositorio en tiempo de ejecución**.

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
