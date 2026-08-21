import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LANDING_STATUSES = [
  'intake',
  'designing',
  'local_review',
  'awaiting_client',
  'ready_preview',
  'preview',
  'ready_production',
  'production',
  'paused',
  'archived',
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function readLandingRegistry(platformRoot) {
  const registryPath = path.join(platformRoot, 'landings', 'registry.json');
  return JSON.parse(await readFile(registryPath, 'utf8'));
}

function markdown(registry) {
  const active = registry.projects.filter((project) => project.status !== 'archived');
  const rows = active.length
    ? active.map((project) => {
        const access = project.localPort ? `\`ssh -L ${project.localPort}:127.0.0.1:${project.localPort} juan@SERVIDOR\`` : '—';
        return `| \`${project.client}\` | ${project.name} | ${project.mode} | ${project.status} | ${project.nextAction || '—'} | ${access} |`;
      }).join('\n')
    : '| — | No hay landings activas | — | — | — | — |';

  const details = active.map((project) => `## ${project.name}\n\n- Cliente: \`${project.client}\`\n- Proyecto: \`${project.projectPath}\`\n- Material: \`${project.source}\`\n- Estado: \`${project.status}\`\n- Modo: \`${project.mode}\`\n- Próxima acción: ${project.nextAction || 'No definida.'}\n- Preview: ${project.previewUrl || 'No existe.'}\n- Producción: ${project.productionUrl || 'No existe.'}\n- Bloqueos:\n${project.blockers?.length ? project.blockers.map((item) => `  - ${item}`).join('\n') : '  - Ninguno registrado.'}\n`).join('\n');

  return `# Landings en proceso\n\nGenerado desde \`landings/registry.json\`. No editar esta tabla a mano; usa \`npm run landing:track\`. Última actualización: **${registry.updatedAt}**.\n\n| Cliente | Landing | Modo | Estado | Próxima acción | Acceso SSH local |\n|---|---|---|---|---|---|\n${rows}\n\n${details}`;
}

export async function writeLandingRegistry(platformRoot, registry) {
  registry.updatedAt = today();
  const registryPath = path.join(platformRoot, 'landings', 'registry.json');
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  await writeFile(path.join(platformRoot, 'docs', 'LANDINGS_IN_PROGRESS.md'), markdown(registry), 'utf8');
}

export async function upsertLanding(platformRoot, input) {
  if (!input.client) throw new Error('Falta client.');
  if (input.status && !LANDING_STATUSES.includes(input.status)) {
    throw new Error(`Estado inválido: ${input.status}. Usa: ${LANDING_STATUSES.join(', ')}.`);
  }
  if (input.mode && !['demo', 'real'].includes(input.mode)) throw new Error('mode debe ser demo o real.');

  const registry = await readLandingRegistry(platformRoot);
  const index = registry.projects.findIndex((project) => project.client === input.client);
  const current = index >= 0 ? registry.projects[index] : {};
  const definedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  const project = {
    ...current,
    ...definedInput,
    name: input.name ?? current.name ?? input.client,
    mode: input.mode ?? current.mode ?? 'real',
    status: input.status ?? current.status ?? 'intake',
    nextAction: input.nextAction ?? current.nextAction ?? 'Revisar material y definir la siguiente etapa.',
    blockers: input.blockers ?? current.blockers ?? [],
    previewUrl: input.previewUrl ?? current.previewUrl ?? null,
    productionUrl: input.productionUrl ?? current.productionUrl ?? null,
    localPort: input.localPort ?? current.localPort ?? null,
    updatedAt: today(),
  };
  if (index >= 0) registry.projects[index] = project;
  else registry.projects.push(project);
  registry.projects.sort((a, b) => a.client.localeCompare(b.client));
  await writeLandingRegistry(platformRoot, registry);
  return project;
}
