# Despliegue

**Última actualización: 25 de agosto de 2026.**

## Infraestructura

| | |
|---|---|
| Runtime | Node.js 24.x |
| Supabase | `coffee-maker-pro`, ref `rsqcumtozynvzsctvmpk`, `us-east-1`, Postgres 17 |
| Equipo Vercel | `seller360grados-projects` |
| Dominio propio | `coffeemakerprofesional.com` — **asignado pero sin DNS** |

### Este repositorio despliega a DOS proyectos de Vercel

No es una copia de respaldo: son dos despliegues vivos del mismo código, con
públicos distintos. Desplegar a uno solo deja el sistema inconsistente.

| Proyecto | ID | Sirve | URL |
|---|---|---|---|
| `coffee-maker-pro` | `prj_ylahVICH8t4tKHBOTwaBecjM2Ksm` | La landing que vende + `/admin` + `/platform` | `coffee-maker-pro.vercel.app` |
| `nitro-platform` | `prj_Yo7IRWkIeKqnBWICyA65s0OA7Gcf` | La API `/api/v1` que llaman **todas** las landings de cliente, y el panel al que entran | `nitro-platform-mauve.vercel.app` |

`.vercel/project.json` enlaza el repositorio a `coffee-maker-pro`, así que
`vercel deploy --prod` a secas actualiza **solo ese**. Las landings de cliente
apuntan por `NITRO_API_URL` a `nitro-platform`, que se queda con el código viejo.

El 25 de agosto de 2026 esto pasó de verdad: se desplegó el panel nuevo, se
verificó en `coffee-maker-pro.vercel.app` y pareció correcto, mientras
`nitro-platform-mauve.vercel.app/admin/cuenta` devolvía 404 al cliente.

Para desplegar al segundo, sin desenlazar el repositorio:

```bash
VERCEL_ORG_ID=team_CmYLrlLBZUveo9wuFhaJ2rOy \
VERCEL_PROJECT_ID=prj_Yo7IRWkIeKqnBWICyA65s0OA7Gcf \
npx vercel deploy --prod --yes
```

Y comprueba **los dos** hosts después, no uno:

```bash
for h in https://coffee-maker-pro.vercel.app https://nitro-platform-mauve.vercel.app; do
  curl -s -o /dev/null -w "$h %{http_code}\n" -L "$h/admin"
done
```

Requiere Vercel CLI **58.5.1 o superior**. Las versiones anteriores no pueden
escribir variables de entorno de Preview en modo no interactivo: devuelven
`action_required` en bucle.

## Variables de entorno

`NITRO_BOT_INTEGRATION_SECRET` autoriza la API interna que consume Nitro Bot
(`/api/internal/v1/*`, ver `PLATFORM.md`). Va en **los dos** proyectos, como todo
lo demás: el bot llama a `nitro-platform`, pero el código es el mismo y una
variable presente en uno solo es justo el tipo de inconsistencia que costó el
incidente del 25 de agosto.

| Variable | Production | Preview | Development |
|---|:--:|:--:|:--:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | ✓ | ✓ |
| `SUPABASE_SECRET_KEY` | ✓ | ✓ | ✓ |
| `OPENAI_API_KEY` | ✓ | ✓ | — |
| `GEMINI_API_KEY` | ✓ | ✓ | — |
| `RESEND_API_KEY` | ✓ | ✓ | ✓ |

Nitro Intake conserva el material en el bucket privado `nitro-intake`; no
requiere variables ni credenciales de Google Drive. Tras verificar el flujo
completo en Preview, las tres variables antiguas de Drive se retiraron de
Preview y Production en `nitro-platform`. Las variables de Sanity y Shopify
siguen eliminadas.

**Agregar una variable:**

```bash
vercel env add NOMBRE production --value <valor> --yes
vercel env add NOMBRE preview    --value <valor> --yes
```

Para secretos, prefiere el dashboard de Vercel: el valor no queda en el
historial del terminal ni en una conversación con un agente.

> Los cambios de variables **no aplican a despliegues ya construidos**. Después
> de agregar o modificar una, hay que redesplegar.

## Procedimiento de despliegue

El objetivo es **un solo build local y cero builds remotos de Vercel** siempre
que el proyecto sea compatible con artefactos preconstruidos. Preview deja de
ser un paso obligatorio: se usa para colaboración o revisión visual, no como
ritual de cada release.

Vercel distingue dos promociones: promover una Preview puede reconstruir con
variables de producción; promover un deployment de producción staged solo
asigna dominios y no reconstruye. Sin embargo, `--skip-domain` evita la
asignación automática de dominios propios, no garantiza conservar los aliases
`vercel.app` del proyecto. Se comprobó con CLI 58.5.1 que los aliases de Nitro
se movieron inmediatamente. El flujo económico siempre usa `vercel build
--prod` y `--prebuilt`; staging solo se considera una barrera previa cuando hay
un dominio propio estable.

### Reglas que siempre aplican

1. Producción requiere autorización explícita en la conversación actual.
2. Resuelve el proyecto y el target antes de desplegar; nunca permitas auto-link
   hacia un proyecto ambiguo.
3. Ejecuta TypeScript y pruebas proporcionales al cambio. Cambios amplios pasan
   además `npm run build`.
4. La compilación final se hace con configuración de producción. `vercel pull`
   puede crear `.vercel/.env.production.local`: está ignorado y nunca se lee,
   imprime, copia o sube.
5. Después del release verifica rutas tocadas, errores de runtime y target.
   Conserva el deployment anterior como rollback inmediato.
6. No uses `--force` salvo diagnóstico explícito y no publiques firewall.
7. **Despliega a los dos proyectos.** Un cambio en la aplicación tiene que
   llegar a `coffee-maker-pro` y a `nitro-platform`. Ver la tabla de
   infraestructura: el enlace del repositorio solo cubre el primero.
8. **Una migración que añade columnas necesita su `grant`.** Los permisos son
   por columna; una consulta que pida una columna sin conceder falla entera.
   Después de aplicar en producción, comprueba como `authenticated` que las
   consultas del panel siguen corriendo, no solo que el build pasa.

### Clasificación por riesgo

| Nivel | Ejemplos | Ruta | Prueba remota |
|---|---|---|---|
| **R0 · Sin runtime** | Documentación, comentarios, registro operativo | No desplegar | Ninguna |
| **R1 · Bajo** | Copy, imágenes, CSS, responsive, accesibilidad o UI estática sin tocar autenticación, datos, checkout, API ni variables | Producción directa preconstruida | HTTP, contenido, consola y rutas visibles afectadas |
| **R2 · Funcional** | Componentes interactivos, panel o Server Actions reversibles sin migración, autorización ni escritura crítica | Staged preconstruido si hay dominio propio; si no, producción directa con rollback | Solo flujos modificados |
| **R3 · Crítico** | Migraciones, RLS, autenticación, membresía de clientes, Intake/Storage, llaves, variables, pedidos, precio, BotID, consentimiento, aislamiento o routing | Plan compatible hacia atrás; staged solo con dominio propio estable | Pruebas locales completas y transacción remota solo del flujo afectado |

Un pedido real **no se repite en cada despliegue**. Es obligatorio únicamente:

- en la primera activación comercial de una landing;
- si cambia creación o persistencia de pedidos;
- si cambian precio, producto activo, BotID, consentimiento, llave del sitio o
  aislamiento multi-inquilino;
- si una migración o variable puede alterar el checkout.

Crear un cliente, aceptar términos, subir un Intake, probar login, correo, chat
o voz solo se repite cuando ese flujo fue modificado o depende directamente del
cambio. Toda prueba que cree datos se etiqueta, verifica y limpia.

### Preparar un único artefacto local

Usa Vercel CLI 58.5.1 o superior. No agregues el CLI al proyecto solo para un
release; puede ejecutarse con una versión fijada:

```bash
npx tsc --noEmit
npm run build                         # cambios amplios
npm run supabase:test                 # si tocaste base de datos
npm run supabase:verify               # si tocaste base de datos

npx --yes vercel@58.5.1 pull --yes --environment=production
npx --yes vercel@58.5.1 build --prod
```

`vercel build --prod` genera `.vercel/output`. No inspecciones archivos `.env*`.
Si el proyecto depende durante el build de variables reservadas como
`VERCEL_URL`, del branch de Git o de Skew Protection sin ID personalizado, no
uses `--prebuilt` hasta adaptar esa dependencia; documenta la excepción y usa
un build remoto único.

### R1: producción directa desde local

Solo con autorización explícita y cuando la clasificación R1 sea inequívoca:

```bash
npx --yes vercel@58.5.1 deploy --prebuilt --prod --yes --archive=tgz
```

Verifica inmediatamente el dominio canónico, las rutas modificadas y logs. Si
falla, ejecuta rollback al deployment anterior. Este camino no crea Preview ni
consume un build remoto.

### R2/R3: staging cuando existe dominio propio

Sube exactamente el mismo artefacto con variables de producción, pero sin
asignarlo todavía al dominio propio:

```bash
npx --yes vercel@58.5.1 deploy --prebuilt --prod --skip-domain --yes --archive=tgz
npx --yes vercel@58.5.1 inspect <url-staged>
npx --yes vercel@58.5.1 curl / --deployment <url-staged>
```

Ejecuta únicamente los smoke tests y transacciones que corresponden al cambio.
Cuando pasen y exista autorización para hacer público el artefacto:

```bash
npx --yes vercel@58.5.1 promote <url-staged> --yes
```

Como el artefacto ya tiene target de producción, esta promoción solo asigna
dominios y no genera otro build. No promociones una Preview si el objetivo es
ahorrar builds: Vercel puede reconstruirla con variables de producción.

Inspecciona los aliases inmediatamente después de `deploy`. Los dominios
generados por Vercel pueden moverse pese a `--skip-domain`. Si el proyecto no
tiene dominio propio —caso actual de `nitro-platform`— no lo llames staged:
usa migraciones expand/contract cuando haya base de datos, ejecuta toda prueba
posible antes del upload, despliega el artefacto preconstruido directamente y
mantén identificado el deployment anterior para rollback. Esto sigue usando
cero builds remotos.

### Preview de diseño opcional

Para mostrar una landing incompleta al cliente puedes usar un proyecto Preview
con `NITRO_REVIEW_MODE=true`, sin `NITRO_SITE_KEY`, y ejecutar antes
`npm run landing:review:check -- <cliente>`. Es colaboración visual, no un
requisito previo para releases rutinarios.

La protección depende del proyecto. Usa `vercel curl` para comprobar URLs
protegidas; no desactives protección solo para automatizar una prueba.

### Activar la puerta legal sin bloquear clientes por error

La migración `20260825023133_add_client_legal_acceptance.sql` crea las tablas,
triggers y función de publicación. Después de aplicarla y **antes** de desplegar
la UI que exige aceptación, publica en `/platform` una versión revisada de los
dos tipos de documento. Si falta uno, `/admin` queda cerrado de forma segura.
Comprueba con un usuario de cliente la aceptación y después verifica la evidencia
en la pestaña **Términos** del superadmin.

### Confirmación posterior

```bash
npx --yes vercel@58.5.1 inspect <url> | grep -iE "status|target"
curl -s -o /dev/null -w "%{http_code}\n" https://coffee-maker-pro.vercel.app
```

Revisa logs de error del entorno de producción y limpia exclusivamente los
datos temporales creados por la prueba. No conviertas el smoke posterior en una
repetición indiscriminada de todos los flujos.

## Migraciones en producción

`supabase link` pide la contraseña de la base por prompt interactivo y no
funciona en modo agente. El procedimiento que sí funciona:

1. Crear la migración en `supabase/migrations/`.
2. Probar en local: `npm run supabase:reset && npm run supabase:test && npm run supabase:verify`.
3. Aplicar al proyecto remoto por la API de Supabase.
4. **Alinear el historial**: la API genera su propio timestamp. Corregirlo para que coincida con el nombre del archivo local, o un `db push` futuro intentará reaplicar el esquema y fallará.

```sql
update supabase_migrations.schema_migrations
set version = '<version_del_archivo_local>'
where name = '<nombre_de_la_migracion>';
```

5. Correr los advisors de seguridad.

Migraciones aplicadas:

| Versión local | Versión remota | Qué hace |
|---|---|---|
| `20260803194208` | igual | Esquema inicial, RLS y grants |
| `20260804203000` | igual | Trigger de límite de pedidos |
| `20260804205500` | igual | Cierra la escritura anónima de pedidos |
| `20260805120000` | igual | Sitios, canales y panel |
| `20260805180000` | igual | CRM, historial de estados y métricas |
| `20260820120000` | igual | Frontera multi-inquilino, precio por sitio y llaves |
| `20260820140000` | igual | `leads` por sitio |
| `20260820200341` | igual | Separa central corporativa de operación; crea `clients` |
| `20260820224848` | igual | Nitro Intake: solicitudes privadas, borradores e inventario de archivos |
| `20260821020920` | igual | Intake antes del alta y enlace posterior con cliente y sitio |
| `20260821135005` | igual | Conserva los archivos de Intake en Supabase Storage y retira Google Drive |
| `20260825023133` | igual | Documentos jurídicos versionados y evidencia inmutable por cliente |
| `20260825031017` | igual | Índice de evidencia legal por usuario autenticado |
| `20260825134420` | igual | Membresía corporativa compatible con la versión anterior |
| `20260825150000` | igual | Retira la membresía antigua por landing tras publicar el código nuevo |
| `20260825152414` | igual | Permite reconocer una cuenta corporativa antes de su primera landing |

**No reaplicar ni volver a alinear estas versiones.** El historial estuvo
desalineado porque varias migraciones se aplicaron por API con timestamps
remotos. Las dieciséis versiones remotas coinciden ahora con los nombres locales;
las tres de Nitro Intake se aplicaron y alinearon el 21 de agosto de 2026. Para
una migración nueva se sigue el procedimiento de cinco pasos de esta sección.
La octava migración dejó un cliente, un sitio y cero sitios huérfanos, y retiró
`platform_admins` de `accessible_site_ids()`.

### Membresía corporativa e Intake — 25 de agosto de 2026

- Migraciones `20260825134420` y `20260825150000` aplicadas en dos fases y
  alineadas con el historial local. La primera mantuvo compatibilidad con
  `site_members`; la segunda la retiró después del release.
- TypeScript, build, 183 pruebas de base y verificación local de aislamiento
  pasaron.
- Producción `READY`: `https://nitro-platform-l6e3z0xtx-seller360grados-projects.vercel.app`
  (`dpl_D2HxgpRQPHCN4cukuEvuEsL62R4k`), con ambos aliases del proyecto.
- `/` responde 200, `/admin` y `/platform` redirigen al login y una llave falsa
  de sitio recibe 401.
- La prueba remota creó una ficha de cliente sin landing, agregó dos landings a
  una única membresía y revirtió la transacción. Intake preparó, subió, confirmó
  y eliminó un archivo real con respuestas 200; no quedaron datos temporales.
- Se corrigieron `NEXT_PUBLIC_SUPABASE_URL` y la llave pública de Supabase en
  Production de `nitro-platform`; no se leyó ni modificó la llave secreta.

### Despliegue de la puerta legal — 25 de agosto de 2026

- Migraciones `20260825023133` y `20260825031017` aplicadas en Supabase remoto
  y alineadas con los nombres locales.
- Los dos documentos `2026-08` fueron publicados después de la autorización del
  responsable. Una cuenta real de cliente aceptó ambos y las dos evidencias
  conservaron la versión y SHA-256 publicados.
- Preview `READY`: `https://nitro-platform-miyfesjb3-seller360grados-projects.vercel.app`
  (`dpl_3XNoQ3PT4msb67YvTD6pwbnhRvBA`).
- `/` y `/admin/login` responden 200; `/platform` redirige al login y una llave
  falsa en `/api/v1/site` recibe 401.
- La Preview creó un pedido real por $490.000 en el sitio y producto correctos.
  Se cambió de `pending` a `cancelled`, se comprobó el evento y se eliminaron
  exclusivamente el pedido y sus dos eventos; el contacto existente se
  conservó y no quedaron residuos de la prueba.
- Producción `READY`: `https://nitro-platform-d9fccczay-seller360grados-projects.vercel.app`
  (`dpl_BxVVRmHAvs7x75MqL26nTb5kmB13`), con alias canónico
  `https://nitro-platform-seller360grados-projects.vercel.app`.
- Tras el despliegue, `/` y `/admin/login` respondieron 200, `/platform`
  redirigió al login y `/api/v1/site` rechazó una llave falsa con 401.

## Separación entre `/platform` y `/admin`

- `/platform` es la central corporativa: clientes, landings, marca, repositorio,
  proyecto Vercel, usuarios, llaves, onboarding y facturación.
- `/admin` es el panel operativo del cliente: pedidos, métricas, CRM y canales.
- El login es común en `/admin/login` y redirige según el rol.
- La sesión de plataforma no puede leer tablas operativas por RLS. La central
  usa `SUPABASE_SECRET_KEY` únicamente después de `requirePlatformAdmin()` y
  solo devuelve datos corporativos.

## Estado del corte multi-inquilino (20 de agosto de 2026)

Hecho:

- Historial de migraciones alineado. Las siete versiones remotas coinciden ya
  con el nombre del archivo local.
- `20260820120000` y `20260820140000` aplicadas a producción. Comprobado
  inmediatamente después: `juanarangopm@gmail.com` sobrevivió a
  `platform_admins`, el pedido existente quedó con producto asignado y el
  precio de Coffee Maker sigue en 490.000.
- Código desplegado a producción en `coffee-maker-pro`. `/admin` volvió a
  responder y `/api/v1/*` rechaza sin credencial.
- Proyecto `nitro-platform` creado, con las dos variables públicas y
  `SUPABASE_SECRET_KEY` en Preview y Production.

**Revisión de cierre (20 de agosto de 2026):**

1. **`SUPABASE_SECRET_KEY` — resuelto.** Existe como *Sensitive* en Preview y
   Production. Nunca intentar extraerla ni copiarla a una landing.

2. **Vercel Authentication — resuelto.** `ssoProtection` quedó desactivado. La
   protección real la ponen el login del panel y las llaves de sitio.

3. **Configuración y despliegue — corregidos.** El proyecto se había creado con
   `Framework Preset: Other` y su despliegue de producción estaba vacío, por lo
   que respondía 404 aunque Vercel lo mostraba como `READY`. El preset ya es
   `Next.js` y la Preview candidata a producción es
   `https://nitro-platform-75226gqgj-seller360grados-projects.vercel.app`
   (deployment `dpl_8ddFaHxUP7UbqemvDYFqqfhz1Ysu`):
   `/` responde 200, `/admin` redirige a `/admin/login`, el login responde 200 y
   `/api/v1/*` rechaza sin llave con 401. Las dos variables públicas de Supabase
   están también en Preview.

4. **Correo — aplazado por el dueño.** `nitro-platform` no lleva
   `RESEND_API_KEY` por ahora. `sendOrderConfirmationEmail()` lo trata como una
   función deshabilitada: omite el envío y no convierte un pedido guardado en
   error. Cuando se active, se añade la variable y se vuelve a probar aparte.

5. **Promoción — completada y revalidada.** El dueño pidió probar
   directamente en producción, así que el 20 de agosto de 2026 se promovió la
   Preview anterior. La producción quedó después bajo despliegue automático
   desde `main` y está `READY`; `/` responde 200, `/admin` redirige a login, el
   login responde 200 y la API responde 401 con llave falsa. El 21 de agosto,
   Nitro Intake siguió el flujo obligatorio Preview → pedido real → producción.
   Ya en producción se repitieron un Intake mínimo y un pedido real; el pedido
   se canceló y todos los datos temporales se limpiaron.

6. **Dominio.** `nitro-platform.vercel.app` pertenece a otra cuenta. Los dos
   aliases asignados a este proyecto responden 200:
   `nitro-platform-seller360grados-projects.vercel.app` (canónico documentado) y
   `nitro-platform-mauve.vercel.app`. Falta conectar un dominio propio.

7. **Git — conectado.** `nitro-platform` está enlazado a GitHub
   `juanarangoceo/cafetera_espresso`, Production Branch `main`, Root Directory
   `.` y despliegues automáticos habilitados. El salto multi-tenant entró a
   `main` mediante el PR #4 (`edfc528`); no existe ya una divergencia entre el
   código desplegado por CLI y el repositorio.

## Separar el panel a su propio proyecto

El panel y la landing de Coffee Maker comparten despliegue. Mientras siga así,
un cliente entra a su panel por el dominio de otra tienda.

El orden importa, porque la landing de Coffee Maker está vendiendo:

1. **Crear el proyecto `nitro-platform`** en Vercel desde este mismo
   repositorio, con `SUPABASE_SECRET_KEY` y las variables de Supabase. Es
   aditivo: no toca `coffee-maker-pro`.
2. **Apuntar las landings de cliente** a su URL con `NITRO_API_URL`.
3. **Mover la landing de Coffee Maker** a su propio repositorio desde
   `templates/landing`, con su llave, y verificar un pedido real.
4. **Solo entonces** trasladar el dominio y retirar `/admin` del proyecto viejo.

Los pasos 3 y 4 mueven un dominio en producción: no se hacen sin autorización
explícita del dueño en la conversación.

## Firewall

Dos reglas de rate limiting **en borrador y en modo `log`**. No bloquean nada
todavía.

```bash
vercel firewall diff       # ver pendientes
vercel firewall publish    # publicar — decisión del dueño, no de un agente
```

Antes de publicar, revisar el tráfico real en el dashboard y confirmar que solo
matchea lo que debe.

## Pendiente: el dominio

`coffeemakerprofesional.com` está asignado al proyecto en Vercel (apex y www)
pero **no resuelve**: sin registros A ni NS.

```
Intended Nameservers    Current Nameservers
ns1.vercel-dns.com      -                    ✘
ns2.vercel-dns.com      -                    ✘
```

Se arregla en el registrador, no en Vercel. Primero confirmar si el dominio
venció — aparece sin fecha de expiración y sin nameservers delegados. Luego:

- **Opción A (recomendada):** registro `A coffeemakerprofesional.com → 76.76.21.21`
- **Opción B:** cambiar nameservers a `ns1.vercel-dns.com` / `ns2.vercel-dns.com`

Vercel verifica solo y emite el certificado.

Esto importa más de lo que parece: para pauta paga, una URL `*.vercel.app`
genera desconfianza en contraentrega, y las plataformas de anuncios requieren
dominio verificado para optimizar por conversión.

## Release Meta Pixel multi-tenant — 26 de agosto de 2026

- Riesgo **R3**: migración, RLS, consentimiento, checkout y aislamiento por
  sitio. Sin dominio propio estable para Nitro, se usó migración compatible y
  producción directa con rollback identificado.
- `20260826191633_add_site_tracking_settings.sql` quedó aplicada y alineada con
  el historial remoto. Dos sitios y dos filas de tracking, cero faltantes, RLS
  activo, tres políticas y grants exactos de tres columnas de lectura y dos de
  actualización.
- Los asesores no reportaron hallazgos nuevos por `site_tracking`. Permanecen
  avisos anteriores de Auth, tablas deliberadamente cerradas y políticas
  permisivas duplicadas.
- Los builds preconstruidos iniciales no podían incorporar secretos marcados
  como Sensitive: `vercel pull` entregó configuración protegida y los
  artefactos no apuntaron al entorno productivo correcto. Se ejecutó rollback
  inmediato y se aplicó la excepción documentada de un build remoto único por
  proyecto, sin `--force` y sin tocar firewall.
- Deployments finales `READY`: Nitro Platform
  `dpl_G1MHM5zaRJtAUW2kGw7keYEtXjf9`, Coffee Maker
  `dpl_68SSZiMiT8dSTkJFK4fVWEZVeK9g` y Lulla Bites
  `dpl_H9JrqAcoWNdWr39jcPksaavme5z4`.
- Coffee Maker verificó en navegador: cero scripts antes de consentir,
  `PageView`/`ViewContent` después de aceptar y retiro del script y globales al
  rechazar. Lulla quedó con checkout real y cero solicitudes Meta mientras su
  Pixel siga sin configurar.
- BotID bloqueó correctamente el intento automatizado desde navegador. La
  transacción remota equivalente creó un pedido Lulla por 250 GTQ en el sitio y
  producto correctos, lo canceló, comprobó dos eventos y limpió pedido,
  contacto, eventos y llave temporal. Cero residuos y una sola llave permanente
  activa.
- Los alias canónicos responden 200, `/admin/ajustes` redirige a login, una
  llave falsa recibe 401 y no hay errores de runtime en los tres deployments
  finales.

## Reversión

```bash
vercel ls coffee-maker-pro --prod          # listar despliegues
vercel promote <url-de-un-despliegue-previo>
```

Las migraciones de base **no se revierten solas**. Cualquier cambio de esquema
necesita su propia migración inversa, escrita y probada en local.
