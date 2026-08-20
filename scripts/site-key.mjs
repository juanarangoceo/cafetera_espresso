// Emite o revoca la llave de ingesta de un sitio.
//
// La llave es lo único que la landing de un cliente conoce. No lleva ninguna
// clave de Supabase encima a propósito: `SUPABASE_SECRET_KEY` se salta el RLS
// de todos los inquilinos, así que ponerla en el proyecto de Vercel de un
// cliente convertiría una filtración suya en una filtración de todos.
//
// De la llave se guarda solo el `sha256`. **Se muestra una vez y no se puede
// recuperar**: quien la pierda, revoca y emite otra.
//
// El mismo algoritmo vive en `src/lib/site-keys.ts`, que es lo que usa la API
// al validar. Si cambia allí, cambia aquí.
//
// Uso:
//
//   npm run site:key -- emitir demo-cliente 'Landing de producción'
//   npm run site:key -- listar demo-cliente
//   npm run site:key -- revocar <id-de-la-llave>

import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PREFIX = 'nl_live_';

const [action, target, label] = process.argv.slice(2);

if (!action || !['emitir', 'listar', 'revocar'].includes(action)) {
  console.error(
    'Uso: npm run site:key -- <emitir|listar|revocar> <slug-o-id> [etiqueta]\n' +
      '  emitir <slug> [etiqueta]   crea una llave nueva para ese sitio\n' +
      '  listar <slug>              muestra las llaves del sitio, sin sus valores\n' +
      '  revocar <id>               inutiliza una llave de inmediato',
  );
  process.exit(1);
}

if (!target) {
  console.error(`La acción "${action}" necesita un argumento.`);
  process.exit(1);
}

let url = process.env.SUPABASE_URL;
let secretKey = process.env.SUPABASE_SECRET_KEY;
let environment = 'remoto';

if (!url || !secretKey) {
  const statusOutput = execFileSync('npx', ['--yes', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
  });
  const jsonStart = statusOutput.indexOf('{');
  if (jsonStart === -1) {
    throw new Error(
      'No se pudo leer el estado de Supabase local. ¿Está corriendo `npm run supabase:start`?',
    );
  }
  const status = JSON.parse(statusOutput.slice(jsonStart));
  url = status.API_URL;
  secretKey = status.SECRET_KEY;
  environment = 'local';
}

if (!url || !secretKey) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY.');
}

const service = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function resolveSite(slug) {
  const { data, error } = await service
    .from('sites')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No existe ningún sitio con el slug "${slug}".`);
  return data;
}

if (action === 'emitir') {
  const site = await resolveSite(target);

  const secret = randomBytes(32).toString('base64url');
  const key = `${PREFIX}${secret}`;
  const keyHash = createHash('sha256').update(key).digest('hex');
  const prefix = `${PREFIX}${secret.slice(0, 6)}`;

  const { error } = await service.from('site_api_keys').insert({
    site_id: site.id,
    label: label?.trim() || null,
    key_hash: keyHash,
    prefix,
  });
  if (error) throw error;

  console.log(`Llave emitida (${environment}) para "${site.name}".\n`);
  console.log(key);
  console.log('\nGuárdala ahora: no se puede volver a mostrar.');
  console.log('En el proyecto de Vercel de esa landing va como NITRO_SITE_KEY.');
} else if (action === 'listar') {
  const site = await resolveSite(target);

  const { data, error } = await service
    .from('site_api_keys')
    .select('id, label, prefix, created_at, last_used_at, revoked_at')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!data.length) {
    console.log(`"${site.name}" no tiene llaves emitidas.`);
  } else {
    console.log(`Llaves de "${site.name}" (${environment}):\n`);
    for (const row of data) {
      const state = row.revoked_at ? `revocada ${row.revoked_at}` : 'activa';
      const used = row.last_used_at ? `último uso ${row.last_used_at}` : 'sin usar';
      console.log(`  ${row.id}  ${row.prefix}…  ${state}  ${used}  ${row.label ?? ''}`);
    }
  }
} else {
  const { data, error } = await service
    .from('site_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', target)
    .is('revoked_at', null)
    .select('id, prefix');
  if (error) throw error;

  if (!data.length) {
    console.log('Esa llave no existe o ya estaba revocada.');
  } else {
    console.log(`Llave ${data[0].prefix}… revocada (${environment}). Deja de servir de inmediato.`);
  }
}
