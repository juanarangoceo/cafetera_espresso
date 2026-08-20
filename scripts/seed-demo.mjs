// Carga los datos de demostración en la base local.
//
//   npm run demo:seed
//
// Existe para las capturas de pantalla del panel. Comprueba que Supabase local
// esté corriendo y ejecuta `scripts/demo-data.sql` dentro del contenedor de
// Postgres, así que **no puede tocar producción**: no habla con la red, solo
// con el contenedor local.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONTAINER = 'supabase_db_coffee_maker_pro';
const sqlPath = path.join(process.cwd(), 'scripts', 'demo-data.sql');

if (!fs.existsSync(sqlPath)) {
  throw new Error(`No se encontró ${sqlPath}.`);
}

// Confirma que la instancia local está en pie antes de intentar nada.
let status;
try {
  const raw = execFileSync('npx', ['--yes', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
  });
  status = JSON.parse(raw.slice(raw.indexOf('{')));
} catch {
  throw new Error('Supabase local no responde. Levántalo con `npm run supabase:start`.');
}

if (!status.API_URL?.startsWith('http://127.0.0.1:')) {
  throw new Error(
    'Este script solo funciona contra Supabase local. Los datos de demostración ' +
      'nunca deben cargarse en producción.',
  );
}

let running;
try {
  running = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' });
} catch {
  throw new Error('Docker no responde.');
}

if (!running.split('\n').includes(CONTAINER)) {
  throw new Error(
    `El contenedor ${CONTAINER} no está corriendo. Levanta Supabase con \`npm run supabase:start\`.`,
  );
}

console.log('Cargando datos de demostración en la base local…');

execFileSync(
  'docker',
  ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'],
  { input: fs.readFileSync(sqlPath), stdio: ['pipe', 'inherit', 'inherit'] },
);

const count = execFileSync(
  'docker',
  [
    'exec',
    CONTAINER,
    'psql',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '-tAc',
    `select
       (select count(*) from public.orders_cod where id::text like 'de00%') || ' pedidos, ' ||
       (select count(*) from public.orders_cod where id::text like 'de00%'
          and created_at >= date_trunc('day', now())) || ' de hoy, ' ||
       (select count(*) from public.contacts where id::text like 'dec0%') || ' contactos'`,
  ],
  { encoding: 'utf8' },
).trim();

console.log(`Listo: ${count}.`);
console.log('Para quitarlos, vuelve a ejecutar el script o corre `npm run supabase:reset`.');
