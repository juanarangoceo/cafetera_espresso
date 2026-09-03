-- Un intake pertenece a un cliente, no solo a un sitio.
--
-- `site_id` es nulo hasta que el brief se convierte, porque el prospecto
-- completa el formulario ANTES de que exista su ficha operativa. Eso deja los
-- intakes abiertos sin dueño: la única forma de agruparlos era `created_by`,
-- que es el correo de quien emitió el enlace, no del cliente.
--
-- Con `client_id`, Nitro Bot puede pedir «los intakes de este cliente» y
-- mostrarle al cliente su propia solicitud en curso. Sigue siendo nulo para los
-- prospectos que todavía no son clientes, que es el caso que `site_id` nulo ya
-- contemplaba.
alter table public.intake_requests
  add column if not exists client_id uuid references public.clients(id) on delete set null;

comment on column public.intake_requests.client_id is
  'Cliente que pidió la landing. NULL en prospectos que aún no son clientes.';

create index if not exists intake_requests_client_idx
  on public.intake_requests (client_id, created_at desc)
  where client_id is not null;
