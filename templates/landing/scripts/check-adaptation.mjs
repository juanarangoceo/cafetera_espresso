#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoots = ['src', 'app'].map((name) => path.join(root, name));
const textExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json']);
const findings = [];

async function collect(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(resolved)));
    else if (textExtensions.has(path.extname(entry.name))) files.push(resolved);
  }
  return files;
}

const files = [...new Set((await Promise.all(sourceRoots.map(collect))).flat())];
const packagePath = path.join(root, 'package.json');
const packageText = await readFile(packagePath, 'utf8');
const contents = new Map();

for (const file of files) contents.set(file, await readFile(file, 'utf8'));

const starterMarkers = [
  /Coffee Maker Pro/i,
  /coffeemakerprofesional/i,
  /coffeemakerpro@gmail\.com/i,
  /Juan David Arango/i,
  /1\.088\.018\.943/i,
  /490_000/,
  /\$490\.000/,
];

for (const [file, content] of contents) {
  for (const marker of starterMarkers) {
    if (marker.test(content)) {
      findings.push(`${path.relative(root, file)} conserva el marcador ${marker}.`);
    }
  }

  if (
    /process\.env\.(?:SUPABASE_SECRET_KEY|NEXT_PUBLIC_SUPABASE_\w+)/.test(content) ||
    /(?:from\s+|require\()['"]@supabase\//.test(content)
  ) {
    findings.push(`${path.relative(root, file)} contiene una referencia prohibida a Supabase.`);
  }

  if (/NEXT_PUBLIC_NITRO_SITE_KEY/.test(content)) {
    findings.push(`${path.relative(root, file)} publica NITRO_SITE_KEY en el navegador.`);
  }

  if (/^['"]use client['"];?/m.test(content) && /NITRO_SITE_KEY/.test(content)) {
    findings.push(`${path.relative(root, file)} intenta leer NITRO_SITE_KEY desde un Client Component.`);
  }
}

if (/@supabase\//.test(packageText)) {
  findings.push('package.json instala Supabase; una landing de cliente no debe hacerlo.');
}

const allSource = [...contents.values()].join('\n');
for (const [label, pattern] of [
  ['NITRO_API_URL', /NITRO_API_URL/],
  ['NITRO_SITE_KEY', /NITRO_SITE_KEY/],
  ['endpoint de pedidos', /\/api\/v1\/orders/],
  ['BotID en el pedido', /checkBotId\s*\(/],
]) {
  if (!pattern.test(allSource)) findings.push(`Falta ${label} en el código de la landing.`);
}

if (findings.length) {
  console.error('La adaptación a Nitro todavía no está completa:\n');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('Adaptación Nitro verificada: sin marcadores base ni credenciales prohibidas.');
