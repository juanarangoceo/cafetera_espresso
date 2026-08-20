# Nitro Landing — panel de operación

**Última actualización: 20 de agosto de 2026.**

`/admin` es exclusivamente el panel operativo de los clientes. La cabecera usa
el nombre y logo del sitio activo; nunca muestra la marca de otro cliente. La
central del dueño de Nitro vive aparte en `/platform`.

## Selector de tienda

Todas las secciones —pedidos, métricas, CRM y canales— filtran por la tienda
activa. La elección se guarda en la cookie `nitro_site` y no en la URL, para no
arrastrar el parámetro por cada enlace, filtro y paginación. Si la cookie apunta
a una tienda que ya no existe, se cae a la primera en vez de romper la página.

Con varias tiendas aparece un selector. Con una sola se muestra su nombre sin
desplegable; un cliente no necesita una selección de un único elemento.

**Consecuencia:** el panel muestra solo las tiendas donde el usuario tiene una
fila explícita en `site_members`. Un superadmin que intente abrir `/admin` es
redirigido a `/platform` y RLS tampoco le entrega datos.

## Marca por cliente

Al crear un cliente en `/platform` se puede adjuntar un logo opcional.
El nombre del sitio y ese logo aparecen en la cabecera del dashboard cuando
entra un miembro de ese sitio. La central `/platform` conserva la marca Nitro.

Cada tarjeta de cliente tiene además una pestaña **Marca** para cambiar el
nombre, reemplazar el logo o quitarlo. Se aceptan PNG, JPG y WebP de hasta
750 KB. Los archivos viven en el bucket público `site-logos`; solo son públicas
las descargas. Las cargas y eliminaciones pasan por una Server Action que exige
rol de plataforma y usa `SUPABASE_SECRET_KEY` en el servidor.

Cubre pedidos y estados, métricas, CRM, canales conmutables y acceso. Para las
reglas de trabajo ve a `../AGENTS.md`; para el estado general del proyecto, a
`PROJECT_HANDOFF.md`.

## Qué resuelve

Antes de esto no había forma de ver los pedidos que llegaban ni de cambiarles el
estado: `orders_cod` no tenía **ninguna** ruta de `update` en la base. `/dashboard`
era —y sigue siendo— portal de cliente, no panel administrativo. Chat y voz
estaban cableados en el layout, así que apagarlos exigía un despliegue.

## Decisiones tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| Identidad de administrador | Tablas `platform_admins` y `site_members` | La frontera queda en Postgres, no en la aplicación. Coherente con `SECURITY.md`. Ver `PLATFORM.md`. |
| Acceso del cliente | Enlace mágico por correo | Sin contraseña. Cierra de raíz el hueco de correo no verificado. |
| Quién puede entrar al portal | Solo correos con pedido | El portal no es una red social: si no compraste, no hay nada que ver. |
| WhatsApp | Botón con número configurable | Del otro lado responde un bot. Sin borradores ni códigos. |
| Multi-landing | Esquema desde ya | Migrar `orders_cod` después, con pedidos reales, sale mucho más caro. |

## Modelo de acceso

Dos puertas separadas, con dos mecanismos distintos:

| Ruta | Quién | Cómo entra |
|---|---|---|
| `/platform` | Dueño de Nitro | Correo y contraseña; fila en `platform_admins`. |
| `/admin` | Operación | Correo y contraseña. La cuenta la crea `npm run admin:create`. |
| `/dashboard` | Comprador | Enlace mágico al correo con el que compró. |

**El correo verificado es la única credencial que cuenta.** `private.verified_email()`
lee `auth.users.email_confirmed_at` directamente, con `security definer`. No usa
`auth.jwt() ->> 'email'` —que refleja el correo con el que se creó la sesión,
verificado o no— ni `user_metadata`, que el propio usuario puede reescribir.

`private.is_platform_admin()` se apoya en esa función y comprueba la fila en
`platform_admins`. `private.accessible_site_ids()` resuelve además qué sitios
alcanza un cliente, que es lo que separa a unos de otros.

### El hueco que esto cerró

Con `enable_confirmations = false` y registro abierto, **cualquiera podía
registrarse con el correo de un comprador y leer su pedido**: nombre, celular,
ciudad y dirección. La política anterior confiaba en el claim del JWT.

Se corrigió en dos frentes a la vez, porque cada uno por separado era
insuficiente:

1. `supabase/config.toml`: `enable_confirmations = true`. Sin esto, Supabase
   marca `email_confirmed_at` en el propio registro y la comprobación de la
   base no distinguiría nada.
2. La política exige ahora `email = private.verified_email()`.

Verificado tras `supabase stop && supabase start`: registrarse con el correo de
un comprador ya no devuelve sesión.

> **Trampa:** `supabase db reset` **no** recarga `config.toml`. Un cambio de
> autenticación exige `supabase stop && supabase start`, o la comprobación
> parecerá fallar sin motivo.

## Esquema añadido

Migración `20260805120000_admin_dashboard_sites_and_channels.sql`.

| Tabla | Uso | RLS |
|---|---|---|
| `sites` | Una fila por landing, incluida su marca | Lectura pública; escritura solo desde acciones de plataforma en el servidor. |
| `site_channels` | Interruptores y número de WhatsApp por sitio | Lectura pública; `update` solo administradores. |
| `platform_admins` | Correos de la operación de Nitro Landing | Lectura solo de plataforma; sin escritura desde la app. |
| `site_members` | Quién pertenece a cada sitio de cliente | Cada miembro ve los de sus propios sitios. |

`orders_cod` gana `site_id`, con valor por defecto fijo
`c0ffee00-0000-4000-8000-000000000001` (el sitio Coffee Maker Pro). El
identificador es literal y no aleatorio a propósito: es el default de la
columna, así que tiene que ser idéntico en local, Preview y producción.

### Permisos por columna

Un administrador puede cambiar `status` **y nada más**:

```sql
grant update (status) on table public.orders_cod to authenticated;
```

No puede corregir dirección, precio ni correo. Una cuenta del panel comprometida
no se convierte en una vía para alterar el registro de una venta. Comprobado:
intentar actualizar `address` devuelve `permission denied for table orders_cod`.

`site_channels` tiene una restricción equivalente en la base: `whatsapp_enabled`
sin `whatsapp_phone` es imposible, para que el botón nunca apunte a la nada.

### Grants a `service_role`

Los defaults de Supabase de 2026 no otorgan nada sobre una tabla nueva, **ni
siquiera a `service_role`**. Es la misma trampa que dejó el checkout sin camino
de escritura al cerrar el acceso anónimo. Sin ellos:

- `npm run admin:create` falla con `permission denied for table platform_admins`.
- El portal del cliente no puede comprobar si un correo tiene pedidos.

## Crear un administrador

```bash
# Administrador de plataforma: entra a /platform, sin acceso operativo.
npm run admin:create -- correo@ejemplo.com 'ContraseñaSegura' 'Nombre'

# Cliente: ve solo su sitio.
npm run admin:create -- --site demo-cliente cliente@ejemplo.com 'Clave' 'Nombre'
```

Crea la cuenta en `auth.users` con el correo ya confirmado y la autoriza en
`platform_admins` o en `site_members`, según lleve `--site`. Sin `email_confirm`,
la cuenta entra al panel y no ve nada, sin mensaje que explique por qué.

Contra un proyecto remoto, exportando las variables en tu propia terminal y
nunca pegándolas en una conversación con un agente:

```bash
SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run admin:create -- correo@ejemplo.com 'ContraseñaSegura'
```

## Mapa de archivos

**Panel**

- `src/app/admin/(panel)/metricas/page.tsx` — métricas.
- `src/app/admin/(panel)/crm/page.tsx` y `crm/[id]/page.tsx` — CRM.
- `src/app/admin/crm-actions.ts` — alta y edición de contactos, notas.
- `src/lib/admin-site.ts` — tienda activa y listado de tiendas.
- `src/lib/crm.ts` — etapas, orígenes y fechas del CRM.
- `src/components/admin/SiteSwitcher.tsx`, `OrdersOverTimeChart.tsx`, `ContactForm.tsx`, `ContactNoteForm.tsx`
- `src/app/admin/login/page.tsx` — acceso con correo y contraseña. Fuera del grupo `(panel)` para que no lo proteja el guard.
- `src/app/admin/(panel)/layout.tsx` — barrera de acceso y armazón. El grupo no cambia las URL.
- `src/app/admin/(panel)/page.tsx` — pedidos: métricas, filtros, búsqueda, paginación.
- `src/app/admin/(panel)/ajustes/page.tsx` — canales del sitio.
- `src/app/admin/actions.ts` — cambio de estado, guardado de canales, entrada y salida.
- `src/lib/admin-auth.ts` — `requireAdmin()` pregunta a la base, no decide por su cuenta.
- `src/components/admin/` — navegación, filtros, selector de estado, formulario de canales.

**Portal del cliente**

- `src/app/login/page.tsx` + `src/components/AccessRequestForm.tsx` — solicitud del enlace.
- `src/app/login/actions.ts` — envía el enlace solo a correos con pedido.
- `src/app/auth/confirm/route.ts` — canjea el enlace por sesión.
- `src/app/dashboard/page.tsx` — línea de tiempo del estado.

**Canales**

- `src/lib/site-config.ts` — lectura cacheada por etiqueta y armado del enlace de WhatsApp.
- `src/components/WhatsAppButton.tsx` — botón flotante.
- `src/components/layout/ClientLayout.tsx` — monta cada canal según su interruptor.
- `src/lib/orders.ts` — estados, etiquetas para operación y para cliente, formatos.

## Métricas

`/admin/metricas`. Migración `20260805180000_crm_and_metrics.sql`.

Mide **solo lo que el sistema sabe de verdad**. La conversión sobre visitas, el
costo por pedido y el retorno de la pauta no están en la base —viven en Google
Analytics y Meta— y por tanto no aparecen aquí.

**Cada página mide una ventana distinta, y lo dice.** Pedidos describe el estado
*ahora* (histórico completo, con filtros); Métricas mide el periodo elegido. Sin
rotularlo, ver 187 en una pantalla y 67 en la otra parece un fallo de
sincronización cuando ambas son correctas. Las tarjetas de Pedidos llevan pista
—"esperando ahora", "histórico, todo lo entregado"— y las de Métricas van todas
al mismo periodo.

La excepción declarada: el embudo y el desglose por ciudad son históricos, y
ambos lo advierten en su encabezado.

| Bloque | Qué muestra |
|---|---|
| Tarjetas | Todas del periodo elegido: pedidos con variación contra el periodo anterior, entregados, tasa de entrega y valor cobrado. |
| Pedidos por día | Barras con detalle al pasar el cursor. Los días sin pedidos se rellenan con cero: omitirlos comprimiría el tiempo y sugeriría actividad que no hubo. |
| Embudo de estados | Cuántos pedidos han alcanzado cada etapa. |
| Entregas por ciudad | Barra apilada de entregado / en curso / cancelado, con tasa de entrega. |

Las agregaciones salen de dos vistas, `order_daily_stats` y `order_city_stats`,
y no de traerse todas las filas al servidor. Ambas usan `security_invoker`, así
que **siguen aplicando las políticas de `orders_cod`**: sin eso se evaluarían con
los permisos de quien las creó y cualquier usuario autenticado leería agregados
de todos los pedidos. Hay una prueba pgTAP que lo comprueba.

Dos límites que la propia interfaz declara:

- **El embudo se deduce del estado actual**, no del historial, para que también
  cuente los pedidos anteriores a que existiera `order_status_events`. Efecto:
  un pedido cancelado después de salir no cuenta como enviado. Los cancelados se
  muestran aparte.
- **La tasa de entrega se calcula solo sobre pedidos ya resueltos** —entregados
  más cancelados—, no sobre todos. Incluir los que siguen en tránsito la
  hundiría sin motivo: todavía no han fracasado, simplemente no han llegado.
- **Las ciudades las escribe el comprador a mano.** Se agrupan sin distinguir
  mayúsculas, pero los acentos sí separan: "Medellin" y "Medellín" son dos
  ciudades. Resolverlo pediría la extensión `unaccent` y otra migración.

Los colores del desglose por ciudad se validaron con el script de la guía de
visualización contra el fondo oscuro: `#0f9d4f`, `#3b82f6`, `#f43f5e`, **en ese
orden**, porque la comprobación de daltonismo es entre segmentos contiguos. Si
cambias uno, vuelve a pasar el validador.

## CRM

`/admin/crm`. Una ficha **por persona, no por pedido**.

- **`contacts`** se llena sola: un trigger `before insert` sobre `orders_cod`
  busca por correo o celular dentro de la tienda, crea la ficha si no existe y
  la marca como cliente. Vive en la base y no en `createOrder` para que valga
  igual para formulario, chat, voz y cualquier canal futuro.
- **Un prospecto que compra se reutiliza, no se duplica.** Conserva su origen
  (`whatsapp`, `lead`, `manual`) y se completan los huecos sin pisar lo que ya
  haya corregido una persona. Duplicar la ficha partiría su historial en dos.
- **Etapas:** nuevo, por contactar, no contesta, reagendar, cliente, perdido.
- **`next_follow_up`** alimenta la bandeja *Pendientes hoy*, que incluye los
  vencidos: un pendiente de ayer sigue siendo un pendiente. La fecha se compara
  en hora de Colombia, o los pendientes cambiarían de día a las 7 de la tarde.
- **Notas** con autor y fecha. Sin autor no sirven cuando atiende más de una
  persona.
- **Alta manual** de prospectos que aún no compran.

El correo y el celular son únicos por tienda. Es lo que impide dos fichas de la
misma persona; el panel traduce ese error a un mensaje claro.

## Historial de estados

`order_status_events`, escrito por un trigger. **La aplicación no lo escribe**,
así que cubre los tres canales y también los cambios hechos por SQL directo: no
hay forma de mover un pedido sin dejar rastro. Guarda de qué estado a cuál y el
correo de quien lo hizo, o nulo si fue el servidor.

No hay permiso de `update` ni `delete` sobre esa tabla para nadie desde la
aplicación, ni siquiera para un administrador: es un registro, no un campo.

Se ve en la ficha del contacto. **Los datos empiezan a acumularse desde que se
despliegue la migración**: los pedidos anteriores solo muestran su estado actual,
y eso no se puede reconstruir hacia atrás. Esa es la razón de haberlo agregado
antes de que hiciera falta.

## Cómo se propaga un cambio de canal

La landing es estática y lee la configuración cacheada con la etiqueta
`site-channels`. Al guardar, la acción llama `updateTag` y `revalidatePath`.

Se usa `updateTag` y no `revalidateTag` por dos motivos: en Next 16
`revalidateTag` exige un segundo argumento con el perfil de caché, y solo
`updateTag` garantiza que quien acaba de guardar vea su propio cambio en la
respuesta en vez de la versión anterior.

> **Consecuencia práctica:** cambiar `site_channels` **por SQL directo no
> actualiza la landing**, porque nada invalida la etiqueta. Se verá al siguiente
> despliegue. Los cambios se hacen por el panel.

## Verificado

Con Supabase local y `npm run dev`:

| Comprobación | Resultado |
|---|---|
| 84 pruebas pgTAP | En verde |
| `npm run supabase:verify` | En verde |
| `npx tsc --noEmit` y `npm run build` | Sin errores |
| `/admin` sin sesión | Redirige a `/admin/login` |
| `/dashboard` sin sesión | Redirige a `/login` |
| Administrador lee todos los pedidos | 5 de 5 |
| Administrador cambia estado | Correcto |
| Administrador intenta cambiar dirección | `permission denied for table orders_cod` |
| Cliente confirmado | Ve solo su pedido |
| Registro con correo ajeno sin confirmar | Sin sesión y sin lectura |
| Cliente intenta apagar un canal | Cero filas afectadas |
| Chat y voz apagados | Ambos desaparecen de la landing |
| WhatsApp encendido | `wa.me/573001234567` en el HTML |
| Enlace mágico completo | Crea sesión, redirige a `/dashboard` y muestra el pedido correcto |
| Historial de estados | Se escribe solo al crear y al cambiar de estado |
| Contacto del pedido | Creado y vinculado sin huérfanos; el prospecto se reutiliza |
| Vistas de métricas | Agregan bien y conservan RLS |
| `/admin`, `/admin/metricas`, `/admin/crm`, `/admin/ajustes` con sesión real | Renderizan las cuatro, más la ficha de contacto |
| Aislamiento del portal | Un solo pedido, ningún correo ajeno en el HTML |

**Sin verificar:** el envío real del correo por SMTP. El enlace en sí sí se
probó de punta a punta con `npm run access:link`.

## Estado en producción y pendientes de autenticación

Las migraciones del panel y del corte multi-tenant están aplicadas; el historial
remoto está alineado y el acceso de plataforma sobrevivió. `/admin` funciona en
`coffee-maker-pro`. El proyecto separado `nitro-platform` está en Preview y su
promoción depende de un pedido real.

Para el portal del comprador todavía hay que confirmar en el dashboard remoto:

1. **Confirmación de correo.** `enable_confirmations` debe estar activo en
   Authentication → Sign In / Providers. La autorización en base exige
   `email_confirmed_at`, aunque una configuración incorrecta permita crear una
   sesión parcial.
2. **Plantilla del correo del enlace mágico.** Obligatoria, no cosmética.
   Replicar `supabase/templates/magic_link.html` en el dashboard de Supabase,
   Authentication → Email Templates → Magic Link. Con la plantilla por defecto
   **el enlace no crea sesión** (ver abajo).
3. **SMTP propio.** El servidor de correo por defecto de Supabase tiene un
   límite muy bajo y no sirve para clientes reales. El proyecto ya usa Resend
   para las confirmaciones de pedido, así que lo natural es configurarlo también
   como SMTP de autenticación.
4. **URLs de redirección.** El dominio de producción tiene que estar en la lista
   de *Redirect URLs* de Supabase, o el enlace del correo no funcionará.
5. **Administradores de plataforma.** Se siguen creando por terminal; los
   usuarios de clientes sí se crean desde `/platform`.

### Por qué la plantilla no es opcional

La plantilla por defecto de Supabase usa `{{ .ConfirmationURL }}`, que lleva al
endpoint `/auth/v1/verify` y devuelve la sesión **en el fragmento de la URL**,
después de `#`. El navegador nunca envía esa parte al servidor, de modo que con
sesiones gestionadas desde el servidor —que es lo que usa este proyecto, vía
`@supabase/ssr`— el enlace se abre, parece funcionar y no crea ninguna sesión.

La plantilla propia apunta a `/auth/confirm?token_hash={{ .TokenHash }}`, que sí
llega al servidor y se canjea con `verifyOtp`.

## Datos de demostración

Para capturas de pantalla del panel:

```bash
npm run demo:seed
```

Crea unos 187 pedidos repartidos en 90 días, con 8 del día en curso, 60
compradores —algunos con compra repetida— y 10 prospectos del CRM con notas y
pendientes. Las tasas de entrega varían por ciudad a propósito, para que el
desglose por ciudad muestre algo. Volver a ejecutarlo reemplaza la tanda
anterior; `npm run supabase:reset` la borra del todo.

**Solo local.** El script comprueba que Supabase apunte a `127.0.0.1` y trabaja
contra el contenedor, no contra la red: no puede tocar producción. Pedidos
falsos en la base real contaminarían métricas, CRM e historial.

Antes de insertar **borra todo lo que use `@example.com`**: los datos de
desarrollo de `seed.sql` —"Cliente Local", "Pedido en Camino", celulares como
`3000000000`— y los que dejan `supabase:verify` y las pruebas manuales. Se ven
obviamente falsos en una captura y saldrían mezclados con los de demostración.

> Por eso conviene ejecutarlo **al final**, justo antes de las capturas.
> `supabase:verify` vuelve a crear sus filas de prueba cada vez que corre.

Para probar el portal del cliente con estos datos sirve cualquier comprador,
por ejemplo `npm run access:link -- laura.restrepog@gmail.com`.

Desactiva el trigger de límite de frecuencia dentro de su transacción —inserta
de golpe más de 3 pedidos por persona— y lo restablece al terminar.

> Los correos y celulares son inventados con formato real, así que podrían
> coincidir con los de alguna persona. Si la captura se va a publicar, recorta o
> difumina esa columna.

## Probar el portal del cliente en local

`local_smtp` está desactivado en `supabase/config.toml`, así que no hay buzón
donde ver el correo. El enlace se genera directamente:

```bash
npm run access:link -- entregado.local@example.com
```

Solo funciona con correos que tengan un pedido, igual que el portal real.
Correos disponibles en los datos de desarrollo: `cliente.local@`,
`compradora.local@`, `transito.local@`, `entregado.local@` y `cancelado.local@`,
todos en `example.com`, uno por cada estado.

## Dónde se despliega

`/admin` y `/api/v1` ya están en producción en `nitro-platform`, además de seguir
disponibles temporalmente en `coffee-maker-pro` durante la transición. Ambos
apuntan a la misma base, y RLS sigue siendo la frontera de datos. El dueño pidió
probar el pedido directamente en la nueva producción; esa prueba y su
cancelación siguen pendientes.

Las landings externas viven cada una en su repositorio y proyecto Vercel. No
incluyen `/admin`, no comparten cookies con la plataforma y nunca reciben una
clave de Supabase.

## Cómo se conecta una nueva landing

1. Crear cliente, marca, producto y usuario en `/platform`.
2. Emitir una llave de sitio.
3. Copiar `templates/landing` o preparar un diseño externo con
   `npm run landing:prepare -- --target <ruta>`.
4. Configurar `NITRO_API_URL`, `NITRO_SITE_KEY` y el portal en el proyecto
   Vercel de esa landing.
5. Validar en Preview un pedido atribuido al sitio correcto.

La llave resuelve el sitio; no se resuelve por `Host` y la landing nunca comparte
Supabase. Detalle en `LANDING_FACTORY.md` y `PLATFORM.md`.

## Pendiente de decidir

- **Tiempos de operación.** El historial ya se registra, pero no hay página que
  mida cuánto tarda un pedido en cada estado ni dónde se atasca. Quedó fuera del
  alcance a propósito; los datos se están acumulando para cuando se quiera.
- **Etiquetas y segmentos en el CRM.** Descartado por ahora: añade complejidad
  con pocos clientes.
- **Paginación del CRM.** Hoy muestra los primeros 40 y sugiere afinar la
  búsqueda. Con volumen habrá que paginarlo como los pedidos.
- **Alta de administradores desde el panel.** Hoy es solo por terminal, a
  propósito: si el panel pudiera darse permisos a sí mismo, una sesión robada
  bastaría para crear más administradores.
- **Revisión visual en móvil.** El panel tiene tabla en escritorio y tarjetas en
  móvil, pero solo se comprobó el HTML, no el renderizado real.
