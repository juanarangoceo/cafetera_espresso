# Coffee Maker Pro — estado del proyecto

**Última actualización: 21 de agosto de 2026.**

Permite retomar el trabajo en una sesión nueva con Codex o Claude Code sin
depender del historial de conversación.

| Documento | Contenido |
|---|---|
| `../AGENTS.md` | Reglas de trabajo. Léelo primero. |
| `ARCHITECTURE.md` | Cómo encaja el sistema y mapa de archivos. |
| `SECURITY.md` | Capas antiabuso, RLS y manejo de claves. |
| `DEPLOYMENT.md` | Infraestructura, variables y procedimiento de despliegue. |
| `SUPABASE_LOCAL.md` | Entorno local de base de datos. |
| `marco-voice-agent.md` | Asistente de voz. |
| `ADMIN_DASHBOARD.md` | Panel de operación, acceso y canales conmutables. |
| `PLATFORM.md` | Frontera multi-tenant, sitios, usuarios y llaves. |
| `LANDING_FACTORY.md` | Crear o adaptar landings independientes. |
| `LANDINGS_IN_PROGRESS.md` | Landings activas, modo, ruta, puerto, bloqueos y próxima acción. |

## 1. Estado

Desde el 4 de agosto de 2026 en `https://coffee-maker-pro.vercel.app`, con
pedidos reales habilitados.

La plataforma multi-tenant ya está aplicada y desplegada también en el proyecto
Vercel separado `nitro-platform`, configurado como Next.js y sin Vercel
Authentication. Producción estable:
`https://nitro-platform-seller360grados-projects.vercel.app`. Nitro Intake se
fusionó mediante el PR #5 y quedó desplegado en producción el 21 de agosto de
2026; las pruebas reales de Intake y pedido fueron completadas y limpiadas.

El proyecto está conectado a `juanarangoceo/cafetera_espresso`, rama de
producción `main` y raíz `.`. El corte multi-tenant se fusionó mediante el PR #4
y Nitro Intake mediante el PR #5; los pushes futuros a `main` despliegan
automáticamente `nitro-platform`.

La interfaz tiene dos productos separados: `/platform` es la central
corporativa de Nitro y `/admin` es la operación exclusiva de cada cliente. Un
administrador de plataforma no puede leer pedidos, CRM, contactos, direcciones
ni métricas operativas mediante su sesión; esa restricción vive en RLS.

**Verificado ese día:**

- `npx tsc --noEmit` correcto
- `npm run build` correcto, con validación de tipos activa
- 158 pruebas pgTAP y `supabase:verify` en verde
- Advisors de seguridad de Supabase sin hallazgos
- Pedido real de extremo a extremo confirmado en Preview
- `orders_cod` en cero pedidos reales

**Único pendiente para operar de cara al público:** el dominio
`coffeemakerprofesional.com` no resuelve. Detalle y solución en `DEPLOYMENT.md`.

## 2. Producto

Kit Coffee Maker Pro por **$490.000 COP**: cafetera, accesorios, molino
eléctrico y guía digital. Envío gratis en Colombia, pago contraentrega, entrega
en 2 a 5 días hábiles, 3 meses de garantía por funcionamiento y derecho de
retracto de 5 días hábiles. Soporte: `coffeemakerpro@gmail.com`.

Vendedor: Juan David Arango, C.C. 1.088.018.943, régimen simplificado, Bogotá.

Todo eso vive en `src/lib/product.ts` y de ahí lo consumen landing, asistentes,
checkout, FAQ y políticas. **No duplicar en componentes.** El mismo precio vive
en `site_products` para el cobro; cambiarlo exige una migración que mantenga
ambas fuentes alineadas y pruebe el trigger por sitio.

La narrativa prioriza espresso en casa, facilidad para principiantes, ahorro
frente a comprar café fuera y kit completo. Tono consultivo, sin urgencia
artificial ni escasez fabricada.

## 3. La landing

Once secciones, en este orden:

1. Hero
2. Barra de confianza
3. Beneficios y video
4. **Ahorro** — comparación recibo/cocina
5. Recetas
6. Tres pasos
7. Galería y ficha técnica
8. Testimonios
9. El kit completo
10. Precio y checkout
11. FAQ

La sección de ahorro estaba en posición 9 y se subió a la 4: es el argumento
más fuerte para un producto de $490.000 y quedaba enterrado tras seis secciones.

Su lado izquierdo es un recibo —el artefacto de quien alquila su café— y el
derecho responde con la lógica contraria: pagas una vez y la máquina es tuya.
El número protagonista es **"3 meses"** (cuánto tarda en pagarse solo), no un
monto: no exige comparar contra nada. Las cifras están redondeadas a favor del
cliente ($164.666 → $164.000; 2,98 meses → 3; 4,8× → casi 5 veces).

Paleta café/dorado, `font-serif` en títulos, ritmo `py-20 md:py-28`, alternancia
de fondos claro/oscuro. No rehacer el diseño sin solicitud explícita.

## 4. Historial de decisiones

**Eliminados:** Sanity, blog, Shopify (`@shopify/checkout-sheet-kit`,
`shopify-buy`, `src/utils/shopify.ts`). El paquete de checkout era de React
Native y arrastraba `react-native` completo a un proyecto web: de ahí salían la
vulnerabilidad crítica y unas diez altas. `react-email` pasó a `devDependencies`
por ser solo el servidor de preview local.

**Imágenes de producto migradas** del CDN de una tienda Shopify externa a
`/public/product/`. Los archivos son JPEG aunque Shopify los servía con
extensión `.webp`; se renombraron para que el `Content-Type` sea correcto.

**`ignoreBuildErrors` eliminado** de `next.config.mjs`. El build ahora valida
tipos y un error detiene el despliegue.

**Identidad de los asistentes unificada.** Marco ya no se anuncia como asistente
virtual por iniciativa propia —saluda como "Marco, de Coffee Maker Pro"— pero lo
confirma con honestidad si se lo preguntan directamente, una sola vez. Nunca
afirma ser humano. Tiene prohibido mencionar proveedores, modelos o tecnología.
Antes el popup mostraba literalmente el texto *"Tu clave de OpenAI permanece en
el servidor"* en pantalla.

**Protocolo de pedido igualado en ambos canales.** El chat escrito creaba
pedidos sin resumen ni confirmación, a diferencia de la voz. Ahora
`create_cod_order` exige `customerConfirmed` y hay un guard en el servidor: si
el modelo lo intenta sin confirmación, el código no crea el pedido, muestra el
resumen y pregunta.

**Contenido corregido:** se eliminó una estadística inventada ("el café
pre-molido pierde el 60% de sus aromas en 15 minutos"), se resolvió una
contradicción en tiempos de entrega (2-4 contra 2-5 días) y se corrigió
"encriptación SSL de 256 bits", terminología obsoleta que además describía el
transporte, no la protección de los datos.

**Cumplimiento legal:** casilla de consentimiento obligatoria en el checkout
(antes se recogían nombre, dirección y celular sin autorización registrada),
identificación del vendedor, política de privacidad conforme a la Ley 1581
—incluyendo el procesamiento de audio del asistente de voz y la analítica— y
términos ampliados conforme a la Ley 1480.

**Decisión del dueño:** los testimonios se mantienen tal como están.

## 5. Base de datos

Proyecto `coffee-maker-pro`, ref `rsqcumtozynvzsctvmpk`, `us-east-1`.

Tablas: `orders_cod`, `leads`, `chat_sessions`, `chat_messages`, `sites`,
`site_channels`, `platform_admins`, `site_members`, `site_products`,
`site_api_keys`, `clients`. `sites.client_id` permite varias landings por
cliente. RLS en todas. Detalle en `DEPLOYMENT.md`,
`SECURITY.md` y `ADMIN_DASHBOARD.md`.

Las ocho migraciones locales están aplicadas en producción y el historial
remoto quedó alineado con sus nombres por primera vez el 20 de agosto de 2026.
`20260820120000_multitenant_boundary.sql`,
`20260820140000_leads_per_site.sql` y
`20260820200341_separate_platform_clients_from_operations.sql` están activas. El administrador de plataforma,
el pedido anterior y el precio de Coffee Maker sobrevivieron al corte. Ver
`DEPLOYMENT.md` y `PLATFORM.md`.

La migración `20260820200341_separate_platform_clients_from_operations.sql`
reemplaza `site_accounts` por `clients`, añade los metadatos de repositorio y
Vercel a `sites` y retira del superadmin el acceso operativo implícito.

El alta de clientes ya admite nombre visible y logo. Los miembros de un sitio
ven esa identidad en la cabecera de su dashboard; el superadmin conserva Nitro.
La pestaña **Marca** permite actualizarla después. Los logos se guardan en
Supabase Storage, bucket público `site-logos`, con escritura exclusiva desde el
servidor y formatos PNG/JPG/WebP de hasta 750 KB.

Compute: **Micro** ($10 USD/mes). Es el default de una organización de pago;
Nano corresponde al plan Free. Se cambia en Project Settings → Compute and Disk.

## 6. Vulnerabilidades

`npm audit --omit=dev` al 20 de agosto de 2026: **13 (5 moderadas, 8 altas,
0 críticas)**. Afectan, entre otros, `next@16.0.10`, `postcss`, `sharp`,
`brace-expansion`, `minimatch`, `fast-uri`, `nanoid`, `uuid` y `ws`.

El rango vulnerable de Next termina en `16.3.0-preview.10`; la plantilla de
landings ya resuelve `next@16.3.1` y su `npm audit` da cero. La plataforma no se
actualizó dentro de este trabajo para no mezclar un cambio de framework de la
aplicación en producción con la fábrica de landings. Debe hacerse como tarea
aislada y volver a ejecutar toda la verificación.

## 7. Pendientes

**Bloqueante para pauta**

1. **DNS del dominio.** `coffeemakerprofesional.com` no resuelve. Ver `DEPLOYMENT.md`.

**Importantes**

2. **Separar la landing propia.** Mover Coffee Maker a un proyecto basado en
   `templates/landing` antes de retirar la landing y `/admin` del proyecto viejo.
3. **Actualizar `next` al menos a 16.3.1** y resolver el resto del audit en una
   tarea aislada.
4. **Publicar las reglas de firewall** solo tras autorización del dueño.

**Menores**

5. **Verificación visual en móvil.** Se corrigieron cinco desbordes calculando anchos, pero nunca se revisó renderizado. Sin verificar: si el hero deja el titular bajo el fold, cómo se apila la sección de ahorro y si los targets táctiles llegan a 44px.
6. **Video en Cloudinary.** Única atadura externa que queda para un recurso de la landing.

## 8. Fábrica de landings

`templates/nitro-starter/` es el inicio recomendado para una landing nueva: no
copia el estilo de Coffee Maker y ya contiene el núcleo seguro de Nitro. El
material se organiza en `/home/juan/nitro-drive/openclaw/clientes/<slug>` y se
convierte en un workspace local con:

```bash
npm run landing:new -- --client <slug> --target /ruta/al/repositorio
```

Cada proyecto recibe el skill `nitro-landing-studio`, brief, matriz de evidencia,
dirección creativa, contexto persistente, contrato HTTP y gates separados.
`landings/registry.json` recuerda proyectos entre sesiones; consúltalo con
`npm run landing:list`. Para diseños creados
aparte existe:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio --client <slug>
```

El comando conserva la UI e instala el estudio, el material y la integración.
`templates/landing/` queda como referencia funcional heredada, no como estilo
predeterminado. Ver `LANDING_FACTORY.md`.

`/platform` ya permite crear **Nitro Intake** antes de dar de alta un cliente:
**Nuevo intake** solo pide nombre provisional e identificador. El prospecto
recibe un enlace privado, completa seis pasos y carga material desde el celular.
Al recibirlo, **Crear cliente desde el brief** crea la ficha, el sitio
desconectado, los canales y el producto sin volver a copiar la información. La
pestaña Brief de clientes ya creados sigue disponible. El sistema guarda
borradores y archivos permanentemente en el bucket privado `nitro-intake`.
`/platform` muestra avance, última actividad, archivos y todas las respuestas;
también exporta `BRIEF.md` e `intake.json`. Las tres migraciones están aplicadas
en producción y alineadas con el historial local desde el 21 de agosto. El
código publicado todavía no incluye este cierre. No se deben
enviar enlaces reales hasta completar la prueba en Preview y el pedido real.

La primera landing registrada es `maquina_para_ejercicio`, proyecto local
`/home/juan/maquina_para_ejercicio_landing`, modo `demo`, estado
`local_review`, puerto SSH 3100. Su oferta y vendedor son ficticios; el resumen
del checkout funciona y la confirmación está bloqueada. No existe Preview ni
autorización de producción.

## 9. Estado del repositorio

Nitro Intake está fusionado en `main` mediante el PR #5, merge `f72d901`. El
commit funcional es `4743180` y el cierre de Preview `104631c`.

No asumir que los cambios no relacionados pertenecen al agente actual. No usar
comandos destructivos ni revertir archivos en masa.

Al retomar:

```bash
git status --short
npx tsc --noEmit
npm run supabase:status
npm run supabase:start   # si Docker/Supabase no está activo
```

## 10. Corte de Nitro Intake — 21 de agosto de 2026

### Completado en local

- Google Drive y `google-auth-library` fueron retirados del flujo y de las
  dependencias directas.
- La migración `20260821135005_persist_intake_in_supabase.sql` cambia los
  archivos a estados `pending`, `stored` y `failed`, elimina las identidades de
  Drive y conserva RLS sin políticas ni grants de navegador.
- `/platform` distingue esperando, completando y recibido; muestra última
  actividad, archivos, respuestas y descargas privadas. `BRIEF.md` e
  `intake.json` se generan bajo demanda.
- El layout comercial ahora usa una lista positiva: navbar, invitación de voz,
  WhatsApp, footer y modales solo renderizan en `/`. Se verificó con una cuenta
  real local que `/admin` no muestra ninguno de esos elementos y la landing los
  conserva.
- `npx tsc --noEmit`, `npm run build`, las 158 pruebas pgTAP y
  `supabase:verify` pasaron después de recrear Supabase local.
- Las tres migraciones de Intake están aplicadas en Supabase remoto, con el
  historial alineado hasta `20260821135005`. Las tablas están vacías y
  protegidas por RLS.
- Rama `feat/nitro-intake`, commit funcional `4743180`, PR #5 y comprobaciones
  de Vercel en verde.
- Preview verificada de `nitro-platform`:
  `https://nitro-platform-p4j6j8c7f-seller360grados-projects.vercel.app`
  (deployment `dpl_67bQtd979RRAHwqj5HwB9vQqFCq3`). Pasaron los seis pasos del
  Intake en móvil, guardado automático, carga y persistencia de una imagen,
  entrega y confirmación en base y Storage.
- `/admin` redirige al login sin navbar, banner de voz, WhatsApp ni footer
  comercial. La landing conserva su interfaz comercial.
- Se creó un pedido real en Preview por $490.000, atribuido al sitio y producto
  correctos; se canceló inmediatamente y se comprobó el evento de cancelación.
- La solicitud, archivo, objeto de Storage, pedido, contacto y eventos usados en
  la prueba fueron eliminados de forma exacta. No quedó información temporal.
- Las variables antiguas `GOOGLE_DRIVE_PRIVATE_KEY`,
  `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` y `OPENCLAW_CLIENTS_FOLDER_ID` se
  retiraron de Preview y Production en `nitro-platform` después de validar el
  flujo nuevo.

### Producción verificada

- PR #5 fusionado en `main` con merge `f72d901`.
- `nitro-platform`: deployment `dpl_HuVUL4vJ7RX2j3oByL1QGB7pNtBz`, `READY`.
- `coffee-maker-pro`: deployment `dpl_BQkzsNgM9MtJTsZuWkMQ2FZcNG23`, `READY`.
- En producción, Intake guardó un borrador y una imagen en Storage; se confirmó
  la fila `stored` y el objeto físico. Después se eliminaron ambos por la API.
- El pedido real de producción se creó por $490.000 para el sitio y producto
  correctos, se canceló, se comprobó su evento y se limpió junto con contacto y
  eventos. Las consultas finales dieron cero residuos de prueba.
- `/admin` redirige al login sin interfaz comercial; ambos proyectos responden
  200 en la raíz y Vercel no registró errores de runtime tras el despliegue.
