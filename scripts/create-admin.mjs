// Crea una cuenta de acceso al panel, de plataforma o de cliente.
//
// El acceso necesita dos cosas que no se pueden hacer desde la aplicación: una
// cuenta en `auth.users` con el correo ya confirmado, y una fila que lo
// autorice. Ninguna de las dos está expuesta al navegador a propósito — si el
// panel pudiera darse permisos a sí mismo, una sesión robada bastaría para
// crear más administradores.
//
// Hay dos clases de cuenta y la diferencia está en la fila que se escribe:
//
//   `platform_admins`  la operación de Nitro Landing. Ve todos los sitios.
//   `site_members`     el cliente dueño de una landing. Ve la suya y nada más.
//
// Uso en local:
//
//   npm run admin:create -- correo@ejemplo.com 'ContraseñaSegura' 'Nombre'
//   npm run admin:create -- --site demo-cliente cliente@ejemplo.com 'Clave' 'Nombre'
//
// Contra un proyecto remoto, exportando las variables en tu propia terminal y
// nunca pegándolas en una conversación:
//
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run admin:create -- correo@ejemplo.com 'ContraseñaSegura'

import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const rawArguments = process.argv.slice(2);

// `--site <slug>` convierte el alta en la de un cliente. Sin la bandera se crea
// un administrador de plataforma, que es el comportamiento que ya existía.
let siteSlug = null;
const siteFlagIndex = rawArguments.indexOf('--site');
if (siteFlagIndex !== -1) {
  siteSlug = rawArguments[siteFlagIndex + 1];
  if (!siteSlug || siteSlug.startsWith('--')) {
    console.error('La bandera --site necesita el slug del sitio. Ejemplo: --site demo-cliente');
    process.exit(1);
  }
  rawArguments.splice(siteFlagIndex, 2);
}

const [emailArgument, passwordArgument, displayNameArgument] = rawArguments;

if (!emailArgument || !passwordArgument) {
  console.error(
    'Uso: npm run admin:create -- [--site <slug>] <correo> <contraseña> [nombre]\n' +
      'Sin --site se crea un administrador de plataforma, que ve todos los sitios.\n' +
      'La contraseña debe tener al menos 8 caracteres.',
  );
  process.exit(1);
}

const email = emailArgument.trim().toLowerCase();
const password = passwordArgument;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`Correo inválido: ${email}`);
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

// Contra remoto se usan las variables del entorno. Contra local se leen del
// estado de la instancia, para no depender de archivos de entorno ni fijar
// ninguna clave en el repositorio.
let url = process.env.SUPABASE_URL;
let secretKey = process.env.SUPABASE_SECRET_KEY;
let target = 'remoto';

if (!url || !secretKey) {
  const statusOutput = execFileSync(
    'npx',
    ['--yes', 'supabase', 'status', '-o', 'json'],
    { encoding: 'utf8' },
  );
  const jsonStart = statusOutput.indexOf('{');
  if (jsonStart === -1) {
    throw new Error(
      'No se pudo leer el estado de Supabase local. ¿Está corriendo `npm run supabase:start`?',
    );
  }
  const status = JSON.parse(statusOutput.slice(jsonStart));
  url = status.API_URL;
  secretKey = status.SECRET_KEY;
  target = 'local';
}

if (!url || !secretKey) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY.');
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// `email_confirm: true` es el punto del script. `private.verified_email()`
// exige `email_confirmed_at`, así que una cuenta sin confirmar entra al panel y
// no ve absolutamente nada, sin ningún mensaje que explique por qué.
const { error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

let created = true;

if (createError) {
  const alreadyRegistered =
    createError.status === 422 || /already/i.test(createError.message ?? '');

  if (!alreadyRegistered) throw createError;

  created = false;

  // La cuenta ya existía. Puede venir de un registro previo sin confirmar, así
  // que se confirma y se fija la contraseña indicada.
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = list.users.find((user) => user.email?.toLowerCase() === email);
  if (!existing) {
    throw new Error(`El correo ${email} ya está registrado pero no se pudo localizar.`);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updateError) throw updateError;
}

const displayName = displayNameArgument?.trim() || null;

if (siteSlug) {
  // El sitio tiene que existir antes: `site_members.site_id` es una clave
  // foránea, y dar de alta a alguien en un sitio inexistente solo produciría un
  // error críptico de restricción.
  const { data: site, error: siteError } = await admin
    .from('sites')
    .select('id, name')
    .eq('slug', siteSlug)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) {
    throw new Error(
      `No existe ningún sitio con el slug "${siteSlug}". Créalo antes desde /admin/plataforma.`,
    );
  }

  const { error: memberError } = await admin
    .from('site_members')
    .upsert(
      { site_id: site.id, email, role: 'owner', display_name: displayName },
      { onConflict: 'site_id,email' },
    );
  if (memberError) throw memberError;

  console.log(
    `Listo (${target}): ${email} ${created ? 'creado' : 'actualizado'} como dueño de "${site.name}".`,
  );
} else {
  const { error: allowlistError } = await admin
    .from('platform_admins')
    .upsert({ email, display_name: displayName }, { onConflict: 'email' });
  if (allowlistError) throw allowlistError;

  console.log(
    `Listo (${target}): ${email} ${created ? 'creado' : 'actualizado'} como administrador de plataforma.`,
  );
}

console.log('Entra en /admin/login con ese correo y la contraseña indicada.');
