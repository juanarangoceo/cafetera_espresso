# Arquitectura

Cómo encaja el sistema. Para reglas de trabajo ve a `AGENTS.md`; para el estado
actual, a `PROJECT_HANDOFF.md`.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Estilos | Tailwind CSS 3 |
| Datos y auth | Supabase (Postgres 17) |
| Chat escrito | Google Gemini (`@google/genai`) |
| Voz | OpenAI Realtime + `@openai/agents` sobre WebRTC |
| Correo | Resend + React Email |
| Hosting | Vercel (Node 24.x) |

Eliminados del proyecto: Sanity, blog y Shopify. No reintroducir sin solicitud.

## Mapa de archivos

**Fuente de verdad**

- `src/lib/product.ts` — precio, kit, garantía, entrega, retracto, vendedor. Todo lo comercial sale de aquí.
- `src/lib/data.ts` — contenido de landing: testimonios, recetas, galería, políticas, navegación.

**Landing**

- `src/app/page.tsx` — hero.
- `src/components/HomeContent.tsx` — cuerpo, 11 secciones.
- `src/components/FAQ.tsx`, `HotspotSection.tsx`, `ImageModal.tsx`
- `src/components/layout/` — navbar, footer, CTA móvil, modales globales.

**Checkout**

- `src/components/CheckoutDrawer.tsx` → `src/components/CODForm.tsx` — formulario con casilla de consentimiento.
- `src/app/actions/order.ts` — **único camino de escritura de pedidos**.
- `src/app/actions/email.tsx` + `src/emails/OrderConfirmation.tsx` — confirmación.

**Asistentes**

- `src/components/ChatBot.tsx` → `src/app/actions/chat.ts` — chat escrito.
- `src/components/VoiceSalesAssistant.tsx` → `src/lib/marco-voice-prompt.ts` — voz.
- `src/app/api/realtime/token/route.ts` — credencial efímera de OpenAI.

**Panel de operación y portal del cliente**

- `src/app/admin/` — panel Nitro Landing: pedidos, métricas, CRM y canales. Detalle en `ADMIN_DASHBOARD.md`.
- `src/lib/admin-site.ts` — tienda activa del panel. `src/lib/crm.ts` — etapas del CRM.
- `src/app/admin/platform-actions.ts` — alta de clientes, usuarios, llaves,
  cuenta y marca. Los logos se validan y suben desde el servidor al bucket
  público `site-logos`; el dashboard del cliente usa `sites.name` y
  `sites.logo_url`.
- `src/lib/admin-auth.ts` — `requireAdmin()`. La comprobación la resuelve la base.
- `src/lib/orders.ts` — estados de pedido y sus etiquetas. Replica la restricción de la base.
- `src/lib/site-config.ts` — canales por sitio, cacheados por etiqueta.
- `src/app/login/` + `src/app/auth/confirm/` — acceso del comprador por enlace de un solo uso.
- `src/app/dashboard/page.tsx` — estado del pedido para el comprador.

**Datos**

- `src/utils/supabase/` — clientes browser/SSR y resolución de variables.
- `src/utils/supabase/service.ts` — cliente con `SUPABASE_SECRET_KEY`. Se salta RLS: solo servidor.
- `src/database.generated.ts` — tipos generados. No editar a mano.
- `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql`

**Fábrica de landings**

- `templates/landing/` — referencia funcional que se copia a un repositorio por cliente.
- `templates/landing/AGENTS.md` — reglas portables que Codex y Claude reciben con la copia.
- `templates/landing/docs/NITRO_INTEGRATION.md` — contrato HTTP y criterios de aceptación.
- `templates/landing/docs/CLIENT_BRIEF.md` — datos confirmados del cliente; prohíbe inventarlos.
- `scripts/prepare-landing-repo.mjs` — inyecta el paquete de agente en un diseño Next.js existente sin sustituir su UI.
- `docs/LANDING_FACTORY.md` — procedimiento operativo completo.

**Seguridad**

- `src/instrumentation-client.ts` — BotID: qué rutas se protegen.
- `next.config.mjs` — `withBotId`, hosts de imagen permitidos.

## Flujo de pedido

Los tres caminos convergen en la misma server action:

```
Formulario ─┐
Chat ───────┼──> createOrder ──> BotID ──> Zod ──> Supabase (SUPABASE_SECRET_KEY)
Voz ────────┘                                            │
                                                          ├─> trigger de límite
                                                          └─> Resend
```

`createOrder` (`src/app/actions/order.ts`) es el único punto donde nace un
pedido. Cualquier canal nuevo debe pasar por ahí, no insertar por su cuenta.

Orden interno de la función:

1. `checkBotId()` — descarta automatización antes de tocar nada.
2. Resolución de variables de entorno.
3. Validación Zod.
4. Cliente Supabase con `SUPABASE_SECRET_KEY` (si falta, cae a la publishable y lo avisa en logs).
5. Insert. El trigger de la base puede rechazarlo por límite de frecuencia.
6. Correo de confirmación, sin bloquear la respuesta si falla.

## Esquema de datos

| Tabla | Uso | RLS |
|---|---|---|
| `orders_cod` | Pedidos contraentrega | Sí. Insert solo `service_role`; lectura del propio correo verificado o de un administrador; `update` solo de `status` y solo administradores. |
| `leads` | Suscripciones | Sí. Insert anónimo permitido. |
| `chat_sessions` | Sesiones de chat | Sí. Insert anónimo permitido. |
| `chat_messages` | Historial | Sí. Insert anónimo permitido. |
| `sites` | Una fila por landing, incluida su identidad visual | Sí. Lectura pública; escritura solo por acciones de plataforma en el servidor. |
| `site_channels` | Interruptores de chat, voz y WhatsApp por sitio | Sí. Lectura pública; `update` solo administradores. |
| `platform_admins` | Correos de la operación de Nitro Landing | Sí. Lectura solo de plataforma; sin escritura desde la app. |
| `site_members` | Quién pertenece a cada sitio de cliente | Sí. Cada miembro ve los de sus propios sitios. |
| `site_products` | Producto y precio por sitio | Sí. Lectura pública del activo; escritura solo desde el servidor. |
| `site_api_keys` | Llaves de ingesta por sitio | Sí, y **sin ninguna política**: solo `service_role` las lee. |
| `site_accounts` | Cuenta y facturación del cliente | Sí. Solo plataforma. |
| `order_status_events` | Historial de cambios de estado | Sí. Lo escribe un trigger; nadie lo edita ni lo borra desde la app. |
| `contacts` | Una ficha por persona, incluidos prospectos sin pedido | Sí. Solo administradores. |
| `contact_notes` | Notas de seguimiento con autor | Sí. Solo administradores. |

Vistas `order_daily_stats` y `order_city_stats` para las métricas, ambas con
`security_invoker` para que sigan aplicando las políticas de `orders_cod`.

`orders_cod.site_id` apunta al sitio que originó el pedido, con valor por
defecto fijo para que ningún pedido quede huérfano.

Restricciones vigentes en `orders_cod`: el trigger
`private.enforce_order_price()` exige el precio del producto activo del sitio;
`status` usa un enum cerrado; el correo va normalizado a minúsculas y validado;
el celular tiene entre 10 y 15 dígitos y nombre, ciudad y dirección tienen
longitudes acotadas.

`private.set_updated_at()` mantiene `updated_at`.
`private.enforce_order_rate_limit()` aplica el límite antiabuso.
`private.verified_email()` resuelve el correo del usuario **solo si está
confirmado**, leyendo `auth.users` y no el claim del JWT.
`private.is_platform_admin()` se apoya en la anterior y comprueba `platform_admins`.
`private.accessible_site_ids()` devuelve los sitios que la sesión alcanza, y es
donde se decide la frontera entre clientes. Detalle en `PLATFORM.md`.
`private.enforce_order_price()` sustituye al `check` de precio, que estaba
cableado a 490000 e impedía que un segundo cliente vendiera nada.
`private.record_order_status_event()` escribe el historial de estados.
`private.attach_order_contact()` crea o reutiliza la ficha del comprador, de modo
que vale igual para formulario, chat y voz.

## Marco por voz

1. El navegador pide credencial efímera a `/api/realtime/token`.
2. El servidor la genera con `OPENAI_API_KEY`; la clave nunca llega al cliente.
3. WebRTC directo contra OpenAI Realtime.
4. Marco diagnostica, recomienda y cierra por señal de interés.
5. Para comprar recoge los cinco datos, llama a `prepare_order_summary`, lee el resumen y exige confirmación verbal inequívoca.
6. Solo entonces `create_confirmed_order` con `customerConfirmed=true`.

Detalle de identidad y reglas conversacionales en `marco-voice-agent.md`.

## Decisiones que conviene no revertir sin motivo

- **`product.ts` como fuente única.** Antes el precio y la garantía estaban duplicados en varios componentes y se desincronizaban.
- **Pedidos solo desde el servidor.** La publishable key viaja al navegador; permitir escritura anónima dejaba una vía para saltarse BotID.
- **Protocolo de confirmación en ambos asistentes.** Voz y chat exigen resumen y confirmación explícita antes de crear un pedido.
- **Sin `ignoreBuildErrors`.** El build valida tipos; un error de tipos detiene el despliegue.
- **Imágenes de producto en `/public/product/`.** Antes venían del CDN de una tienda Shopify externa. Los archivos son JPEG aunque Shopify los servía con extensión `.webp`.

## Dependencias externas vivas

- **Cloudinary** — el video del hero (`HomeContent.tsx`). Única atadura externa que queda para un recurso de la landing.
- **Unsplash** — avatares de testimonios, chatbot y guía.
- **Google Analytics y Meta Pixel** — en `src/app/layout.tsx`. Declarados en la política de privacidad.
