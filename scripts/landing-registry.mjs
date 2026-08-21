#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readLandingRegistry, upsertLanding, writeLandingRegistry } from './lib/landing-registry.mjs';

const platformRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2] ?? 'list';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error('Uso:\n  npm run landing:list\n  npm run landing:show -- <cliente>\n  npm run landing:track -- --client <slug> [--status <estado>] [--mode demo|real] [--project <ruta>] [--name <nombre>] [--next <acción>] [--port <número>] [--blockers "uno | dos"]');
  process.exit(1);
}

function printProject(project) {
  console.log(`${project.client} — ${project.name ?? 'Sin nombre'}`);
  console.log(`  estado: ${project.status} · modo: ${project.mode} · actualizado: ${project.updatedAt}`);
  console.log(`  proyecto: ${project.projectPath ?? '—'}`);
  console.log(`  siguiente: ${project.nextAction ?? '—'}`);
  if (project.localPort) console.log(`  SSH: ssh -L ${project.localPort}:127.0.0.1:${project.localPort} juan@SERVIDOR`);
  if (project.blockers?.length) console.log(`  bloqueos: ${project.blockers.join(' | ')}`);
}

const registry = await readLandingRegistry(platformRoot);

if (command === 'list') {
  const active = registry.projects.filter((project) => project.status !== 'archived');
  if (!active.length) console.log('No hay landings activas.');
  else active.forEach(printProject);
} else if (command === 'show') {
  const client = process.argv[3];
  const project = registry.projects.find((item) => item.client === client);
  if (!project) usage(`No existe ${client}.`);
  printProject(project);
} else if (command === 'render') {
  await writeLandingRegistry(platformRoot, registry);
  console.log('docs/LANDINGS_IN_PROGRESS.md actualizado.');
} else if (command === 'upsert') {
  const client = argument('--client');
  if (!client) usage('Falta --client.');
  const port = argument('--port');
  const blockers = argument('--blockers');
  const project = await upsertLanding(platformRoot, {
    client,
    name: argument('--name'),
    projectPath: argument('--project') ? path.resolve(argument('--project')) : undefined,
    source: argument('--source'),
    mode: argument('--mode'),
    status: argument('--status'),
    nextAction: argument('--next'),
    localPort: port ? Number(port) : undefined,
    previewUrl: argument('--preview'),
    productionUrl: argument('--production'),
    blockers: blockers ? blockers.split('|').map((item) => item.trim()).filter(Boolean) : undefined,
  });
  console.log('Landing registrada:');
  printProject(project);
} else {
  usage(`Comando desconocido: ${command}.`);
}
