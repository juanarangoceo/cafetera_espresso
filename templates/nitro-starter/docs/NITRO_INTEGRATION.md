# Contrato de integración con Nitro

La landing tiene diseño y despliegue independientes. Nunca se conecta a
Supabase: su Server Action llama a Nitro usando una llave exclusiva del sitio.

## Seguridad

- `NITRO_SITE_KEY` es secreta y solo de servidor; nunca uses `NEXT_PUBLIC_`.
- El browser llama a la Server Action local. BotID se ejecuta antes de Nitro.
- El formulario exige consentimiento vacío por defecto, revisión y confirmación.
- Si falta la configuración, la llave es rechazada o el sitio está inactivo, el
  checkout queda cerrado. La página puede seguir informando sin aceptar pedidos.
- En modo `demo`, el formulario puede mostrar el resumen pero la confirmación
  final queda deshabilitada y `release:check` bloquea publicación.

## Variables

```env
NITRO_API_URL=https://nitro-platform-mauve.vercel.app
NITRO_SITE_KEY=nl_live_...
NEXT_PUBLIC_NITRO_PORTAL_URL=https://nitro-platform-mauve.vercel.app/login
```

La llave se emite en `/platform`, sección **Llaves**, y se muestra una sola vez.
No guardes valores reales en Git.

## API

- `GET {NITRO_API_URL}/api/v1/site`: estado, canales y producto activo.
- `POST {NITRO_API_URL}/api/v1/orders`: `fullName`, `email`, `phone`, `city`,
  `address`. No envíes precio: Nitro lo resuelve y valida.
- `POST {NITRO_API_URL}/api/v1/leads`: `{ "email": "..." }`, solo si aplica.

Todas las llamadas llevan `Authorization: Bearer ${NITRO_SITE_KEY}` desde
servidor. Antes de producción: Preview autorizada, pedido real, verificación de
aislamiento entre clientes y cancelación del pedido de prueba.
