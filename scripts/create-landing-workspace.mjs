#!/usr/bin/env node

import { access, cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  copyClientIntake,
  directoryIsEmpty,
  isInside,
  pullClientFromDrive,
} from './lib/landing-intake.mjs';
import { upsertLanding } from './lib/landing-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const platformRoot = path.resolve(scriptDir, '..');
const starterRoot = path.join(platformRoot, 'templates', 'nitro-starter');
const skillRoot = path.join(platformRoot, 'agent-skills', 'nitro-landing-studio');
const clientsRoot = process.env.NITRO_CLIENTS_DIR
  ? path.resolve(process.env.NITRO_CLIENTS_DIR)
  : '/home/juan/nitro-drive/openclaw/clientes';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Uso:\n' +
      '  npm run landing:new -- --client <carpeta> --target <repositorio> [--name <slug>]\n' +
      '  npm run landing:new -- --source <ruta-material> --target <repositorio> [--name <slug>] [--mode real|demo]\n',
  );
  process.exit(1);
}

async function exists(item) {
  try { await access(item); return true; } catch { return false; }
}

const client = argument('--client');
const sourceArg = argument('--source');
const targetArg = argument('--target');
const mode = argument('--mode') ?? 'real';
if (!targetArg) usage('Falta --target.');
if (Boolean(client) === Boolean(sourceArg)) usage('Usa exactamente uno: --client o --source.');
if (!['real', 'demo'].includes(mode)) usage('--mode debe ser real o demo.');

let source = client ? path.resolve(clientsRoot, client) : path.resolve(process.cwd(), sourceArg);
const target = path.resolve(process.cwd(), targetArg);
if (client && (!isInside(clientsRoot, source) || source === clientsRoot)) usage('El cliente debe ser una carpeta directa dentro de openclaw/clientes.');
if ([platformRoot, starterRoot, clientsRoot].includes(target)) usage('El destino no puede ser una carpeta del sistema fuente.');
if (isInside(source, target) || isInside(target, source)) usage('Material y repositorio no pueden contenerse entre sí.');

if (client) {
  try {
    source = await pullClientFromDrive(client, clientsRoot);
    console.log(`Material actualizado desde Google Drive: openclaw/clientes/${client}`);
  } catch (error) {
    usage(`No se pudo descargar el cliente desde Google Drive: ${error.message}`);
  }
}

const sourceStats = await stat(source).catch(() => null);
if (!sourceStats?.isDirectory()) usage(`No existe el material: ${source}`);

if (await exists(target)) {
  const targetStats = await stat(target);
  if (!targetStats.isDirectory() || !(await directoryIsEmpty(target))) usage('El destino debe ser nuevo o estar vacío.');
} else {
  await mkdir(target, { recursive: true });
}

await cp(starterRoot, target, {
  recursive: true,
  filter(sourcePath) {
    const relative = path.relative(starterRoot, sourcePath);
    const topLevel = relative.split(path.sep)[0];
    return !['node_modules', '.next', 'tsconfig.tsbuildinfo'].includes(topLevel);
  },
});
await mkdir(path.join(target, '.agents', 'skills'), { recursive: true });
await cp(skillRoot, path.join(target, '.agents', 'skills', 'nitro-landing-studio'), { recursive: true });

const packagePath = path.join(target, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const requestedName = argument('--name') ?? client ?? path.basename(target);
packageJson.name = requestedName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'nitro-landing';
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

if (mode === 'demo') {
  const productPath = path.join(target, 'src', 'lib', 'product.ts');
  const productSource = await readFile(productPath, 'utf8');
  await writeFile(productPath, productSource.replace("mode: 'real'", "mode: 'demo'"), 'utf8');
}

const lockPath = path.join(target, 'package-lock.json');
if (await exists(lockPath)) {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.name = packageJson.name;
  if (lock.packages?.['']) lock.packages[''].name = packageJson.name;
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
}

const result = await copyClientIntake(source, target);
const trackedClient = client ?? packageJson.name;
const trackedSource = client ? `gdrive:openclaw/clientes/${client}` : source;
const context = `# Contexto del proyecto\n\n- Cliente: \`${trackedClient}\`\n- Nombre del paquete: \`${packageJson.name}\`\n- Material: \`${trackedSource}\`\n- Proyecto local: \`${target}\`\n- Modo: \`${mode}\`\n- Registro central: \`${path.join(platformRoot, 'landings', 'registry.json')}\`\n- Comando de consulta: \`npm --prefix ${platformRoot} run landing:show -- ${trackedClient}\`\n- Comando de actualización: \`npm --prefix ${platformRoot} run landing:track -- --client ${trackedClient} ...\`\n\nActualiza estado, próxima acción y bloqueos al cambiar de etapa.\n`;
await writeFile(path.join(target, 'docs', 'PROJECT_CONTEXT.md'), context, 'utf8');
await upsertLanding(platformRoot, {
  client: trackedClient,
  name: packageJson.name,
  projectPath: target,
  source: trackedSource,
  mode,
  nextAction: 'Analizar el material y completar brief, evidencia y dirección creativa.',
  blockers: [],
});
console.log(`Landing local creada: ${target}`);
console.log(`Material: ${result.copied} archivo(s) copiado(s) a _intake; ${result.omitted} omitido(s) por seguridad.`);
console.log('Siguiente: abre el destino con Codex o Claude y dile: "Lee AGENTS.md y construye la landing en local".');
console.log('No se instalaron paquetes, no se crearon recursos externos y no se desplegó nada.');
console.log(`Seguimiento registrado: npm run landing:show -- ${trackedClient}`);
