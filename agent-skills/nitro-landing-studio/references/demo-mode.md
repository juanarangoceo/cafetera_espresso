# Modo demostración

Úsalo solo cuando el dueño pida probar diseño o recorrido sin una oferta real.

- `PRODUCT.mode` permanece en `demo` y `commercialReady` en `false`.
- Datos inventados requieren autorización expresa y se etiquetan como ficticios
  en `CLIENT_BRIEF.md`, `CONTENT_EVIDENCE.md` y cerca de la oferta visible.
- El formulario puede llegar al resumen para demostrar UX, pero la acción final
  queda deshabilitada y nunca llama a Nitro.
- No se crea cliente, llave, Preview o producción por el hecho de ser una demo.
- `landing:check` puede aprobar calidad técnica; `release:check` debe fallar.

Para convertirla en real, reemplaza cada dato ficticio por evidencia del cliente,
configura vendedor y políticas aplicables, cambia a `mode: 'real'`, marca
`commercialReady: true`, conecta Nitro y vuelve a ejecutar todos los gates. No
reutilices un NIT, correo, testimonio, precio o condición creada para la demo.
