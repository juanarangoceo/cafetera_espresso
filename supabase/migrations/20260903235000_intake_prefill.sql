-- Un brief puede llegar con parte de las respuestas ya escritas.
--
-- Nitro Bot conoce al cliente (su razón social, su cobertura, su garantía) y
-- conoce su catálogo (nombre, precio y descripción del producto). Preguntarle
-- otra vez lo que ya nos dijo es la forma más rápida de que abandone un
-- formulario de 16 campos obligatorios.
--
-- `answers` sigue siendo la única respuesta y el cliente puede cambiarla
-- entera: lo prellenado no es una decisión, es un borrador. Esta columna solo
-- registra QUÉ llegó prellenado y de dónde, que es lo que permite al formulario
-- agrupar esos campos como «revísalo» en vez de mezclarlos con lo que sí hay
-- que responder. Sin ella habría que adivinarlo comparando contra vacío, y un
-- campo que el cliente llenó y otro que llegó del catálogo se ven igual.
alter table public.intake_requests
  add column if not exists prefill jsonb not null default '{}'::jsonb;

alter table public.intake_requests
  drop constraint if exists intake_requests_prefill_object_check;

alter table public.intake_requests
  add constraint intake_requests_prefill_object_check
    check (jsonb_typeof(prefill) = 'object');

comment on column public.intake_requests.prefill is
  'Procedencia de lo prellenado: {source, productRef, keys[]}. NO es la respuesta —esa vive en answers— sino la marca de qué campos llegaron llenos para que el formulario los muestre como revisión.';
