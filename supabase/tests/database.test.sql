begin;

create extension if not exists pgtap with schema extensions;

select plan(129);

select has_table('public', 'orders_cod', 'orders table exists');
select has_table('public', 'leads', 'leads table exists');
select has_table('public', 'chat_sessions', 'chat sessions table exists');
select has_table('public', 'chat_messages', 'chat messages table exists');

select col_is_pk('public', 'orders_cod', 'id', 'orders have a primary key');
select col_is_pk('public', 'leads', 'id', 'leads have a primary key');
select col_is_pk('public', 'chat_sessions', 'id', 'chat sessions have a primary key');
select col_is_pk('public', 'chat_messages', 'id', 'chat messages have a primary key');

select ok((select relrowsecurity from pg_class where oid = 'public.orders_cod'::regclass), 'RLS enabled on orders');
select ok((select relrowsecurity from pg_class where oid = 'public.leads'::regclass), 'RLS enabled on leads');
select ok((select relrowsecurity from pg_class where oid = 'public.chat_sessions'::regclass), 'RLS enabled on chat sessions');
select ok((select relrowsecurity from pg_class where oid = 'public.chat_messages'::regclass), 'RLS enabled on chat messages');

select policies_are(
  'public',
  'orders_cod',
  array[
    'customers_can_read_their_verified_orders',
    'members_can_read_their_site_orders',
    'members_can_update_their_site_orders'
  ],
  'orders expose only the intended policies'
);
select policies_are(
  'public', 'leads',
  array['visitors_can_subscribe', 'members_can_read_their_site_leads'],
  'leads take anonymous subscriptions and are readable only by their own site'
);

-- El correo captado pertenece al sitio que lo captó. Antes `email` era único a
-- secas, de modo que la misma persona suscrita en dos landings hacía fallar la
-- segunda y ese cliente perdía el contacto sin enterarse.
select has_column('public', 'leads', 'site_id', 'captured emails belong to a site');
select lives_ok(
  $$ insert into public.leads (email, source, site_id)
     values ('mismo.correo@example.com', 'ebook_barista_guide', 'c0ffee00-0000-4000-8000-000000000001'),
            ('mismo.correo@example.com', 'ebook_barista_guide', '00000000-0000-4000-8000-0000000000d0') $$,
  'the same person can subscribe on two different tenant landings'
);
select throws_ok(
  $$ insert into public.leads (email, source, site_id)
     values ('mismo.correo@example.com', 'ebook_barista_guide', 'c0ffee00-0000-4000-8000-000000000001') $$,
  '23505',
  null,
  'but not twice on the same one'
);

select lives_ok(
  $$ insert into public.leads (email, source)
     values ('migration.test@example.com', 'ebook_barista_guide') $$,
  'valid lead can be inserted'
);

select throws_ok(
  $$ insert into public.orders_cod
       (full_name, email, phone, city, address, total_price, status)
     values
       ('Test User', 'test@example.com', '3000000000', 'Bogotá', 'Test address 123', 1, 'pending') $$,
  '23514',
  null,
  'order price constraint rejects tampering'
);

-- Límite antiabuso de pedidos contraentrega.
select has_function('private', 'enforce_order_rate_limit', 'rate limit function exists');
select has_trigger('public', 'orders_cod', 'orders_cod_rate_limit', 'rate limit trigger is attached to orders');

select lives_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address)
     values
       ('Cliente Uno', 'ratelimit@example.com', '3001112233', 'Bogotá', 'Calle 1 # 2-3'),
       ('Cliente Uno', 'ratelimit@example.com', '3001112233', 'Bogotá', 'Calle 1 # 2-3'),
       ('Cliente Uno', 'ratelimit@example.com', '3001112233', 'Bogotá', 'Calle 1 # 2-3') $$,
  'three orders with the same contact details are allowed'
);

select throws_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address)
     values ('Cliente Uno', 'ratelimit@example.com', '3009998877', 'Bogotá', 'Calle 1 # 2-3') $$,
  '23514',
  null,
  'a fourth order reusing the same email within the hour is rejected'
);

-- ---------------------------------------------------------------------------
-- Panel de administración: sitios, canales y administradores.
-- ---------------------------------------------------------------------------

select has_table('public', 'sites', 'sites table exists');
select has_table('public', 'site_channels', 'site channels table exists');
select has_table('public', 'platform_admins', 'platform admin allowlist exists');
select has_table('public', 'site_members', 'site membership table exists');
select has_table('public', 'site_products', 'per-site products table exists');
select has_table('public', 'site_api_keys', 'per-site ingest keys table exists');
select has_table('public', 'site_accounts', 'client account table exists');
select hasnt_table('public', 'admin_users', 'the global admin allowlist is gone');

select col_is_pk('public', 'sites', 'id', 'sites have a primary key');
select col_is_pk('public', 'site_channels', 'site_id', 'site channels are keyed by site');
select col_is_pk('public', 'platform_admins', 'email', 'platform admins are keyed by email');
select col_is_pk('public', 'site_accounts', 'site_id', 'a client account belongs to one site');

select ok((select relrowsecurity from pg_class where oid = 'public.sites'::regclass), 'RLS enabled on sites');
select ok((select relrowsecurity from pg_class where oid = 'public.site_channels'::regclass), 'RLS enabled on site channels');
select ok((select relrowsecurity from pg_class where oid = 'public.platform_admins'::regclass), 'RLS enabled on platform admins');
select ok((select relrowsecurity from pg_class where oid = 'public.site_members'::regclass), 'RLS enabled on site members');
select ok((select relrowsecurity from pg_class where oid = 'public.site_products'::regclass), 'RLS enabled on site products');
select ok((select relrowsecurity from pg_class where oid = 'public.site_api_keys'::regclass), 'RLS enabled on ingest keys');
select ok((select relrowsecurity from pg_class where oid = 'public.site_accounts'::regclass), 'RLS enabled on client accounts');

select policies_are(
  'public', 'sites',
  array['anon_can_read_sites', 'members_can_read_their_sites'],
  'the site list is public to the landing but scoped once you sign in'
);
select policies_are(
  'public', 'site_channels',
  array[
    'anon_can_read_site_channels',
    'members_can_read_their_site_channels',
    'members_can_update_their_site_channels'
  ],
  'channel configuration is public to read and editable only by its own site'
);
select policies_are(
  'public', 'platform_admins',
  array['platform_can_read_platform_admins'],
  'the platform allowlist is readable only by the platform'
);
select policies_are(
  'public', 'site_members',
  array['members_can_read_their_site_members'],
  'members see their own teammates and nobody else'
);

-- Las llaves de ingesta no tienen ninguna política a propósito: con RLS activo
-- y sin políticas, una tabla no devuelve filas a ninguna sesión. Se manejan
-- solo con la clave de servicio.
select policies_are(
  'public', 'site_api_keys',
  array[]::text[],
  'ingest keys are unreachable from any signed-in session'
);

select has_column('public', 'orders_cod', 'site_id', 'orders belong to a site');
select col_not_null('public', 'orders_cod', 'site_id', 'an order cannot be orphaned from its site');
select col_has_default('public', 'orders_cod', 'site_id', 'orders fall back to a default site');

select has_function('private', 'verified_email', 'the verified email helper exists');
select has_function('private', 'is_platform_admin', 'the platform admin check exists');
select has_function('private', 'accessible_site_ids', 'the accessible sites helper exists');
select hasnt_function('private', 'is_admin', 'the global admin check is gone');

select is(
  (select count(*)::int from public.sites where slug = 'coffee-maker-pro'),
  1,
  'the Coffee Maker Pro site is created by the migration'
);
select is(
  (select count(*)::int from public.site_channels
    where site_id = 'c0ffee00-0000-4000-8000-000000000001'),
  1,
  'the default site has a channel configuration row'
);
select is(
  (select chat_enabled and voice_enabled and not whatsapp_enabled
     from public.site_channels where site_id = 'c0ffee00-0000-4000-8000-000000000001'),
  true,
  'a site starts with chat and voice on and WhatsApp off'
);

-- Un botón de WhatsApp encendido sin número lleva a una página de error de
-- WhatsApp. Lo impide la base, no la validación del panel.
select throws_ok(
  $$ update public.site_channels set whatsapp_enabled = true
     where site_id = 'c0ffee00-0000-4000-8000-000000000001' $$,
  '23514',
  null,
  'enabling WhatsApp without a phone number is rejected'
);

select lives_ok(
  $$ update public.site_channels
       set whatsapp_enabled = true, whatsapp_phone = '573001234567'
     where site_id = 'c0ffee00-0000-4000-8000-000000000001' $$,
  'enabling WhatsApp together with a number is allowed'
);

select throws_ok(
  $$ update public.site_channels set whatsapp_phone = '+57 300 123 4567'
     where site_id = 'c0ffee00-0000-4000-8000-000000000001' $$,
  '23514',
  null,
  'the WhatsApp number must be plain digits, the shape wa.me expects'
);

select throws_ok(
  $$ insert into public.sites (slug, name) values ('Landing Con Mayúsculas', 'Prueba') $$,
  '23514',
  null,
  'site slugs are restricted to a url-safe shape'
);

select throws_ok(
  $$ insert into public.platform_admins (email) values ('MAYUSCULAS@example.com') $$,
  '23514',
  null,
  'platform emails are stored lowercase, matching the verified email lookup'
);

select lives_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address)
     values ('Sitio Por Defecto', 'sitio.default@example.com', '3055556666', 'Bogotá', 'Calle 9 # 8-7') $$,
  'an order can still be created without naming a site'
);
select is(
  (select site_id from public.orders_cod where email = 'sitio.default@example.com'),
  'c0ffee00-0000-4000-8000-000000000001'::uuid,
  'orders created without a site fall back to Coffee Maker Pro'
);

-- Un administrador cambia el estado de un pedido y nada más. Una cuenta del
-- panel comprometida no debe poder reescribir el registro de una venta.
select column_privs_are(
  'public', 'orders_cod', 'status', 'authenticated',
  array['SELECT', 'UPDATE'],
  'admins can change the order status'
);
select column_privs_are(
  'public', 'orders_cod', 'address', 'authenticated',
  array['SELECT'],
  'no signed-in role can rewrite a delivery address'
);
select column_privs_are(
  'public', 'orders_cod', 'total_price', 'authenticated',
  array['SELECT'],
  'no signed-in role can rewrite the order price'
);
select table_privs_are(
  'public', 'orders_cod', 'anon',
  array[]::text[],
  'anonymous visitors keep no privileges on orders'
);

select function_privs_are(
  'private', 'verified_email', array[]::text[], 'authenticated',
  array['EXECUTE'],
  'policies running as authenticated can resolve the verified email'
);
select function_privs_are(
  'private', 'is_platform_admin', array[]::text[], 'authenticated',
  array['EXECUTE'],
  'policies running as authenticated can run the platform check'
);
select function_privs_are(
  'private', 'accessible_site_ids', array[]::text[], 'authenticated',
  array['EXECUTE'],
  'policies running as authenticated can resolve their accessible sites'
);
select function_privs_are(
  'private', 'is_platform_admin', array[]::text[], 'anon',
  array[]::text[],
  'the anonymous role cannot run the platform check'
);
select schema_privs_are(
  'private', 'anon',
  array[]::text[],
  'the anonymous role cannot reach the private schema at all'
);

-- Identidad verificada. Este es el punto exacto que dejaba leer el pedido de
-- otro: bastaba registrarse con su correo, porque la comprobación miraba el
-- claim del JWT y no si el correo estaba confirmado.
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-00000000aaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin.pgtap@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000bbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sin.confirmar@example.com', null, now(), now());

-- Ambos correos están autorizados. La diferencia es solo la confirmación.
insert into public.platform_admins (email)
values ('admin.pgtap@example.com'), ('sin.confirmar@example.com');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000aaaa","role":"authenticated"}';

select is(
  private.verified_email(),
  'admin.pgtap@example.com',
  'a confirmed account resolves to its own email'
);
select ok(private.is_platform_admin(), 'a confirmed account on the allowlist is a platform admin');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000bbbb","role":"authenticated"}';

select is(
  private.verified_email(),
  null,
  'an unconfirmed account resolves to no email at all'
);
select ok(
  not private.is_platform_admin(),
  'an unconfirmed account is not a platform admin even while on the allowlist'
);

-- ---------------------------------------------------------------------------
-- CRM y métricas.
-- ---------------------------------------------------------------------------

select has_table('public', 'order_status_events', 'order status history exists');
select has_table('public', 'contacts', 'contacts table exists');
select has_table('public', 'contact_notes', 'contact notes table exists');

select ok((select relrowsecurity from pg_class where oid = 'public.order_status_events'::regclass), 'RLS enabled on order status history');
select ok((select relrowsecurity from pg_class where oid = 'public.contacts'::regclass), 'RLS enabled on contacts');
select ok((select relrowsecurity from pg_class where oid = 'public.contact_notes'::regclass), 'RLS enabled on contact notes');

select has_function('private', 'record_order_status_event', 'the status history trigger function exists');
select has_function('private', 'attach_order_contact', 'the contact linking trigger function exists');
select has_trigger('public', 'orders_cod', 'orders_cod_record_status_event', 'orders record their status changes');
select has_trigger('public', 'orders_cod', 'orders_cod_attach_contact', 'orders are linked to a contact');

-- Las vistas de métricas tienen que conservar RLS. Sin `security_invoker` se
-- evaluarían con los permisos de quien las creó y cualquier usuario
-- autenticado leería agregados de todos los pedidos.
select ok(
  (select 'security_invoker=true' = any(reloptions) from pg_class where oid = 'public.order_daily_stats'::regclass),
  'the daily stats view runs as the caller, so RLS still applies'
);
select ok(
  (select 'security_invoker=true' = any(reloptions) from pg_class where oid = 'public.order_city_stats'::regclass),
  'the city stats view runs as the caller, so RLS still applies'
);

-- Un contacto sin correo ni celular no se puede contactar.
select throws_ok(
  $$ insert into public.contacts (full_name) values ('Sin Datos') $$,
  '23514',
  null,
  'a contact needs at least an email or a phone number'
);

-- Crear un pedido debe dejar rastro y ficha sin que la aplicación haga nada.
select lives_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address)
     values ('Cliente CRM', 'crm.test@example.com', '3071112233', 'Cali', 'Calle 5 # 6-7') $$,
  'an order can be created'
);

select is(
  (select count(*)::int from public.order_status_events e
     join public.orders_cod o on o.id = e.order_id
    where o.email = 'crm.test@example.com'
      and e.from_status is null
      and e.to_status = 'pending'),
  1,
  'creating an order records its first status event'
);

select is(
  (select c.stage from public.contacts c
     join public.orders_cod o on o.contact_id = c.id
    where o.email = 'crm.test@example.com'),
  'cliente',
  'creating an order creates and links the contact as a customer'
);

select lives_ok(
  $$ update public.orders_cod set status = 'shipped' where email = 'crm.test@example.com' $$,
  'an order status can be changed'
);

select is(
  (select count(*)::int from public.order_status_events e
     join public.orders_cod o on o.id = e.order_id
    where o.email = 'crm.test@example.com'
      and e.from_status = 'pending'
      and e.to_status = 'shipped'),
  1,
  'changing the status records the transition'
);

-- Un prospecto que compra se reutiliza. Duplicar la ficha partiría su
-- historial en dos y el CRM dejaría de servir.
select lives_ok(
  $$ insert into public.contacts (full_name, phone, stage, source)
     values ('Prospecto Prueba', '3080001122', 'por_contactar', 'whatsapp') $$,
  'a prospect can be created before buying anything'
);

select lives_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address)
     values ('Prospecto Prueba', 'prospecto.test@example.com', '3080001122', 'Cali', 'Calle 8 # 9-10') $$,
  'the prospect places an order'
);

select is(
  (select count(*)::int from public.contacts where phone = '3080001122'),
  1,
  'the prospect is reused instead of duplicated'
);

select is(
  (select source from public.contacts where phone = '3080001122'),
  'whatsapp',
  'the original source survives the purchase'
);

-- El historial es un registro, no un campo editable.
select column_privs_are(
  'public', 'order_status_events', 'to_status', 'authenticated',
  array['SELECT'],
  'nobody can rewrite the status history from the application'
);

select column_privs_are(
  'public', 'contacts', 'stage', 'authenticated',
  array['SELECT', 'INSERT', 'UPDATE'],
  'admins can move a contact between stages'
);

select table_privs_are(
  'public', 'contacts', 'anon',
  array[]::text[],
  'the CRM is invisible to anonymous visitors'
);

-- ---------------------------------------------------------------------------
-- Frontera multi-inquilino.
--
-- Estas son las pruebas que sostienen el negocio de la plataforma: si alguna
-- cae, un cliente está viendo los pedidos de otro. Todo lo demás del panel se
-- puede arreglar en caliente; esto no.
-- ---------------------------------------------------------------------------

select has_column('public', 'orders_cod', 'product_id', 'orders point at the product sold');
select hasnt_column('public', 'sites', 'monthly_fee', 'billing never lives on the table the landing reads');

-- El precio dejó de estar cableado a 490000, pero no quedó sin vigilancia: la
-- comprobación se mudó del `check` al trigger.
select has_function('private', 'enforce_order_price', 'the price guard exists');
select has_trigger('public', 'orders_cod', 'orders_cod_enforce_price', 'the price guard is attached');
select is(
  (select count(*)::int from pg_constraint
    where conrelid = 'public.orders_cod'::regclass
      and conname = 'orders_cod_total_price_check'),
  0,
  'the hardcoded 490000 price constraint is gone'
);

-- Dos sitios, dos precios distintos. Antes de este cambio el segundo era
-- imposible: la base rechazaba cualquier importe que no fuera 490000.
insert into public.sites (id, slug, name)
values ('00000000-0000-4000-8000-00000000e001', 'inquilino-a', 'Inquilino A'),
       ('00000000-0000-4000-8000-00000000e002', 'inquilino-b', 'Inquilino B');

insert into public.site_channels (site_id)
values ('00000000-0000-4000-8000-00000000e001'),
       ('00000000-0000-4000-8000-00000000e002');

insert into public.site_products (id, site_id, name, price)
values ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001', 'Producto A', 120000),
       ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e002', 'Producto B', 350000);

select lives_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address, total_price, site_id)
     values ('Compra A', 'compra.a@example.com', '3200000001', 'Cali', 'Calle A 1-2',
             120000, '00000000-0000-4000-8000-00000000e001') $$,
  'a second tenant can sell at its own price'
);

select is(
  (select product_id from public.orders_cod where email = 'compra.a@example.com'),
  '00000000-0000-4000-8000-00000000f001'::uuid,
  'an order with a single active product resolves it without being told'
);

select throws_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address, total_price, site_id)
     values ('Precio Falso', 'precio.falso@example.com', '3200000002', 'Cali', 'Calle A 3-4',
             1000, '00000000-0000-4000-8000-00000000e001') $$,
  '23514',
  null,
  'an order whose price does not match its product is rejected'
);

-- Cruzar el producto de un sitio con el `site_id` de otro es la forma obvia de
-- intentar cobrar de menos. El trigger exige que ambos coincidan.
select throws_ok(
  $$ insert into public.orders_cod (full_name, email, phone, city, address, total_price, site_id, product_id)
     values ('Producto Ajeno', 'producto.ajeno@example.com', '3200000003', 'Cali', 'Calle A 5-6',
             120000, '00000000-0000-4000-8000-00000000e002',
             '00000000-0000-4000-8000-00000000f001') $$,
  '23514',
  null,
  'a product from another site cannot be attached to an order'
);

insert into public.orders_cod (full_name, email, phone, city, address, total_price, site_id)
values ('Compra B', 'compra.b@example.com', '3200000004', 'Bogotá', 'Calle B 1-2',
        350000, '00000000-0000-4000-8000-00000000e002');

-- Dos cuentas confirmadas, cada una miembro de un solo sitio.
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-00000000ee01', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'duena.a@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000ee02', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dueno.b@example.com', now(), now(), now());

insert into public.site_members (site_id, email)
values ('00000000-0000-4000-8000-00000000e001', 'duena.a@example.com'),
       ('00000000-0000-4000-8000-00000000e002', 'dueno.b@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000ee01","role":"authenticated"}';

select is(
  (select count(*)::int from public.orders_cod
    where site_id = '00000000-0000-4000-8000-00000000e002'),
  0,
  'a tenant cannot read a single order belonging to another tenant'
);
select is(
  (select count(*)::int from public.orders_cod),
  1,
  'a tenant sees exactly its own orders and nothing else'
);
select is(
  (select count(*)::int from public.sites
    where id <> '00000000-0000-4000-8000-00000000e001'),
  0,
  'a tenant cannot even enumerate the other clients of the platform'
);
select is(
  (select count(*)::int from public.contacts
    where site_id <> '00000000-0000-4000-8000-00000000e001'),
  0,
  'the CRM of another tenant is invisible'
);

-- Las vistas de métricas son `security_invoker`, así que arrastran las
-- políticas de `orders_cod`. Sin eso se evaluarían con los permisos de quien
-- las creó y entregarían agregados de todos los sitios.
select is(
  (select count(*)::int from public.order_daily_stats
    where site_id <> '00000000-0000-4000-8000-00000000e001'),
  0,
  'the metrics views carry the tenant boundary with them'
);
select is(
  (select count(*)::int from public.order_city_stats
    where site_id <> '00000000-0000-4000-8000-00000000e001'),
  0,
  'the city breakdown carries the tenant boundary too'
);

-- Cambiar el estado de un pedido ajeno no da error: simplemente no alcanza
-- ninguna fila. Es el comportamiento correcto de RLS y conviene fijarlo, para
-- que nadie lo confunda con un fallo silencioso.
-- Cambiar algo de un sitio ajeno no da error: simplemente no alcanza ninguna
-- fila. Es el comportamiento correcto de RLS y conviene fijarlo, para que nadie
-- lo confunda con un fallo silencioso. Que no cambió nada se comprueba más
-- abajo, desde la plataforma: este inquilino no puede ni leer esas filas para
-- verificarlo, que es justamente el punto.
select lives_ok(
  $$ update public.orders_cod set status = 'cancelled'
     where site_id = '00000000-0000-4000-8000-00000000e002' $$,
  'updating another tenant order raises nothing'
);
select lives_ok(
  $$ update public.site_channels set chat_enabled = false
     where site_id = '00000000-0000-4000-8000-00000000e002' $$,
  'updating another tenant channels raises nothing'
);
select is(
  (select count(*)::int from public.site_channels
    where site_id = '00000000-0000-4000-8000-00000000e002'),
  0,
  'signed in, a tenant cannot even read another site channels'
);

-- Dos capas, no una: además de no tener política, `site_api_keys` no tiene
-- concedido el permiso de tabla. La consulta ni siquiera llega al RLS.
select throws_ok(
  $$ select 1 from public.site_api_keys $$,
  '42501',
  null,
  'ingest keys are unreachable: no grant, not just no policy'
);
select is(
  (select count(*)::int from public.site_accounts),
  0,
  'a tenant cannot read its own billing record, let alone anyone else''s'
);

-- El otro inquilino, para comprobar que la separación es simétrica y no un
-- accidente del orden de las filas.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000ee02","role":"authenticated"}';

select is(
  (select count(*)::int from public.orders_cod),
  1,
  'the boundary is symmetric: the second tenant also sees only its own'
);
select is(
  (select email from public.orders_cod),
  'compra.b@example.com',
  'and what it sees is its own order, not the neighbour one'
);

-- La plataforma sí ve todo. Sin esto el panel de Juan no sirve para operar.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000aaaa","role":"authenticated"}';

select ok(
  (select count(*)::int from public.orders_cod) >= 2,
  'the platform admin reaches every tenant'
);
select ok(
  (select count(*)::int from public.sites) >= 3,
  'the platform admin enumerates every site'
);
select ok(
  (select count(*)::int from public.site_accounts) > 0,
  'the platform admin is the only one who reads billing'
);

-- Lo que el inquilino no pudo comprobar por sí mismo: sus dos intentos de
-- escritura cruzada no movieron nada.
select is(
  (select status from public.orders_cod where email = 'compra.b@example.com'),
  'pending',
  'the cross-tenant status update changed nothing'
);
select is(
  (select chat_enabled from public.site_channels
    where site_id = '00000000-0000-4000-8000-00000000e002'),
  true,
  'the cross-tenant channel update changed nothing either'
);

reset role;

select * from finish();
rollback;
