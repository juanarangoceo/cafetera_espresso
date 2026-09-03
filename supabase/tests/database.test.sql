begin;

create extension if not exists pgtap with schema extensions;

select plan(217);

select has_table('public', 'orders_cod', 'orders table exists');
select has_table('public', 'leads', 'leads table exists');
select has_table('public', 'chat_sessions', 'chat sessions table exists');
select has_table('public', 'chat_messages', 'chat messages table exists');
select has_table('public', 'legal_documents', 'versioned legal documents table exists');
select has_table('public', 'client_legal_acceptances', 'client legal evidence table exists');
select has_function('public', 'publish_legal_document', 'atomic legal publication function exists');

select col_is_pk('public', 'orders_cod', 'id', 'orders have a primary key');
select col_is_pk('public', 'leads', 'id', 'leads have a primary key');
select col_is_pk('public', 'chat_sessions', 'id', 'chat sessions have a primary key');
select col_is_pk('public', 'chat_messages', 'id', 'chat messages have a primary key');

select ok((select relrowsecurity from pg_class where oid = 'public.orders_cod'::regclass), 'RLS enabled on orders');
select ok((select relrowsecurity from pg_class where oid = 'public.leads'::regclass), 'RLS enabled on leads');
select ok((select relrowsecurity from pg_class where oid = 'public.chat_sessions'::regclass), 'RLS enabled on chat sessions');
select ok((select relrowsecurity from pg_class where oid = 'public.chat_messages'::regclass), 'RLS enabled on chat messages');
select ok((select relrowsecurity from pg_class where oid = 'public.legal_documents'::regclass), 'RLS enabled on legal documents');
select ok((select relrowsecurity from pg_class where oid = 'public.client_legal_acceptances'::regclass), 'RLS enabled on legal evidence');

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
select has_table('public', 'site_tracking', 'per-site tracking settings table exists');
select has_table('public', 'platform_admins', 'platform admin allowlist exists');
select has_table('public', 'client_members', 'client membership table exists');
select hasnt_table('public', 'site_members', 'per-landing membership model is gone');
select has_table('public', 'site_products', 'per-site products table exists');
select has_table('public', 'site_api_keys', 'per-site ingest keys table exists');
select has_table('public', 'clients', 'corporate client table exists');
select hasnt_table('public', 'site_accounts', 'the one-account-per-site model is gone');
select hasnt_table('public', 'admin_users', 'the global admin allowlist is gone');

select col_is_pk('public', 'sites', 'id', 'sites have a primary key');
select col_is_pk('public', 'site_channels', 'site_id', 'site channels are keyed by site');
select col_is_pk('public', 'platform_admins', 'email', 'platform admins are keyed by email');
select col_is_pk('public', 'clients', 'id', 'clients have an identity independent from landings');
select has_column('public', 'sites', 'client_id', 'landings belong to a corporate client');

select ok((select relrowsecurity from pg_class where oid = 'public.sites'::regclass), 'RLS enabled on sites');
select ok((select relrowsecurity from pg_class where oid = 'public.site_channels'::regclass), 'RLS enabled on site channels');
select ok((select relrowsecurity from pg_class where oid = 'public.site_tracking'::regclass), 'RLS enabled on site tracking');
select ok((select relrowsecurity from pg_class where oid = 'public.platform_admins'::regclass), 'RLS enabled on platform admins');
select ok((select relrowsecurity from pg_class where oid = 'public.client_members'::regclass), 'RLS enabled on client members');
select ok((select relrowsecurity from pg_class where oid = 'public.site_products'::regclass), 'RLS enabled on site products');
select ok((select relrowsecurity from pg_class where oid = 'public.site_api_keys'::regclass), 'RLS enabled on ingest keys');
select ok((select relrowsecurity from pg_class where oid = 'public.clients'::regclass), 'RLS enabled on corporate clients');

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
  'public', 'site_tracking',
  array[
    'anon_can_read_site_tracking',
    'members_can_read_their_site_tracking',
    'members_can_update_their_site_tracking'
  ],
  'tracking is public to landings and tenant-scoped for client updates'
);
select col_is_pk('public', 'site_tracking', 'site_id', 'tracking is keyed by site');
select col_has_default('public', 'site_tracking', 'meta_pixel_enabled', 'new Pixels start disabled');
-- La guía viaja desde Nitro Bot, que escribe con service_role. La sesión del
-- cliente puede LEERLA —el panel viejo sigue de respaldo— pero no fijarla: dos
-- sitios escribiendo el mismo despacho son dos verdades.
select column_privs_are(
  'public', 'orders_cod', 'tracking_number', 'authenticated', array['SELECT'],
  'client sessions can read the tracking number but never write it'
);
select column_privs_are(
  'public', 'orders_cod', 'tracking_carrier', 'authenticated', array['SELECT'],
  'client sessions can read the carrier but never write it'
);
select column_privs_are(
  'public', 'order_status_events', 'note', 'authenticated', array['SELECT'],
  'the reason a status moved is readable, and only the server writes it'
);
select column_privs_are(
  'public', 'orders_cod', 'tracking_number', 'anon', array[]::text[],
  'a landing visitor cannot read anyone tracking number'
);

select column_privs_are(
  'public', 'site_tracking', 'site_id', 'anon', array['SELECT'],
  'anonymous landings can resolve the public tracking row'
);
select column_privs_are(
  'public', 'site_tracking', 'meta_pixel_enabled', 'anon', array['SELECT'],
  'anonymous landings can read whether Meta is enabled'
);
select column_privs_are(
  'public', 'site_tracking', 'meta_pixel_id', 'anon', array['SELECT'],
  'anonymous landings can read the public Pixel ID'
);
select column_privs_are(
  'public', 'site_tracking', 'site_id', 'authenticated', array['SELECT'],
  'client sessions can identify their tracking row but not move it'
);
select column_privs_are(
  'public', 'site_tracking', 'meta_pixel_enabled', 'authenticated', array['SELECT', 'UPDATE'],
  'client sessions can read and toggle Meta for their own landing'
);
select column_privs_are(
  'public', 'site_tracking', 'meta_pixel_id', 'authenticated', array['SELECT', 'UPDATE'],
  'client sessions can read and change their own public Pixel ID'
);
select column_privs_are(
  'public', 'site_tracking', 'updated_at', 'authenticated', array[]::text[],
  'client sessions cannot forge the tracking update timestamp'
);
select policies_are(
  'public', 'platform_admins',
  array['platform_can_read_platform_admins'],
  'the platform allowlist is readable only by the platform'
);
select policies_are(
  'public', 'client_members',
  array['members_can_read_their_client_members'],
  'members see teammates from their own client and nobody else'
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
  $$ insert into public.sites (client_id, slug, name)
     values ('c0ffee00-0000-4000-8000-000000000001', 'Landing Con Mayúsculas', 'Prueba') $$,
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
insert into public.clients (id, name)
values ('00000000-0000-4000-8000-00000000e001', 'Cliente A'),
       ('00000000-0000-4000-8000-00000000e002', 'Cliente B'),
       ('00000000-0000-4000-8000-00000000e099', 'Cliente sin landing');

insert into public.sites (id, client_id, slug, name)
values ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000e001', 'inquilino-a', 'Inquilino A'),
       ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000e002', 'inquilino-b', 'Inquilino B'),
       ('00000000-0000-4000-8000-00000000e003', '00000000-0000-4000-8000-00000000e001', 'inquilino-a-dos', 'Segunda landing A');

insert into public.site_channels (site_id)
values ('00000000-0000-4000-8000-00000000e001'),
       ('00000000-0000-4000-8000-00000000e002'),
       ('00000000-0000-4000-8000-00000000e003');

select lives_ok(
  $$ insert into public.site_tracking (site_id, meta_pixel_id)
     values ('00000000-0000-4000-8000-00000000e001', '1234567890') $$,
  'a numeric Meta Pixel ID is accepted'
);
select throws_ok(
  $$ update public.site_tracking set meta_pixel_id = '<script>alert(1)</script>'
     where site_id = '00000000-0000-4000-8000-00000000e001' $$,
  '23514', null,
  'arbitrary scripts cannot be stored as a Pixel ID'
);
select throws_ok(
  $$ insert into public.site_tracking (site_id, meta_pixel_enabled)
     values ('00000000-0000-4000-8000-00000000e002', true) $$,
  '23514', null,
  'Meta cannot be enabled without a Pixel ID'
);
insert into public.site_tracking (site_id, meta_pixel_id)
values ('00000000-0000-4000-8000-00000000e002', null),
       ('00000000-0000-4000-8000-00000000e003', '3333333333');

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

-- Dos cuentas confirmadas, cada una miembro de un cliente. La primera debe
-- heredar automáticamente las dos landings presentes y cualquier futura.
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-00000000ee01', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'duena.a@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000ee02', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dueno.b@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000ee99', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sin.landing@example.com', now(), now(), now());

insert into public.client_members (client_id, email)
values ('00000000-0000-4000-8000-00000000e001', 'duena.a@example.com'),
       ('00000000-0000-4000-8000-00000000e002', 'dueno.b@example.com'),
       ('00000000-0000-4000-8000-00000000e099', 'sin.landing@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000ee99","role":"authenticated"}';

select is(
  (select count(*)::int from public.client_members
    where email = 'sin.landing@example.com'),
  1,
  'a confirmed client member can identify their account before the first landing exists'
);

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
    where client_id <> '00000000-0000-4000-8000-00000000e001'),
  0,
  'a tenant cannot even enumerate the other clients of the platform'
);
select is(
  (select count(*)::int from public.sites),
  2,
  'one client membership automatically exposes every landing of that client'
);
select is(
  (select count(*)::int from public.site_tracking),
  2,
  'a client reads tracking only for every landing of its own company'
);
select lives_ok(
  $$ update public.site_tracking set meta_pixel_enabled = true
     where site_id = '00000000-0000-4000-8000-00000000e003' $$,
  'a client can enable Meta on its own landing'
);
select lives_ok(
  $$ update public.site_tracking set meta_pixel_id = '9999999999'
     where site_id = '00000000-0000-4000-8000-00000000e002' $$,
  'an update aimed at another tenant reveals no authorization error'
);

reset role;
select is(
  (select meta_pixel_id from public.site_tracking
    where site_id = '00000000-0000-4000-8000-00000000e002'),
  null,
  'RLS prevents changing another tenant Pixel ID'
);
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000ee01","role":"authenticated"}';
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
select throws_ok(
  $$ select 1 from public.clients $$,
  '42501',
  null,
  'corporate client records have no browser-session grant'
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

-- La plataforma administra clientes desde acciones de servidor, pero su sesion
-- no recibe acceso operativo. Esta es la frontera que impide ver PII aunque
-- alguien intente abrir manualmente una ruta o consultar Supabase.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000aaaa","role":"authenticated"}';

select is(
  (select count(*)::int from public.orders_cod),
  0,
  'the platform session cannot read any client order'
);
select is(
  (select count(*)::int from public.sites),
  0,
  'the platform session cannot enter a client operational site'
);
select throws_ok(
  $$ select 1 from public.clients $$,
  '42501',
  null,
  'corporate data is only available to guarded server actions'
);

-- Lo que el inquilino no pudo comprobar por sí mismo: sus dos intentos de
-- escritura cruzada no movieron nada.
reset role;

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

-- ---------------------------------------------------------------------------
-- Nitro Intake: enlaces privados y archivos editoriales.
-- ---------------------------------------------------------------------------

select has_table('public', 'intake_requests', 'intake requests table exists');
select has_table('public', 'intake_files', 'intake files table exists');
select col_is_pk('public', 'intake_requests', 'id', 'intake requests have a primary key');
select col_is_pk('public', 'intake_files', 'id', 'intake files have a primary key');
select has_column('public', 'intake_requests', 'token_hash', 'only the intake token hash is persisted');
select has_column('public', 'intake_requests', 'answers', 'the verified brief draft is persisted');
select has_column('public', 'intake_requests', 'provisional_name', 'an intake can carry a name before client creation');
select has_column('public', 'intake_requests', 'slug', 'an intake reserves its future landing slug');
select col_is_null('public', 'intake_requests', 'site_id', 'an intake can exist before a site');
select hasnt_column('public', 'intake_requests', 'drive_folder_id', 'intakes no longer depend on a Drive folder');
select hasnt_column('public', 'intake_files', 'drive_file_id', 'files no longer depend on a Drive identity');
select has_column('public', 'intake_files', 'stored_at', 'permanent files record when Storage accepted them');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.intake_requests'::regclass),
  'RLS enabled on intake requests'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.intake_files'::regclass),
  'RLS enabled on intake files'
);
select policies_are(
  'public', 'intake_requests', array[]::text[],
  'intake requests expose no browser policy'
);
select policies_are(
  'public', 'intake_files', array[]::text[],
  'intake files expose no browser policy'
);
select table_privs_are(
  'public', 'intake_requests', 'anon', array[]::text[],
  'anonymous visitors cannot query intake requests directly'
);
select table_privs_are(
  'public', 'intake_requests', 'authenticated', array[]::text[],
  'signed-in clients cannot enumerate intake requests'
);
select table_privs_are(
  'public', 'intake_files', 'anon', array[]::text[],
  'anonymous visitors cannot query intake files directly'
);
select table_privs_are(
  'public', 'intake_files', 'authenticated', array[]::text[],
  'signed-in clients cannot enumerate intake files'
);
select throws_ok(
  $$ insert into public.intake_requests
       (site_id, provisional_name, slug, token_hash, created_by)
     values (
       'c0ffee00-0000-4000-8000-000000000001',
       'Hash inválido',
       'hash-invalido',
       'not-a-sha256',
       'platform@example.com'
     ) $$,
  '23514', null,
  'an intake token must be stored as a SHA-256 hash'
);
select lives_ok(
  $$ insert into public.intake_requests
       (site_id, provisional_name, slug, token_hash, created_by)
     values (
       null,
       'Marca antes del alta',
       'marca-antes-del-alta',
       repeat('a', 64),
       'platform@example.com'
     ) $$,
  'a standalone intake can be created without client, site, product or price'
);
select is(
  (select site_id from public.intake_requests where slug = 'marca-antes-del-alta'),
  null::uuid,
  'the standalone intake stays unlinked until platform conversion'
);
select throws_ok(
  $$ insert into public.intake_requests
       (site_id, provisional_name, slug, token_hash, created_by)
     values (
       null,
       'Marca repetida',
       'marca-antes-del-alta',
       repeat('b', 64),
       'platform@example.com'
     ) $$,
  '23505', null,
  'two active standalone intakes cannot reserve the same slug'
);
select lives_ok(
  $$ update public.intake_requests
       set status = 'revoked', revoked_at = now()
     where slug = 'marca-antes-del-alta' $$,
  'revoking a standalone intake releases its reserved slug'
);
select throws_ok(
  $$ insert into public.intake_files
       (request_id, category, original_name, mime_type, size_bytes, storage_path, status)
     values (
       (select id from public.intake_requests where slug = 'marca-antes-del-alta'),
       'marca', 'logo.png', 'image/png', 1200,
       '00000000-0000-4000-8000-00000000f001/marca/logo.png', 'stored'
     ) $$,
  '23514', null,
  'a stored file must record when Storage accepted it'
);
select lives_ok(
  $$ insert into public.intake_files
       (request_id, category, original_name, mime_type, size_bytes, storage_path, status, stored_at)
     values (
       (select id from public.intake_requests where slug = 'marca-antes-del-alta'),
       'marca', 'logo.png', 'image/png', 1200,
       '00000000-0000-4000-8000-00000000f001/marca/logo-stored.png', 'stored', now()
     ) $$,
  'a verified Storage object can be marked as permanently stored'
);

-- Evidencia legal: ningún navegador puede consultar ni fabricar aceptaciones.
-- Solo el servidor de plataforma las registra después de volver a comprobar
-- la sesión y la pertenencia del usuario al cliente.
select policies_are('public', 'legal_documents', array[]::text[], 'legal documents have no browser policies');
select policies_are('public', 'client_legal_acceptances', array[]::text[], 'legal evidence has no browser policies');
select table_privs_are('public', 'legal_documents', 'anon', array[]::text[], 'anonymous users cannot read legal documents');
select table_privs_are('public', 'legal_documents', 'authenticated', array[]::text[], 'client sessions cannot query legal documents directly');
select table_privs_are('public', 'client_legal_acceptances', 'anon', array[]::text[], 'anonymous users cannot read legal evidence');
select table_privs_are('public', 'client_legal_acceptances', 'authenticated', array[]::text[], 'client sessions cannot query legal evidence directly');
select function_privs_are(
  'public', 'publish_legal_document', array['text', 'text', 'text', 'text', 'text'],
  'authenticated', array[]::text[],
  'client sessions cannot publish legal text'
);
select col_not_null('public', 'client_legal_acceptances', 'document_sha256', 'an acceptance always identifies exact content');
select col_not_null('public', 'client_legal_acceptances', 'accepted_at', 'an acceptance always has a server timestamp');
select has_index('public', 'client_legal_acceptances', 'client_legal_acceptances_user_idx', 'legal evidence indexes the accepting user');

select lives_ok(
  $$ insert into public.legal_documents
       (id, document_type, version, title, body_markdown, content_sha256, status, published_at, created_by)
     values (
       '00000000-0000-4000-8000-00000000a001', 'service_terms', '2026-08',
       'Términos del servicio', repeat('Texto revisado. ', 10), repeat('a', 64),
       'published', now(), 'platform@example.com'
     ) $$,
  'a reviewed legal document can be published'
);
select throws_ok(
  $$ insert into public.legal_documents
       (document_type, version, title, body_markdown, content_sha256, status, published_at, created_by)
     values (
       'service_terms', '2026-09', 'Otros términos', repeat('Texto revisado. ', 10), repeat('b', 64),
       'published', now(), 'platform@example.com'
     ) $$,
  '23505', null,
  'only one version of each document type can be current'
);
select lives_ok(
  $$ insert into public.client_legal_acceptances
       (client_id, document_id, document_type, document_version, document_title,
        document_sha256, user_id, accepted_email, acceptance_statement)
     values (
       '00000000-0000-4000-8000-00000000e001',
       '00000000-0000-4000-8000-00000000a001', 'service_terms', '2026-08',
       'Términos del servicio', repeat('a', 64),
       '00000000-0000-4000-8000-00000000ee01', 'duena.a@example.com',
       'Declaro que tengo autorización para aceptar en nombre del cliente.'
     ) $$,
  'the server can append acceptance evidence'
);
select is(
  (select document_sha256 from public.client_legal_acceptances
    where document_id = '00000000-0000-4000-8000-00000000a001'),
  repeat('a', 64),
  'the database snapshots the published hash instead of trusting the caller'
);
select throws_ok(
  $$ update public.client_legal_acceptances
       set accepted_email = 'otra@example.com'
     where document_id = '00000000-0000-4000-8000-00000000a001' $$,
  '55000', null,
  'acceptance evidence cannot be rewritten'
);
select throws_ok(
  $$ delete from public.client_legal_acceptances
     where document_id = '00000000-0000-4000-8000-00000000a001' $$,
  '55000', null,
  'acceptance evidence cannot be deleted'
);
select throws_ok(
  $$ update public.legal_documents set body_markdown = repeat('Alterado. ', 20)
     where id = '00000000-0000-4000-8000-00000000a001' $$,
  '55000', null,
  'published legal content cannot be rewritten'
);
select throws_ok(
  $$ delete from public.legal_documents
     where id = '00000000-0000-4000-8000-00000000a001' $$,
  '55000', null,
  'published legal content cannot be deleted'
);
-- Campos opcionales del formulario de pedido -------------------------------
select col_is_null('public', 'orders_cod', 'email', 'the order email can be absent');
select col_is_null('public', 'orders_cod', 'city', 'the order city can be absent');
select col_not_null('public', 'orders_cod', 'full_name', 'the buyer name is never optional');
select col_not_null('public', 'orders_cod', 'phone', 'the buyer phone is never optional');
select col_not_null('public', 'orders_cod', 'address', 'the delivery address is never optional');
select col_has_default('public', 'site_channels', 'require_email', 'sites ask for email unless told otherwise');
select col_has_default('public', 'site_channels', 'require_city', 'sites ask for city unless told otherwise');

select lives_ok(
  $$ insert into public.orders_cod
       (site_id, product_id, full_name, email, phone, city, address, total_price, status)
     values (
       'c0ffee00-0000-4000-8000-000000000001',
       'c0ffee00-0000-4000-8000-000000000101',
       'Compradora Sin Correo', null, '3009998877', null,
       'Calle 1 # 2-3', 490000, 'pending'
     ) $$,
  'an order can be stored without email or city'
);

-- Aflojar la obligatoriedad no afloja el formato: un correo presente sigue
-- teniendo que ser un correo.
select throws_ok(
  $$ insert into public.orders_cod
       (site_id, product_id, full_name, email, phone, city, address, total_price, status)
     values (
       'c0ffee00-0000-4000-8000-000000000001',
       'c0ffee00-0000-4000-8000-000000000101',
       'Compradora Con Correo Roto', 'esto-no-es-un-correo', '3009998866', 'Pereira',
       'Calle 1 # 2-3', 490000, 'pending'
     ) $$,
  '23514', null,
  'a present email still has to look like an email'
);

-- Permisos por columna de lo añadido hoy ------------------------------------
-- Este esquema concede `select` columna por columna: sin el grant, la consulta
-- entera falla y el panel concluye que el cliente no tiene landings.
select column_privs_are(
  'public', 'sites', 'production_url', 'authenticated', array['SELECT'],
  'the client can read the public address of its own landing'
);
select column_privs_are(
  'public', 'site_channels', 'require_email', 'authenticated', array['SELECT', 'UPDATE'],
  'the client can read and change whether email is required'
);
select column_privs_are(
  'public', 'site_channels', 'require_city', 'authenticated', array['SELECT', 'UPDATE'],
  'the client can read and change whether city is required'
);
select column_privs_are(
  'public', 'site_channels', 'require_email', 'anon', array['SELECT'],
  'the shared-deployment landing can read its own field requirements'
);
select column_privs_are(
  'public', 'sites', 'production_url', 'anon', array[]::text[],
  'anonymous visitors have no business reading deployment addresses'
);

select * from finish();
rollback;
