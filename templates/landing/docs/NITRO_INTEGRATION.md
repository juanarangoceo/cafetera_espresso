# Contrato de integración con Nitro Landing

Este repositorio es una landing de un cliente. Su diseño puede venir de v0, de
otro repositorio o de la plantilla de Nitro. La integración conserva ese diseño
y sustituye únicamente el camino de pedidos, leads, configuración y portal.

## Límites de seguridad

- La landing nunca se conecta directamente a Supabase y no instala `@supabase/*`.
- Nunca recibe `SUPABASE_SECRET_KEY` ni variables `NEXT_PUBLIC_SUPABASE_*`.
- `NITRO_SITE_KEY` es solo de servidor. Nunca se renombra a
  `NEXT_PUBLIC_NITRO_SITE_KEY`, nunca se imprime y nunca se devuelve al browser.
- El navegador llama una Server Action propia. Esa acción ejecuta BotID y luego
  llama a Nitro de servidor a servidor.
- No se despliega a producción sin Preview y pedido real confirmado.

## Variables

| Variable | Visibilidad | Uso |
|---|---|---|
| `NITRO_API_URL` | Servidor | Base URL de la plataforma, sin barra final. |
| `NITRO_SITE_KEY` | Servidor/secreta | Identifica el sitio del cliente. |
| `NEXT_PUBLIC_NITRO_PORTAL_URL` | Pública | Enlace opcional para consultar pedidos. |
| `GEMINI_API_KEY` | Servidor/opcional | Chat. |
| `OPENAI_API_KEY` | Servidor/opcional | Voz. |

La llave se emite en `/admin/plataforma`, pestaña **Llaves**, y se muestra una
sola vez. El precio configurado en Nitro debe coincidir con la oferta visible.

## Contrato HTTP

Todas las llamadas privadas llevan `Authorization: Bearer ${NITRO_SITE_KEY}`.

### Configuración

`GET {NITRO_API_URL}/api/v1/site`

Devuelve el sitio, su estado, canales y producto. La landing debe revalidarlo
periódicamente. Si `isActive` es `false`, oculta checkout y asistentes y muestra
un aviso neutral. No reveles al visitante detalles de llaves o infraestructura.

### Pedidos

`POST {NITRO_API_URL}/api/v1/orders`

```json
{
  "fullName": "Nombre Apellido",
  "email": "persona@ejemplo.com",
  "phone": "3001234567",
  "city": "Bogotá",
  "address": "Dirección de entrega"
}
```

- `201`: pedido creado; devuelve `orderId`.
- `401`: llave inválida, revocada o sitio desconectado.
- `422`: datos inválidos.
- `500`: configuración o servicio no disponible.

El precio no viaja desde la landing. Nitro lo toma del producto asociado al
sitio y la base lo vuelve a comprobar.

### Leads

`POST {NITRO_API_URL}/api/v1/leads` con `{ "email": "..." }`.

## Adaptar un diseño existente

1. Lee `docs/CLIENT_BRIEF.md` y marca los datos faltantes; no los inventes.
2. Audita framework, App Router, formularios, píxeles, textos legales y secretos.
3. Conserva componentes, layout, responsive y sistema visual existentes.
4. Crea una Server Action de pedido que ejecute `checkBotId()` antes de llamar a
   `/api/v1/orders`.
5. Conecta el formulario existente a esa acción. Mantén el consentimiento legal
   vacío por defecto y obligatorio.
6. Conecta leads a `/api/v1/leads`, si la landing los capta.
7. Lee `/api/v1/site` desde servidor para canales y estado operativo.
8. Apunta el enlace de consulta a `NEXT_PUBLIC_NITRO_PORTAL_URL`.
9. Centraliza los hechos comerciales en `src/lib/product.ts` o en una fuente
   única equivalente. El diseño no debe duplicar precio, garantía o entrega.
10. Ejecuta `npm run nitro:check`, TypeScript y build.

Si el repositorio no usa Next.js App Router, detente y documenta la variante:
el adaptador actual no se copia a ciegas a otro framework.

## Criterios de aceptación

- No quedan marcas, dominios, correos, precios ni testimonios del proyecto base.
- No existe acceso directo a Supabase.
- La llave solo aparece en variables de servidor de Vercel.
- BotID bloquea antes de la llamada a Nitro.
- Formulario, chat y voz exigen resumen y confirmación antes del pedido.
- La landing desconectada deja de vender en un máximo de 60 segundos.
- Preview crea un pedido atribuido al sitio correcto.
- El cliente lo ve en su panel y otro cliente no puede verlo.
- El pedido de prueba queda cancelado o eliminado antes de producción.

## Entrega del agente

El agente debe informar: archivos cambiados, datos aún pendientes, resultado de
las verificaciones, URL de Preview y cualquier acción manual necesaria. No puede
crear recursos externos, configurar dominios ni promover a producción sin
autorización explícita del dueño.
