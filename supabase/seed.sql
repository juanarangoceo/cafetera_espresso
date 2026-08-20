-- Development-only sample data. Never use real customer information here.
-- La unicidad de `leads` es por sitio desde que la plataforma gestiona varias
-- landings: el mismo correo puede ser contacto de dos clientes distintos.
insert into public.leads (email, source, site_id)
values (
  'barista.local@example.com',
  'ebook_barista_guide',
  'c0ffee00-0000-4000-8000-000000000001'
)
on conflict (site_id, email) do nothing;

insert into public.chat_sessions (id)
values ('00000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.chat_messages (session_id, role, content)
values
  ('00000000-0000-4000-8000-000000000001', 'user', '¿Cómo preparo un espresso equilibrado?'),
  ('00000000-0000-4000-8000-000000000001', 'model', 'Empieza con una molienda fina y ajusta hasta obtener unos 30 segundos de extracción.');

-- Autoriza el correo del administrador de plataforma local. La cuenta de
-- `auth.users` no se crea aquí: se crea con `npm run admin:create`, que además
-- la deja con el correo confirmado. Sin confirmar,
-- `private.is_platform_admin()` devuelve falso.
insert into public.platform_admins (email, display_name)
values ('admin.local@example.com', 'Administrador Local')
on conflict (email) do nothing;

-- Segundo sitio de muestra. Existe para que la separación entre inquilinos sea
-- comprobable en local: sin dos sitios no hay forma de ver si un cliente
-- alcanza los pedidos del otro, que es justo lo que hay que impedir.
insert into public.sites (id, slug, name, primary_domain)
values (
  '00000000-0000-4000-8000-0000000000d0',
  'demo-cliente',
  'Demo Cliente',
  'demo-cliente.example.com'
)
on conflict (id) do nothing;

insert into public.site_channels (site_id)
values ('00000000-0000-4000-8000-0000000000d0')
on conflict (site_id) do nothing;

-- Otro precio a propósito: es lo que la base rechazaba antes de mover el
-- importe de un `check` cableado a `site_products`.
insert into public.site_products (id, site_id, name, price)
values (
  '00000000-0000-4000-8000-0000000000d1',
  '00000000-0000-4000-8000-0000000000d0',
  'Producto Demo',
  250000
)
on conflict (id) do nothing;

insert into public.site_accounts (site_id, client_name, plan, monthly_fee, status)
values (
  '00000000-0000-4000-8000-0000000000d0',
  'Cliente de Demostración',
  'basico',
  150000,
  'activo'
)
on conflict (site_id) do nothing;

-- El cliente de demostración solo pertenece a su sitio. Su cuenta de
-- `auth.users` se crea con `npm run admin:create -- --site demo-cliente`.
insert into public.site_members (site_id, email, role, display_name)
values (
  '00000000-0000-4000-8000-0000000000d0',
  'cliente.demo@example.com',
  'owner',
  'Cliente Demo'
)
on conflict (site_id, email) do nothing;

-- Pedidos de muestra en distintos estados para poder ver el panel con
-- contenido. `created_at` se escalona para que el orden y las métricas por
-- fecha tengan sentido.
insert into public.orders_cod (
  id,
  full_name,
  email,
  phone,
  city,
  address,
  total_price,
  status,
  created_at
)
values
  (
    '00000000-0000-4000-8000-000000000002',
    'Cliente Local',
    'cliente.local@example.com',
    '3000000000',
    'Medellín',
    'Dirección de prueba 123',
    490000,
    'pending',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Compradora de Prueba',
    'compradora.local@example.com',
    '3010000001',
    'Bogotá',
    'Calle de prueba 45 - 67',
    490000,
    'confirmed',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Pedido en Camino',
    'transito.local@example.com',
    '3020000002',
    'Cali',
    'Avenida de prueba 89',
    490000,
    'shipped',
    now() - interval '4 days'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'Entrega Completa',
    'entregado.local@example.com',
    '3030000003',
    'Barranquilla',
    'Carrera de prueba 12 - 34',
    490000,
    'delivered',
    now() - interval '11 days'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'Pedido Cancelado',
    'cancelado.local@example.com',
    '3040000004',
    'Bucaramanga',
    'Diagonal de prueba 5',
    490000,
    'cancelled',
    now() - interval '13 days'
  )
on conflict (id) do nothing;
