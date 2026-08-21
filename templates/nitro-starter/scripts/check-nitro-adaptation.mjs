#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const findings = [];
const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.css']);

async function collect(directory) {
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return []; }
  const files = [];
  for (const entry of entries) {
    if (['node_modules', '.next', '_intake'].includes(entry.name)) continue;
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(item)));
    else if (extensions.has(path.extname(item))) files.push(item);
  }
  return files;
}

const files = [
  ...(await collect(path.join(root, 'src'))),
  ...(await collect(path.join(root, 'app'))),
];
const contentByFile = new Map();
for (const file of files) contentByFile.set(file, await readFile(file, 'utf8'));

for (const [file, content] of contentByFile) {
  const relative = path.relative(root, file);
  if (/PENDIENTE|NITRO_STUDIO_SCAFFOLD/.test(content)) findings.push(`${relative} conserva contenido del starter.`);
  if (/process\.env\.(?:SUPABASE_SECRET_KEY|NEXT_PUBLIC_SUPABASE_\w+)|@supabase\//.test(content)) findings.push(`${relative} referencia Supabase.`);
  if (/NEXT_PUBLIC_NITRO_SITE_KEY/.test(content)) findings.push(`${relative} expone la llave de sitio.`);
  if (/^['"]use client['"];?/m.test(content) && /process\.env\.NITRO_SITE_KEY/.test(content)) findings.push(`${relative} lee la llave desde el cliente.`);
}

const source = [...contentByFile.values()].join('\n');
for (const [label, pattern] of [
  ['NITRO_API_URL', /NITRO_API_URL/],
  ['NITRO_SITE_KEY', /NITRO_SITE_KEY/],
  ['endpoint de pedidos', /\/api\/v1\/orders/],
  ['BotID', /checkBotId\s*\(/],
  ['confirmación explícita', /customerConfirmed/],
  ['consentimiento', /acceptedPrivacy/],
]) if (!pattern.test(source)) findings.push(`Falta ${label}.`);

if (findings.length) {
  console.error('La landing aún no supera el gate Nitro:\n');
  for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Gate Nitro aprobado.');
