#!/usr/bin/env node

import { access, cp, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { copyClientIntake, isInside, pullClientFromDrive } from './lib/landing-intake.mjs';
import { upsertLanding } from './lib/landing-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const platformRoot = path.resolve(scriptDir, '..');
const kitRoot = path.join(platformRoot, 'templates', 'landing');
const studioRoot = path.join(platformRoot, 'templates', 'nitro-starter');
const skillRoot = path.join(platformRoot, 'agent-skills', 'nitro-landing-studio');
const clientsRoot = process.env.NITRO_CLIENTS_DIR
  ? path.resolve(process.env.NITRO_CLIENTS_DIR)
  : '/home/juan/nitro-drive/openclaw/clientes';

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Uso: npm run landing:prepare -- --target <ruta-del-repo> [--client <carpeta> | --source <ruta>]\n' +
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
const clientArg = argument('--client');
const sourceArg = argument('--source');
if (clientArg && sourceArg) usage('Usa --client o --source, no ambos.');

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
await mkdir(path.join(target, '.agents', 'skills'), { recursive: true });

await copyFile(
  path.join(kitRoot, 'docs', 'NITRO_INTEGRATION.md'),
  path.join(target, 'docs', 'NITRO_INTEGRATION.md'),
);
await copyFile(
  path.join(kitRoot, 'scripts', 'check-adaptation.mjs'),
  path.join(target, 'scripts', 'check-nitro-adaptation.mjs'),
);
await copyFile(
  path.join(studioRoot, 'scripts', 'check-landing-quality.mjs'),
  path.join(target, 'scripts', 'check-landing-quality.mjs'),
);
await copyFile(
  path.join(studioRoot, 'scripts', 'check-release.mjs'),
  path.join(target, 'scripts', 'check-release.mjs'),
);
await copyFile(path.join(kitRoot, '.env.example'), path.join(target, '.env.nitro.example'));
await cp(skillRoot, path.join(target, '.agents', 'skills', 'nitro-landing-studio'), {
  recursive: true,
});

const briefTarget = path.join(target, 'docs', 'CLIENT_BRIEF.md');
if (!(await exists(briefTarget))) {
  await copyFile(path.join(studioRoot, 'docs', 'CLIENT_BRIEF.md'), briefTarget);
}

for (const document of ['CONTENT_EVIDENCE.md', 'CREATIVE_DIRECTION.md', 'SOURCE_INVENTORY.md', 'PROJECT_CONTEXT.md']) {
  const destination = path.join(target, 'docs', document);
  if (!(await exists(destination))) await copyFile(path.join(studioRoot, 'docs', document), destination);
}

const agentBlock = `<!-- BEGIN:NITRO-LANDING-INTEGRATION -->
## Nitro Landing Studio

Antes de trabajar, lee \`.agents/skills/nitro-landing-studio/SKILL.md\`,
\`docs/PROJECT_CONTEXT.md\`, \`docs/SOURCE_INVENTORY.md\`, \`docs/CLIENT_BRIEF.md\`,
\`docs/CONTENT_EVIDENCE.md\` y \`docs/CREATIVE_DIRECTION.md\`. Si tocas pedidos,
lee también \`docs/NITRO_INTEGRATION.md\`. Conserva lo valioso del diseño
existente, pero eleva lo que no alcance los gates del estudio.

Ejecuta \`npm run landing:check\` durante el diseño y \`npm run release:check\`
antes de publicar. Actualiza el registro central al cambiar de etapa. Nunca
añadas Supabase a este repositorio ni expongas
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
\`.agents/skills/nitro-landing-studio/SKILL.md\` antes de adaptar esta landing.
<!-- END:NITRO-LANDING-INTEGRATION -->`,
  );
}

const packagePath = path.join(target, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.scripts ??= {};
packageJson.scripts['nitro:check'] = 'node scripts/check-nitro-adaptation.mjs';
packageJson.scripts['landing:check'] = 'npm run nitro:check && node scripts/check-landing-quality.mjs';
packageJson.scripts['release:check'] = 'node scripts/check-release.mjs && npm run landing:check && npx tsc --noEmit && npm run build';
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

let intakeMessage = '';
let trackedSource = '';
if (clientArg || sourceArg) {
  let source = clientArg
    ? path.resolve(clientsRoot, clientArg)
    : path.resolve(process.cwd(), sourceArg);
  if (clientArg && (!isInside(clientsRoot, source) || source === clientsRoot)) {
    usage('El cliente debe estar dentro de openclaw/clientes.');
  }
  if (isInside(source, target) || isInside(target, source)) {
    usage('Material y repositorio no pueden contenerse entre sí.');
  }
  if (clientArg) {
    try {
      source = await pullClientFromDrive(clientArg, clientsRoot);
      console.log(`Material actualizado desde Google Drive: openclaw/clientes/${clientArg}`);
    } catch (error) {
      usage(`No se pudo descargar el cliente desde Google Drive: ${error.message}`);
    }
  }
  const result = await copyClientIntake(source, target);
  trackedSource = clientArg ? `gdrive:openclaw/clientes/${clientArg}` : source;
  intakeMessage = ` Material: ${result.copied} copiado(s), ${result.omitted} omitido(s).`;
}

if (clientArg) {
  const productPath = path.join(target, 'src', 'lib', 'product.ts');
  const productSource = (await exists(productPath)) ? await readFile(productPath, 'utf8') : '';
  const inferredMode = /mode:\s*['"]demo['"]/.test(productSource) ? 'demo' : 'real';
  const context = `# Contexto del proyecto\n\n- Cliente: \`${clientArg}\`\n- Nombre del paquete: \`${packageJson.name ?? clientArg}\`\n- Material: \`${trackedSource}\`\n- Proyecto local: \`${target}\`\n- Modo: \`${inferredMode}\`\n- Registro central: \`${path.join(platformRoot, 'landings', 'registry.json')}\`\n- Comando de consulta: \`npm --prefix ${platformRoot} run landing:show -- ${clientArg}\`\n- Comando de actualización: \`npm --prefix ${platformRoot} run landing:track -- --client ${clientArg} ...\`\n`;
  await writeFile(path.join(target, 'docs', 'PROJECT_CONTEXT.md'), context, 'utf8');
  await upsertLanding(platformRoot, {
    client: clientArg,
    projectPath: target,
    source: trackedSource,
  });
}

console.log(`Repositorio preparado: ${target}`);
console.log(`Siguiente paso: pide al agente que lea AGENTS.md.${intakeMessage}`);
console.log('La preparación no desplegó nada ni modificó variables de Vercel.');
