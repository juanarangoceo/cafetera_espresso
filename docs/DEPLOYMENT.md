# Despliegue

**Última actualización: 20 de agosto de 2026.**

## Infraestructura

| | |
|---|---|
| Producción | `https://coffee-maker-pro.vercel.app` |
| Proyecto Vercel | `coffee-maker-pro` (equipo `seller360grados-projects`) |
| Plataforma separada | `https://nitro-platform-seller360grados-projects.vercel.app` — producción `READY` |
| Runtime | Node.js 24.x |
| Supabase | `coffee-maker-pro`, ref `rsqcumtozynvzsctvmpk`, `us-east-1`, Postgres 17 |
| Dominio propio | `coffeemakerprofesional.com` — **asignado pero sin DNS** |

Requiere Vercel CLI **58.5.1 o superior**. Las versiones anteriores no pueden
escribir variables de entorno de Preview en modo no interactivo: devuelven
`action_required` en bucle.

## Variables de entorno

| Variable | Production | Preview | Development |
|---|:--:|:--:|:--:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | ✓ | ✓ |
| `SUPABASE_SECRET_KEY` | ✓ | ✓ | — |
| `OPENAI_API_KEY` | ✓ | ✓ | — |
| `GEMINI_API_KEY` | ✓ | ✓ | — |
| `RESEND_API_KEY` | ✓ | ✓ | ✓ |

Ninguna otra variable es necesaria. Las de Sanity y Shopify se eliminaron.

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

Nunca directo a producción. Siempre esta secuencia:

**1. Verificar en local**

```bash
npx tsc --noEmit
npm run build
npm run supabase:test      # si tocaste la base
npm run supabase:verify    # si tocaste la base
```

**2. Desplegar Preview**

```bash
vercel deploy --yes
```

La protección depende del proyecto. Las Previews de `coffee-maker-pro` pueden
redirigir al SSO del equipo. En `nitro-platform`, Vercel Authentication está
desactivada deliberadamente para que las landings externas puedan consumir la
API y para permitir la prueba pública del checkout; la protección del panel y
de la API depende del login de Supabase y de las llaves de sitio.

**3. Probar un pedido real en la Preview**

No es opcional. Es la única forma de comprobar que BotID no bloquea compradores
legítimos y que la escritura con `SUPABASE_SECRET_KEY` funciona. Un fallo aquí
es invisible hasta que un cliente lo sufre.

Verificar también, según el cambio: correo de confirmación, registro y login,
aislamiento de pedidos en el dashboard, Marco por voz y chat escrito.

**4. Promover a producción el artefacto probado**

```bash
vercel promote <url-de-preview>
```

**5. Confirmar**

```bash
vercel inspect <url> | grep -iE "status|target"
curl -s -o /dev/null -w "%{http_code}\n" https://coffee-maker-pro.vercel.app
```

**6. Limpiar los pedidos de prueba** de `orders_cod` antes de dejarlo operando.

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

**No reaplicar ni volver a alinear estas versiones.** El historial estuvo
desalineado porque dos migraciones se aplicaron por API con timestamps remotos,
pero quedó corregido el 20 de agosto de 2026. Las siete versiones remotas
coinciden ahora con los nombres locales. Para una migración nueva se sigue el
procedimiento de cinco pasos de esta sección. La octava migración se aplicó y
alineó el 20 de agosto de 2026; dejó un cliente, un sitio y cero sitios
huérfanos, y retiró `platform_admins` de `accessible_site_ids()`.

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

5. **Promoción — completada con excepción autorizada.** El dueño pidió probar
   directamente en producción, así que el 20 de agosto de 2026 se promovió la
   Preview anterior. La producción quedó después bajo despliegue automático
   desde `main` y está `READY`; `/` responde 200, `/admin` redirige a login, el
   login responde 200 y la API responde 401 con llave falsa. Falta hacer el
   pedido real en producción y cancelarlo. No usar esta excepción como
   precedente para despliegues futuros.

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

## Reversión

```bash
vercel ls coffee-maker-pro --prod          # listar despliegues
vercel promote <url-de-un-despliegue-previo>
```

Las migraciones de base **no se revierten solas**. Cualquier cambio de esquema
necesita su propia migración inversa, escrita y probada en local.
