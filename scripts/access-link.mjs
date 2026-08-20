// Genera el enlace de acceso del portal del comprador sin enviar correo.
//
// En este proyecto `local_smtp` está desactivado en `supabase/config.toml`, así
// que en local no hay buzón donde ver el enlace mágico. Este script lo pide por
// la API de administración y lo imprime, que es lo que hace falta para probar
// el flujo de punta a punta.
//
//   npm run access:link -- cliente.local@example.com
//
// Solo desarrollo. Contra producción el enlace llega por correo al comprador.

import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Uso: npm run access:link -- <correo>');
  process.exit(1);
}

const raw = execFileSync('npx', ['--yes', 'supabase', 'status', '-o', 'json'], {
  encoding: 'utf8',
});
const jsonStart = raw.indexOf('{');
if (jsonStart === -1) {
  throw new Error('No se pudo leer el estado de Supabase local. ¿Está corriendo?');
}
const status = JSON.parse(raw.slice(jsonStart));

if (!status.API_URL?.startsWith('http://127.0.0.1:')) {
  throw new Error('Este script solo puede usarse contra Supabase local.');
}

const service = createClient(status.API_URL, status.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// El portal solo envía el enlace a correos con pedido. Se replica aquí para no
// dar una vía de acceso que la aplicación no daría.
const { data: order, error: orderError } = await service
  .from('orders_cod')
  .select('id')
  .eq('email', email)
  .limit(1)
  .maybeSingle();

if (orderError) throw orderError;

if (!order) {
  console.error(
    `No hay pedidos con ${email}. El portal tampoco enviaría el enlace.\n` +
      'Correos con pedido en los datos de desarrollo:\n' +
      '  cliente.local@example.com\n' +
      '  compradora.local@example.com\n' +
      '  transito.local@example.com\n' +
      '  entregado.local@example.com\n' +
      '  cancelado.local@example.com',
  );
  process.exit(1);
}

const { data, error } = await service.auth.admin.generateLink({
  type: 'magiclink',
  email,
});

if (error) throw error;

const hashedToken = data.properties?.hashed_token;
if (!hashedToken) throw new Error('Supabase no devolvió el token.');

// No se usa `action_link`: apunta al endpoint de Supabase, que devuelve el
// token en el fragmento de la URL y por tanto nunca llega al servidor. Se arma
// el mismo enlace que manda la plantilla de correo, contra nuestra propia ruta.
// Si la cuenta aún no existe, Supabase emite un token de tipo `signup`.
const type = data.properties?.verification_type ?? 'magiclink';
const link = `http://localhost:3000/auth/confirm?token_hash=${hashedToken}&type=${type}&next=/dashboard`;

console.log(`\nEnlace de acceso para ${email}:\n`);
console.log(link);
console.log('\nÁbrelo en el navegador. Es de un solo uso.\n');
