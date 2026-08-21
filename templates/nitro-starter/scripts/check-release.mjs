#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const findings = [];
const product = await readFile(path.join(root, 'src', 'lib', 'product.ts'), 'utf8');
const brief = await readFile(path.join(root, 'docs', 'CLIENT_BRIEF.md'), 'utf8');
const evidence = await readFile(path.join(root, 'docs', 'CONTENT_EVIDENCE.md'), 'utf8');

if (!/mode:\s*['"]real['"]/.test(product)) findings.push('PRODUCT.mode debe estar explícitamente en real.');
if (!/commercialReady:\s*true/.test(product)) findings.push('PRODUCT.commercialReady debe estar explícitamente en true.');
if (/price:\s*(?:0|null)/.test(product)) findings.push('El precio no es publicable.');
if (/seller:\s*null|legalName:\s*['"]PENDIENTE/.test(product)) findings.push('Falta el vendedor legal real.');
if (/PENDIENTE/.test(product)) findings.push('product.ts conserva datos pendientes.');
if (/DEMO FICTICIO|dato ficticio|oferta ficticia/i.test(`${product}\n${brief}\n${evidence}`)) findings.push('Quedan datos ficticios de demostración.');
if (/\|\s*PENDIENTE\s*\||:\s*PENDIENTE/.test(`${brief}\n${evidence}`)) findings.push('Los documentos conservan campos pendientes.');

if (findings.length) {
  console.error('Publicación bloqueada:\n');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('Gate comercial aprobado. Continúa con calidad, TypeScript y build.');
