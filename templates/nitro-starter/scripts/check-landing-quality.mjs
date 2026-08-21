#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const findings = [];
const warnings = [];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

async function collect(directory, extensions = sourceExtensions) {
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return []; }
  const files = [];
  for (const entry of entries) {
    if (['node_modules', '.next', '_intake', '.artifacts'].includes(entry.name)) continue;
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(item, extensions)));
    else if (!extensions || extensions.has(path.extname(item).toLowerCase())) files.push(item);
  }
  return files;
}

const requiredDocs = ['CLIENT_BRIEF.md', 'CONTENT_EVIDENCE.md', 'CREATIVE_DIRECTION.md', 'NITRO_INTEGRATION.md', 'SOURCE_INVENTORY.md', 'PROJECT_CONTEXT.md'];
for (const document of requiredDocs) {
  try { await stat(path.join(root, 'docs', document)); } catch { findings.push(`Falta docs/${document}.`); }
}

const sourceFiles = await collect(path.join(root, 'src'));
const source = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');
const page = await readFile(path.join(root, 'src', 'app', 'page.tsx'), 'utf8').catch(() => '');
const css = await readFile(path.join(root, 'src', 'app', 'globals.css'), 'utf8').catch(() => '');
const creative = await readFile(path.join(root, 'docs', 'CREATIVE_DIRECTION.md'), 'utf8').catch(() => '');
const evidence = await readFile(path.join(root, 'docs', 'CONTENT_EVIDENCE.md'), 'utf8').catch(() => '');

for (const [label, pattern] of [
  ['contenido PENDIENTE', /PENDIENTE/],
  ['marcador del starter', /NITRO_STUDIO_SCAFFOLD/],
  ['lorem ipsum', /lorem\s+ipsum/i],
  ['marca de Coffee Maker', /Coffee Maker Pro|coffeemakerprofesional/i],
]) if (pattern.test(source)) findings.push(`El código conserva ${label}.`);

if (/<img\b/i.test(source)) findings.push('Usa <img>; las imágenes de contenido deben usar next/image.');
const imageTags = source.match(/<Image\b[\s\S]*?\/>/g) ?? [];
for (const [index, tag] of imageTags.entries()) {
  if (!/\balt=/.test(tag)) findings.push(`Image #${index + 1} no tiene alt.`);
  if (/\bfill\b/.test(tag) && !/\bsizes=/.test(tag)) findings.push(`Image #${index + 1} usa fill sin sizes.`);
}

const h1Count = (page.match(/<h1\b/g) ?? []).length;
if (h1Count !== 1) findings.push(`La página debe tener exactamente un h1; encontró ${h1Count}.`);
if (!/focus-visible/.test(`${css}\n${source}`)) findings.push('Falta un estado focus-visible explícito.');
if (!/prefers-reduced-motion|motion-reduce:/.test(`${css}\n${source}`)) findings.push('Falta respetar prefers-reduced-motion.');
if ((css.match(/@media/g) ?? []).length < 2 && !/(?:sm|md|lg|xl):/.test(source)) findings.push('Faltan composiciones responsive explícitas.');
if (/\|\s*\|\s*\|/.test(creative) || /\n1\.\s*\n2\.\s*\n3\./.test(creative)) findings.push('CREATIVE_DIRECTION.md conserva campos vacíos del starter.');
if (/\|\s*PENDIENTE\s*\|/.test(evidence)) findings.push('CONTENT_EVIDENCE.md conserva afirmaciones pendientes.');

const publicFiles = await collect(path.join(root, 'public'), null);
const hashes = new Map();
for (const file of publicFiles) {
  const details = await stat(file);
  const relative = path.relative(root, file);
  if (details.size > 5 * 1024 * 1024) warnings.push(`${relative} supera 5 MB; evalúa compresión o Cloudinary.`);
  if (/\.(?:mp4|mov|webm)$/i.test(file)) warnings.push(`${relative} es video; evalúa entrega por Cloudinary.`);
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  if (hashes.has(hash)) warnings.push(`${relative} duplica ${hashes.get(hash)}.`);
  else hashes.set(hash, relative);
}

warnings.forEach((warning) => console.warn(`Aviso: ${warning}`));
if (findings.length) {
  console.error('La landing todavía no supera el gate de calidad:\n');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}
console.log(`Gate de calidad aprobado: ${imageTags.length} imagen(es), ${publicFiles.length} recurso(s) público(s).`);
