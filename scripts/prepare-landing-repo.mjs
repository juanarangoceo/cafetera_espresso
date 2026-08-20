#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const platformRoot = path.resolve(scriptDir, '..');
const kitRoot = path.join(platformRoot, 'templates', 'landing');

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Uso: npm run landing:prepare -- --target <ruta-del-repo>\n' +
      'Prepara una landing Next.js existente para que Codex o Claude Code la integren con Nitro.',
  );
  process.exit(1);
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function upsertManagedBlock(filePath, block, fallback = '') {
  const begin = '<!-- BEGIN:NITRO-LANDING-INTEGRATION -->';
  const end = '<!-- END:NITRO-LANDING-INTEGRATION -->';
  const current = (await exists(filePath)) ? await readFile(filePath, 'utf8') : fallback;
  const start = current.indexOf(begin);
  const finish = current.indexOf(end);

  let next;
  if (start >= 0 && finish > start) {
    next = `${current.slice(0, start)}${block}${current.slice(finish + end.length)}`;
  } else {
    next = `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${block}\n`;
  }

  await writeFile(filePath, next, 'utf8');
}

const targetArg = argument('--target');
if (!targetArg) usage('Falta --target.');

const target = path.resolve(process.cwd(), targetArg);
if (target === platformRoot || target === kitRoot) {
  usage('El destino debe ser el repositorio independiente de la nueva landing.');
}

let targetStats;
try {
  targetStats = await stat(target);
} catch {
  usage(`No existe el destino: ${target}`);
}

if (!targetStats.isDirectory()) usage('El destino no es una carpeta.');
if (!(await exists(path.join(target, 'package.json')))) usage('El destino no tiene package.json.');

const hasAppRouter =
  (await exists(path.join(target, 'src', 'app'))) || (await exists(path.join(target, 'app')));
if (!hasAppRouter) {
  usage('El kit actual soporta Next.js App Router; no se encontró src/app ni app.');
}

await mkdir(path.join(target, 'docs'), { recursive: true });
await mkdir(path.join(target, 'scripts'), { recursive: true });

await copyFile(
  path.join(kitRoot, 'docs', 'NITRO_INTEGRATION.md'),
  path.join(target, 'docs', 'NITRO_INTEGRATION.md'),
);
await copyFile(
  path.join(kitRoot, 'scripts', 'check-adaptation.mjs'),
  path.join(target, 'scripts', 'check-nitro-adaptation.mjs'),
);
await copyFile(path.join(kitRoot, '.env.example'), path.join(target, '.env.nitro.example'));

const briefTarget = path.join(target, 'docs', 'CLIENT_BRIEF.md');
if (!(await exists(briefTarget))) {
  await copyFile(path.join(kitRoot, 'docs', 'CLIENT_BRIEF.md'), briefTarget);
}

const agentBlock = `<!-- BEGIN:NITRO-LANDING-INTEGRATION -->
## Integración con Nitro Landing

Antes de tocar checkout, formularios, leads, variables, BotID o despliegue, lee
\`docs/NITRO_INTEGRATION.md\` y \`docs/CLIENT_BRIEF.md\`. El diseño existente es
la referencia visual: intégralo sin reemplazarlo por la UI de otra tienda.

Ejecuta \`npm run nitro:check\`, \`npx tsc --noEmit\` y \`npm run build\` antes
de entregar. Nunca añadas Supabase a este repositorio ni expongas
\`NITRO_SITE_KEY\` con el prefijo \`NEXT_PUBLIC_\`.
<!-- END:NITRO-LANDING-INTEGRATION -->`;

await upsertManagedBlock(path.join(target, 'AGENTS.md'), agentBlock);

const claudePath = path.join(target, 'CLAUDE.md');
if (!(await exists(claudePath))) {
  await writeFile(claudePath, '@AGENTS.md\n', 'utf8');
} else {
  await upsertManagedBlock(
    claudePath,
    `<!-- BEGIN:NITRO-LANDING-INTEGRATION -->
Lee también \`AGENTS.md\`, \`docs/NITRO_INTEGRATION.md\` y
\`docs/CLIENT_BRIEF.md\` antes de adaptar esta landing a Nitro.
<!-- END:NITRO-LANDING-INTEGRATION -->`,
  );
}

const packagePath = path.join(target, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.scripts ??= {};
packageJson.scripts['nitro:check'] = 'node scripts/check-nitro-adaptation.mjs';
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

console.log(`Repositorio preparado: ${target}`);
console.log('Siguiente paso: completa docs/CLIENT_BRIEF.md y pide al agente que lea AGENTS.md.');
console.log('La preparación no desplegó nada ni modificó variables de Vercel.');
