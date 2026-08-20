import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.development.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key || !url.startsWith('http://127.0.0.1:')) {
  throw new Error('La verificación solo puede ejecutarse contra Supabase local.');
}

// Desde que la creación de pedidos dejó de estar abierta al rol anónimo, la
// verificación necesita también la clave de servidor. Se toma del estado de la
// instancia local para no depender de archivos de entorno ni fijarla en el repo.
const statusOutput = execFileSync(
  'npx',
  ['--yes', 'supabase', 'status', '-o', 'json'],
  { encoding: 'utf8' },
);
// `supabase status` antepone líneas informativas y el JSON puede venir
// formateado en varias líneas, así que se recorta desde la primera llave.
const jsonStart = statusOutput.indexOf('{');
const secretKey =
  jsonStart === -1 ? undefined : JSON.parse(statusOutput.slice(jsonStart)).SECRET_KEY;

if (!secretKey) {
  throw new Error('No se pudo leer la clave de servidor de la instancia local.');
}

const anonymous = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const service = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = Date.now();
const email = `cliente.local+${suffix}@example.com`;
const password = `Local-${suffix}-Seguro!`;

const { error: leadError } = await anonymous
  .from('leads')
  .insert({ email: `lead.local+${suffix}@example.com`, source: 'ebook_barista_guide' });
if (leadError) throw leadError;

// La creación de pedidos ya no está abierta al rol anónimo: la publishable key
// viaja al navegador, así que permitirlo dejaba una vía para insertar pedidos
// sin pasar por la verificación de humano del servidor.
const { error: orderError } = await anonymous.from('orders_cod').insert({
  full_name: 'Cliente Verificación',
  email,
  phone: '3000000000',
  city: 'Medellín',
  address: 'Dirección local de verificación 123',
  total_price: 490000,
  status: 'pending',
});
if (!orderError) {
  throw new Error('Un visitante anónimo pudo crear un pedido directamente.');
}

// El pedido legítimo lo escribe el servidor, que es el único camino disponible.
const { error: serverOrderError } = await service.from('orders_cod').insert({
  full_name: 'Cliente Verificación',
  email,
  phone: '3000000000',
  city: 'Medellín',
  address: 'Dirección local de verificación 123',
  total_price: 490000,
  status: 'pending',
});
if (serverOrderError) throw serverOrderError;

const { error: anonymousReadError } = await anonymous.from('orders_cod').select('id');
if (!anonymousReadError) {
  throw new Error('RLS falló: un visitante anónimo pudo leer pedidos.');
}

// El servidor sí puede escribir, y la restricción de precio sigue vigente.
const { error: tamperedPriceError } = await service.from('orders_cod').insert({
  full_name: 'Precio Alterado',
  email: `tampered.local+${suffix}@example.com`,
  phone: '3000000000',
  city: 'Medellín',
  address: 'Dirección local de verificación 456',
  total_price: 1,
  status: 'pending',
});
if (!tamperedPriceError) {
  throw new Error('La restricción de precio aceptó un valor manipulado.');
}

// Registro con contraseña usando el correo de un comprador.
//
// Esta es la regresión que importa: con la confirmación de correo desactivada,
// registrarse con el correo ajeno devolvía sesión al instante y la política de
// lectura, que confiaba en el claim `email` del JWT, entregaba el pedido de esa
// persona con su nombre, celular y dirección.
const impostor = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: impostorSignup, error: impostorError } = await impostor.auth.signUp({
  email,
  password,
});
if (impostorError) throw impostorError;
if (impostorSignup.session) {
  throw new Error(
    'Un registro sin confirmar obtuvo sesión: revisa enable_confirmations en supabase/config.toml. ' +
      'Ojo: `supabase db reset` no recarga config.toml, hace falta `supabase stop && supabase start`.',
  );
}

const { data: impostorOrders } = await impostor.from('orders_cod').select('id,email');
if (impostorOrders?.length) {
  throw new Error('Un registro sin confirmar pudo leer pedidos ajenos.');
}

// Cliente con el correo ya confirmado: es el estado en el que queda alguien que
// abrió su enlace mágico. Se crea con la API de administración para no depender
// del buzón local.
const { error: confirmError } = await service.auth.admin.createUser({
  email: `confirmado.local+${suffix}@example.com`,
  password,
  email_confirm: true,
});
if (confirmError) throw confirmError;

const { error: confirmedOrderError } = await service.from('orders_cod').insert({
  full_name: 'Cliente Confirmado',
  email: `confirmado.local+${suffix}@example.com`,
  phone: '3000000001',
  city: 'Medellín',
  address: 'Dirección local de verificación 789',
  total_price: 490000,
  status: 'pending',
});
if (confirmedOrderError) throw confirmedOrderError;

const customer = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: customerLoginError } = await customer.auth.signInWithPassword({
  email: `confirmado.local+${suffix}@example.com`,
  password,
});
if (customerLoginError) throw customerLoginError;

const { data: ownOrders, error: ownOrdersError } = await customer
  .from('orders_cod')
  .select('id,email,status');
if (ownOrdersError) throw ownOrdersError;
if (ownOrders?.length !== 1 || ownOrders[0].email !== `confirmado.local+${suffix}@example.com`) {
  throw new Error('RLS no devolvió exactamente el pedido del cliente confirmado.');
}

// Un cliente no es administrador: no ve pedidos ajenos ni toca la
// configuración. Cuando RLS oculta la fila, PostgREST no devuelve error —la
// actualización afecta cero filas—, así que la comprobación mira lo devuelto.
const { data: customerChannelWrite, error: customerChannelError } = await customer
  .from('site_channels')
  .update({ chat_enabled: false })
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001')
  .select('site_id');
if (!customerChannelError && customerChannelWrite?.length) {
  throw new Error('Un cliente pudo apagar un canal de la landing.');
}

// Administrador.
const adminEmail = `admin.local+${suffix}@example.com`;
const { error: adminCreateError } = await service.auth.admin.createUser({
  email: adminEmail,
  password,
  email_confirm: true,
});
if (adminCreateError) throw adminCreateError;

const { error: allowlistError } = await service
  .from('platform_admins')
  .insert({ email: adminEmail });
if (allowlistError) throw allowlistError;

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: adminLoginError } = await admin.auth.signInWithPassword({
  email: adminEmail,
  password,
});
if (adminLoginError) throw adminLoginError;

const { data: allOrders, error: allOrdersError } = await admin
  .from('orders_cod')
  .select('id,email,status');
if (allOrdersError) throw allOrdersError;
if ((allOrders?.length ?? 0) < 2) {
  throw new Error('El administrador no pudo leer los pedidos de todos los clientes.');
}

const { data: updated, error: statusError } = await admin
  .from('orders_cod')
  .update({ status: 'confirmed' })
  .eq('id', ownOrders[0].id)
  .select('id,status');
if (statusError) throw statusError;
if (updated?.[0]?.status !== 'confirmed') {
  throw new Error('El administrador no pudo cambiar el estado de un pedido.');
}

// El permiso está otorgado columna por columna: `status` y nada más.
const { error: addressTamperError } = await admin
  .from('orders_cod')
  .update({ address: 'Dirección reescrita desde el panel' })
  .eq('id', ownOrders[0].id);
if (!addressTamperError) {
  throw new Error('El administrador pudo reescribir la dirección de entrega.');
}

const { error: channelError } = await admin
  .from('site_channels')
  .update({ chat_enabled: false })
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001');
if (channelError) throw channelError;

// Un botón de WhatsApp encendido sin número apuntaría a una página de error.
const { error: whatsappError } = await admin
  .from('site_channels')
  .update({ whatsapp_enabled: true, whatsapp_phone: null })
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001');
if (!whatsappError) {
  throw new Error('Se pudo encender WhatsApp sin número.');
}

// La landing lee la configuración antes de que exista sesión. Se filtra por
// sitio: desde que la plataforma gestiona varias landings, leer sin filtro
// devuelve una fila por sitio y contar el total no dice nada.
const { data: publicChannels, error: publicChannelError } = await anonymous
  .from('site_channels')
  .select('chat_enabled,voice_enabled,whatsapp_enabled,whatsapp_phone')
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001');
if (publicChannelError) throw publicChannelError;
if (publicChannels?.length !== 1) {
  throw new Error('La landing no pudo leer la configuración de canales.');
}

const { error: anonChannelWriteError } = await anonymous
  .from('site_channels')
  .update({ chat_enabled: true })
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001');
if (!anonChannelWriteError) {
  throw new Error('Un visitante anónimo pudo cambiar la configuración de canales.');
}

// ---------------------------------------------------------------------------
// Frontera entre clientes, comprobada por el mismo camino que usa el panel.
//
// Las pruebas pgTAP ya la comprueban en SQL. Esto la comprueba a través de
// PostgREST, que es por donde pasa la aplicación de verdad: una política puede
// ser correcta en `psql` y quedar sin efecto si a la tabla le falta el grant o
// si la vista no es `security_invoker`.
// ---------------------------------------------------------------------------

const tenantSiteId = '00000000-0000-4000-8000-0000000000d0';

const { data: tenantSite } = await service
  .from('sites')
  .select('id')
  .eq('id', tenantSiteId)
  .maybeSingle();

if (tenantSite) {
  const tenantEmail = `cliente.demo+${suffix}@example.com`;
  const { error: tenantCreateError } = await service.auth.admin.createUser({
    email: tenantEmail,
    password,
    email_confirm: true,
  });
  if (tenantCreateError) throw tenantCreateError;

  const { error: memberError } = await service
    .from('site_members')
    .insert({ site_id: tenantSiteId, email: tenantEmail });
  if (memberError) throw memberError;

  const tenant = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: tenantLoginError } = await tenant.auth.signInWithPassword({
    email: tenantEmail,
    password,
  });
  if (tenantLoginError) throw tenantLoginError;

  const { data: tenantOrders, error: tenantOrdersError } = await tenant
    .from('orders_cod')
    .select('id,site_id');
  if (tenantOrdersError) throw tenantOrdersError;
  if (tenantOrders?.some((order) => order.site_id !== tenantSiteId)) {
    throw new Error('Un cliente alcanzó pedidos de otro sitio.');
  }

  const { data: tenantSites, error: tenantSitesError } = await tenant
    .from('sites')
    .select('id');
  if (tenantSitesError) throw tenantSitesError;
  if (tenantSites?.some((site) => site.id !== tenantSiteId)) {
    throw new Error('Un cliente pudo enumerar los demás sitios de la plataforma.');
  }

  // Las vistas de métricas son `security_invoker`. Si dejaran de serlo, se
  // evaluarían con los permisos de quien las creó y entregarían agregados de
  // todos los clientes sin que ninguna política lo impidiera.
  const { data: tenantStats, error: tenantStatsError } = await tenant
    .from('order_daily_stats')
    .select('site_id');
  if (tenantStatsError) throw tenantStatsError;
  if (tenantStats?.some((row) => row.site_id !== tenantSiteId)) {
    throw new Error('Las métricas filtraron datos de otro cliente.');
  }

  const { data: tenantAccounts, error: tenantAccountsError } = await tenant
    .from('site_accounts')
    .select('site_id');
  if (tenantAccountsError) throw tenantAccountsError;
  if (tenantAccounts?.length) {
    throw new Error('Un cliente pudo leer datos de facturación.');
  }

  const { error: tenantKeysError } = await tenant.from('site_api_keys').select('id');
  if (!tenantKeysError) {
    throw new Error('Un cliente pudo leer las llaves de ingesta.');
  }

  const { data: tenantCrossWrite } = await tenant
    .from('orders_cod')
    .update({ status: 'cancelled' })
    .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001')
    .select('id');
  if (tenantCrossWrite?.length) {
    throw new Error('Un cliente cambió el estado de un pedido ajeno.');
  }
}

// Restaura el chat para no dejar la landing local con un canal apagado.
await service
  .from('site_channels')
  .update({ chat_enabled: true })
  .eq('site_id', 'c0ffee00-0000-4000-8000-000000000001');

console.log(
  'PASS: escritura de pedidos solo desde el servidor; bloqueo anónimo de creación, lectura y configuración; ' +
    'restricción de precio; un registro sin confirmar no lee pedidos ajenos; el cliente confirmado ve solo el suyo; ' +
    'el administrador ve todos y cambia estados pero no direcciones; ' +
    'y un cliente de la plataforma no alcanza pedidos, sitios, métricas, facturación ni llaves de otro.',
);
