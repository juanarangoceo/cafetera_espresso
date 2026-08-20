# Fábrica de landings de clientes

Cómo pasar de un diseño independiente a una landing conectada a Nitro sin
mezclar repositorios, secretos ni datos entre clientes.

## Modelo operativo

Hay un proyecto de plataforma y un proyecto por landing:

```text
nitro-platform (este repositorio)
  /admin/plataforma + /admin + /api/v1
             ▲
             │ NITRO_SITE_KEY distinta por sitio
             │
  landing-cliente-a       landing-cliente-b
  repo + Vercel propios   repo + Vercel propios
```

La llave une la landing con el `site_id`; el dominio y el usuario no hacen esa
asociación. El usuario vive en `site_members` y permite ver en `/admin` los
datos del mismo sitio. Son dos relaciones distintas que apuntan al mismo
`site_id`.

## Camino A: empezar desde la plantilla

1. Copia `templates/landing/` a un repositorio nuevo.
2. Completa `docs/CLIENT_BRIEF.md`.
3. Pide al agente que lea `AGENTS.md` y adapte contenido y diseño.
4. Ejecuta `npm run nitro:check`, TypeScript y build.

La plantilla contiene la referencia funcional completa, pero su contenido
visual inicial sigue siendo Coffee Maker Pro. `nitro:check` falla a propósito
hasta que no queden marcas, datos ni dominios del ejemplo.

## Camino B: integrar un diseño creado aparte

Desde este repositorio:

```bash
npm run landing:prepare -- --target /ruta/al/repositorio-de-la-landing
```

El comando exige un proyecto Next.js con App Router y hace cambios locales y
reversibles en ese repositorio:

- crea o actualiza el bloque Nitro de `AGENTS.md`;
- crea `CLAUDE.md` si falta, o añade una referencia si ya existe;
- copia `docs/NITRO_INTEGRATION.md`;
- crea `docs/CLIENT_BRIEF.md` solo si no existe, para no borrar decisiones;
- copia `.env.nitro.example` sin tocar `.env*` existentes;
- instala el verificador `scripts/check-nitro-adaptation.mjs`;
- añade `npm run nitro:check` a `package.json`.

No copia la interfaz de Coffee Maker, no despliega, no crea repositorios, no
emite llaves y no modifica variables de Vercel.

Después se abre el repositorio preparado y se le dice al agente:

> Lee `AGENTS.md`, `docs/CLIENT_BRIEF.md` y `docs/NITRO_INTEGRATION.md`. Conserva
> el diseño existente e integra checkout, leads, configuración y portal con
> Nitro. No despliegues todavía. Reporta cualquier dato comercial pendiente.

## Alta del cliente en la plataforma

En `/admin/plataforma`:

1. **Nuevo cliente:** crea `sites`, `site_channels`, `site_products` y
   `site_accounts`.
2. **Acceso:** crea el usuario confirmado y su fila en `site_members`.
3. **Llaves:** emite la `NITRO_SITE_KEY`; se muestra una sola vez.
4. **Cuenta:** registra plan, tarifa, corte y estado.
5. **Conectada/Desconectada:** habilita o corta la venta sin redesplegar.

## Variables de la landing

```env
NITRO_API_URL=https://DOMINIO_DE_LA_PLATAFORMA
NITRO_SITE_KEY=nl_live_...
NEXT_PUBLIC_NITRO_PORTAL_URL=https://DOMINIO_DE_LA_PLATAFORMA/login
```

`GEMINI_API_KEY` y `OPENAI_API_KEY` son opcionales para chat y voz. La landing
no recibe ninguna variable de Supabase. La llave de sitio nunca lleva prefijo
`NEXT_PUBLIC_`.

## Verificación y publicación

1. `npm run nitro:check`
2. `npx tsc --noEmit`
3. `npm run build`
4. Configurar variables en Preview.
5. Desplegar Preview.
6. Hacer un pedido real desde un navegador normal.
7. Confirmar que aparece bajo el cliente correcto y que otro cliente no lo ve.
8. Cancelar o eliminar el pedido de prueba.
9. Promover exactamente el artefacto verificado a Production.
10. Conectar el dominio.

## Estado de automatización

Automatizado dentro del panel: alta lógica del cliente, usuario, producto,
precio, llave, cuenta y corte operativo.

Automatizado por `landing:prepare`: instrucciones y contrato para adaptar un
repositorio Next.js existente.

Manual por decisión de seguridad: crear repositorio/proyecto Vercel, introducir
la llave secreta, conectar DNS, validar el pedido humano y autorizar producción.

## Limitaciones vigentes

- El adaptador documentado soporta Next.js App Router. Otro framework requiere
  diseñar su equivalente y documentarlo antes de tocar el checkout.
- Vercel y dominios no se aprovisionan desde el superadmin.
- Hay un producto activo por sitio en la experiencia actual.
- Chat no persiste transcripciones en landings externas.
- Resend está aplazado por decisión del dueño. Sin `RESEND_API_KEY` la plataforma
  guarda pedidos y omite el correo. Cuando se habilite, el remitente será
  neutral y el asunto, sitio y producto se resolverán por cliente.
