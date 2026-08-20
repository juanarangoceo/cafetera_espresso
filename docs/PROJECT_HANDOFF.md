# Coffee Maker Pro — estado del proyecto

**Última actualización: 20 de agosto de 2026.**

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

## 1. Estado

Desde el 4 de agosto de 2026 en `https://coffee-maker-pro.vercel.app`, con
pedidos reales habilitados.

La plataforma multi-tenant ya está aplicada y desplegada también en el proyecto
Vercel separado `nitro-platform`, configurado como Next.js y sin Vercel
Authentication. Producción estable:
`https://nitro-platform-seller360grados-projects.vercel.app`. El dueño pidió
promover el 20 de agosto de 2026 sin el pedido real previo y probar directamente
en producción; queda pendiente ejecutar esa prueba y cancelar el pedido.

El proyecto está conectado a `juanarangoceo/cafetera_espresso`, rama de
producción `main` y raíz `.`. El cambio completo se fusionó mediante el PR #4;
los pushes futuros a `main` despliegan automáticamente `nitro-platform`.

**Verificado ese día:**

- `npx tsc --noEmit` correcto
- `npm run build` correcto, con validación de tipos activa
- 20 pruebas pgTAP y `supabase:verify` en verde
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
`site_api_keys`, `site_accounts`. RLS en todas. Detalle en `DEPLOYMENT.md`,
`SECURITY.md` y `ADMIN_DASHBOARD.md`.

Las siete migraciones locales están aplicadas en producción y el historial
remoto quedó alineado con sus nombres por primera vez el 20 de agosto de 2026.
`20260820120000_multitenant_boundary.sql` y
`20260820140000_leads_per_site.sql` están activas. El administrador de plataforma,
el pedido anterior y el precio de Coffee Maker sobrevivieron al corte. Ver
`DEPLOYMENT.md` y `PLATFORM.md`.

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

2. **Probar `nitro-platform` en producción.** Resend quedó aplazado; sin clave el
   envío se omite y el pedido sigue siendo válido. El deployment automático de
   `main` está `READY` y pasó las comprobaciones HTTP. Por decisión explícita
   del dueño se promovió sin pedido real previo; falta crear uno en producción,
   comprobarlo en el panel y cancelarlo.
3. **Separar la landing propia.** Mover Coffee Maker a un proyecto basado en
   `templates/landing` antes de retirar la landing y `/admin` del proyecto viejo.
4. **Actualizar `next` al menos a 16.3.1** y resolver el resto del audit en una
   tarea aislada.
5. **Publicar las reglas de firewall** solo tras autorización del dueño.

**Menores**

6. **Verificación visual en móvil.** Se corrigieron cinco desbordes calculando anchos, pero nunca se revisó renderizado. Sin verificar: si el hero deja el titular bajo el fold, cómo se apila la sección de ahorro y si los targets táctiles llegan a 44px.
7. **Video en Cloudinary.** Única atadura externa que queda para un recurso de la landing.

## 8. Fábrica de landings

`templates/landing/` es la referencia funcional para una landing independiente.
Cada copia lleva instrucciones para Codex/Claude, brief, contrato HTTP y
`npm run nitro:check`. Para diseños creados aparte existe:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio
```

El comando conserva la UI del diseño e instala únicamente el paquete de
integración y verificación. Ver `LANDING_FACTORY.md`.

## 9. Estado del repositorio

El worktree tiene muchos cambios legítimos sin commit: rediseño, eliminación de
Sanity/blog/Shopify, Supabase local, Marco por voz, ficha central, capas de
seguridad y esta documentación.

No asumir que los cambios no relacionados pertenecen al agente actual. No usar
comandos destructivos ni revertir archivos en masa.

Al retomar:

```bash
git status --short
npx tsc --noEmit
npm run supabase:status
npm run supabase:start   # si Docker/Supabase no está activo
```
