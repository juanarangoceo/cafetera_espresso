# Nitro Landing Studio: fábrica de landings

Sistema para convertir material real de un cliente en una landing independiente,
profesional y conectable a Nitro. Coffee Maker Pro fija el nivel de estrategia,
conversión y acabado; **no es la plantilla visual por defecto**.

## Dónde subir el material

La carpeta compartida con Drive es:

```text
/home/juan/nitro-drive/openclaw/clientes/
```

Dentro existe `_PLANTILLA_CLIENTE`. Se copia y se renombra, por ejemplo
`acme-cafe`. Las subcarpetas ayudan a ordenar marca, producto, imágenes, oferta
y legal, pero el generador también acepta archivos sueltos.

La ubicación visible en Google Drive es `openclaw/clientes`. La ruta
`/home/juan/nitro-drive/openclaw/clientes` es únicamente su copia de trabajo en
este servidor. Al ejecutar `landing:new --client`, el comando descarga primero
la versión actual de Drive mediante `rclone`; no tienes que sincronizarla a mano.

El cliente no necesita entrar a Drive ni estar creado previamente en la
plataforma. **Nuevo intake** en `/platform` emite un enlace privado a
`/intake/<token>` usando solo nombre provisional e identificador. También puede
emitirse desde la pestaña **Brief** de un cliente ya creado. El formulario
organiza las cargas en estas mismas subcarpetas y genera `BRIEF.md` e
`intake.json`; después el flujo sigue igual con `landing:new --client`.

No se guardan allí contraseñas, llaves, credenciales ni `.env`. El material es
fuente editorial, no un repositorio público.

## Crear una landing nueva

Desde este repositorio:

```bash
npm run landing:new -- --client acme-cafe --target /home/juan/proyectos/acme-cafe-landing --mode real
```

También puede usarse cualquier carpeta:

```bash
npm run landing:new -- --source /ruta/al/material --target /ruta/al/nuevo-repo --name acme-cafe --mode real
```

El destino debe ser nuevo o estar vacío. El comando:

- crea un proyecto Next.js mínimo y visualmente neutro;
- copia el skill `nitro-landing-studio` para Codex y Claude Code;
- copia los insumos a `_intake/`, que Git ignora;
- omite `.env`, llaves privadas y nombres de archivo con apariencia de secreto;
- genera un inventario de rutas y tamaños sin interpretar el contenido;
- actualiza primero el material desde `gdrive:openclaw/clientes/<cliente>`;
- incluye el checkout seguro de Nitro, cerrado hasta configurar la llave;
- deja documentos para evidencia, brief y dirección creativa.
- crea `PROJECT_CONTEXT.md` y registra la landing en la memoria central.

No instala paquetes, no crea GitHub/Vercel, no genera llaves y no despliega.

Abre el nuevo proyecto con Codex o Claude Code y pide:

> Lee `AGENTS.md` y usa Nitro Landing Studio. Analiza todo `_intake/`, completa
> el brief, la matriz de evidencia y la dirección creativa. Construye en local
> una landing única y profesional para este producto. No copies el diseño de
> Coffee Maker, no inventes datos y no despliegues todavía.

El agente decide narrativa y sistema visual a partir del producto. No existe un
orden fijo de secciones. Antes de entregar debe revisar 375, 768 y 1440 px,
accesibilidad, estados, conversión, evidencia, TypeScript y build.

## Memoria de landings en proceso

`landings/registry.json` es la fuente de verdad operativa y
`docs/LANDINGS_IN_PROGRESS.md` su vista humana. `landing:new` y
`landing:prepare --client` registran automáticamente el proyecto.

```bash
npm run landing:list
npm run landing:show -- acme-cafe
npm run landing:track -- --client acme-cafe --status local_review \
  --next "El dueño revisa por SSH" --port 3100 \
  --blockers "Falta precio real | Falta llave Nitro"
```

Estados permitidos: `intake`, `designing`, `local_review`, `awaiting_client`,
`ready_preview`, `preview`, `ready_production`, `production`, `paused` y
`archived`. Todo agente actualiza estado, próxima acción, URLs y bloqueos al
cambiar de etapa.

## Modo real y modo demo

Una prueba visual se crea con:

```bash
npm run landing:new -- --client producto-prueba --target /ruta/proyecto --mode demo
```

En `demo` se permiten datos simulados solo con autorización expresa. Deben
marcarse como ficticios en la evidencia y junto a la oferta. El usuario puede
recorrer formulario y resumen, pero la confirmación final queda deshabilitada.
`release:check` debe bloquearla.

En `real` no se inventa ningún dato comercial. La publicación exige
`commercialReady: true`, vendedor real, oferta completa y evidencia sin
pendientes.

## Gates

```bash
npm run nitro:check      # secretos, Supabase, BotID y contrato de pedido
npm run landing:check    # Nitro + contenido, imágenes, responsive y accesibilidad estática
npm run release:check    # comercial real + landing:check + TypeScript + build
```

`landing:check` no autoriza publicación. En una demo puede aprobar mientras
`release:check` falla correctamente.

## Ver una landing por SSH

El servidor de desarrollo escucha en loopback. Desde otro terminal del
computador del dueño se abre el túnel usando el mismo host del SSH habitual:

```bash
ssh -L 3100:127.0.0.1:3100 juan@SERVIDOR
```

Después se abre `http://localhost:3100`. Cada landing registra su puerto para no
depender de la memoria de la conversación.

## Política de imágenes

Drive conserva originales. El inventario registra formato, dimensiones, peso,
huella SHA-256 corta y posibles duplicados. El agente copia a `public/` solo los
recursos aprobados, con nombres descriptivos. Imágenes pequeñas y estables se
sirven con `next/image`; videos, archivos pesados o transformaciones dinámicas
se evalúan para Cloudinary. Subir a Cloudinary requiere autorización y nunca
incluye credenciales en el navegador.

## Adaptar una landing que ya tiene diseño

Si ya existe un repositorio Next.js App Router:

```bash
npm run landing:prepare -- --target /ruta/al/repo --client acme-cafe
```

O con una fuente libre:

```bash
npm run landing:prepare -- --target /ruta/al/repo --source /ruta/al/material
```

El adaptador conserva el proyecto y agrega instrucciones, documentos, skill,
verificador y contrato Nitro. No reemplaza automáticamente la UI existente. El
agente conserva lo bueno, corrige lo que no supere los gates y conecta el
formulario al núcleo seguro.

## Qué conecta la landing con el cliente

```text
landing independiente
  Server Action + BotID
        │
        │ NITRO_SITE_KEY secreta y distinta por sitio
        ▼
Nitro /api/v1
  sitio → producto → pedidos del cliente
```

La asociación no depende del dominio ni del usuario. La llave identifica el
`site_id`. El usuario del cliente vive en `site_members` y entra a `/admin`; el
superadmin administra clientes en `/platform`.

Variables de la landing:

```env
NITRO_API_URL=https://nitro-platform-mauve.vercel.app
NITRO_SITE_KEY=nl_live_...
NEXT_PUBLIC_NITRO_PORTAL_URL=https://nitro-platform-mauve.vercel.app/login
```

La landing nunca recibe Supabase. `NITRO_SITE_KEY` nunca lleva `NEXT_PUBLIC_`.

## Alta y publicación

Cuando el diseño local esté aprobado:

1. Si usaste un intake independiente, conviértelo desde `/platform`; si no,
   crea cliente, sitio y producto manualmente. Completa usuario y branding.
2. Emite la llave del sitio y guárdala directamente en variables de Preview.
3. Configura las otras variables sin escribir valores reales en el repo.
4. Ejecuta `npm run release:check`.
5. Con autorización explícita, despliega Preview.
6. Haz un pedido real y confirma que cae en el cliente correcto.
7. Comprueba que otro cliente no puede verlo y cancela el pedido de prueba.
8. Con autorización explícita, promueve ese artefacto a producción y conecta dominio.

## Límites actuales

- Starter y adaptador automatizados: Next.js App Router.
- Un producto activo por sitio en la experiencia actual.
- Vercel, GitHub, DNS y secretos siguen siendo acciones separadas y autorizadas.
- Resend sigue aplazado; los pedidos se guardan sin correo cuando no está configurado.
- Chat y voz pueden añadirse después; también deben resumir y pedir confirmación.
