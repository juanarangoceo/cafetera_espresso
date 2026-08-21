# Landing de cliente — instrucciones para agentes

Antes de trabajar, lee en este orden:

1. `.agents/skills/nitro-landing-studio/SKILL.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/SOURCE_INVENTORY.md` y los materiales de `_intake/`
4. `docs/CLIENT_BRIEF.md`
5. `docs/CONTENT_EVIDENCE.md`
6. `docs/CREATIVE_DIRECTION.md`
7. `docs/NITRO_INTEGRATION.md` si tocas formularios o integración

Coffee Maker Pro es una referencia de calidad, no una plantilla visual. La
landing debe responder al producto y a su comprador. No inventes características,
testimonios, resultados, descuentos ni garantías.

`_intake/` contiene fuentes privadas y está ignorado por Git. Copia a `public/`
solo los recursos aprobados y necesarios. Nunca copies secretos o archivos `.env`.

No despliegues, crees proyectos externos ni configures llaves sin autorización.
Actualiza el registro indicado en `PROJECT_CONTEXT.md` al cambiar de etapa.
Durante el diseño ejecuta `npm run landing:check`; antes de publicar ejecuta
`npm run release:check`.
