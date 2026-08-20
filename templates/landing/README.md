# Plantilla de landing — Nitro Landing

Punto de partida para la landing de un cliente. Se copia a un repositorio nuevo
y se despliega en su propio proyecto de Vercel.

El contenido es el de Coffee Maker Pro: sirve como base funcional y se
reemplaza por el del cliente.

## Lo que esta landing NO tiene, a propósito

**Ninguna credencial de Supabase.** `SUPABASE_SECRET_KEY` se salta las políticas
RLS de **todos** los clientes de la plataforma. Con un proyecto de Vercel por
cliente, ponerla aquí convertiría la filtración de uno en la filtración de
todos.

Esta landing solo conoce su `NITRO_SITE_KEY`, que sirve para tres cosas y nada
más: crear pedidos, captar correos y leer su propia configuración.

Tampoco tiene panel (`/admin`) ni portal del comprador (`/dashboard`, `/login`).
Ambos viven en la plataforma.

## Dos formas de usarla

**Landing nueva desde esta base:** copia toda la carpeta a un repositorio nuevo,
completa `docs/CLIENT_BRIEF.md` y adapta contenido y diseño.

**Diseño creado aparte:** no reemplaces su interfaz con esta. Desde el
repositorio de la plataforma ejecuta:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio-del-diseño
```

El repositorio externo recibirá `AGENTS.md`, el contrato Nitro, el brief y el
verificador. Codex y Claude sabrán conservar el diseño e integrar el flujo.

## Poner en marcha un cliente

1. **Alta en el panel.** En `/admin/plataforma`, «Nuevo cliente»: crea el sitio,
   su producto con su precio, sus canales y su cuenta.
2. **Usuario.** En la pestaña *acceso* de su tarjeta, o
   `npm run admin:create -- --site <slug> correo 'Clave' 'Nombre'`.
3. **Llave.** En la pestaña *llaves*, o `npm run site:key -- emitir <slug>`.
   **Se muestra una sola vez.**
4. **Repositorio.** Copia esta carpeta a uno nuevo.
5. **Brief.** Completa `docs/CLIENT_BRIEF.md`; no dejes hechos comerciales como
   `PENDIENTE` al publicar.
6. **Contenido.** Adapta producto, datos, prompts, metadatos, dominio, correos,
   navegación y recursos. La lista exacta se valida con `npm run nitro:check`.
7. **Vercel.** Proyecto nuevo con las variables de `.env.example`.

> **El precio de `product.ts` tiene que coincidir con el de `site_products`.**
> La plataforma rechaza el pedido si no coinciden: es preferible no vender a
> vender al precio equivocado.

## Qué se revisa por cliente

| Archivo | Qué lleva |
|---|---|
| `src/lib/product.ts` | Precio, kit, garantía, entrega, retracto, vendedor. **Fuente única.** |
| `src/lib/data.ts` | Testimonios, recetas, galería, políticas, navegación. |
| `src/lib/marco-voice-prompt.ts` | Guion del asistente de voz. |
| `public/` | Imágenes del producto. |
| `tailwind.config.ts` | Paleta. |
| `src/app/layout.tsx` | Título, descripción, píxeles de analítica. |
| `src/app/sitemap.ts`, `robots.ts` | Dominio canónico e indexación. |
| `src/app/actions/chat.ts` | Identidad, oferta y cierre conversacional. |
| Componentes | Marca o producto que siga escrito directamente en la UI. |

Coffee Maker Pro es contenido de ejemplo, no una abstracción completa. No des
por terminada la adaptación solo porque cambiaste `product.ts`.

No dupliques datos comerciales en los componentes: salen de `product.ts`.

## Desconectar una landing

Desde el panel, botón **Conectada / Desconectada** en la tarjeta del cliente.
Apaga la venta sin desplegar nada ni entrar a este proyecto:

- La plataforma deja de aceptar sus pedidos.
- Esta landing esconde el checkout, apaga chat y voz y muestra un aviso.

Tarda hasta un minuto en verse: esta landing revalida su configuración por
tiempo, y la invalidación de caché de la plataforma no cruza despliegues.

## Límites conocidos

- **El chat no guarda transcripción.** Conversa y crea pedidos igual; lo que se
  pierde es el historial. Persistirlo exige un endpoint de la plataforma y
  `site_id` en `chat_sessions`.
- **Un producto por sitio.** El guardián de precio rechaza la ambigüedad si hay
  varios activos.
- **El portal del comprador es el de la plataforma**, en su dominio.

## Verificación antes de entregar

```bash
npm install
npm run nitro:check
npx tsc --noEmit
npm run build
```

Y un pedido real de extremo a extremo contra la plataforma antes de dar la
landing por buena. Es contraentrega: un pedido que no llega es una venta
perdida, y uno que llega mal es un despacho físico indebido.
