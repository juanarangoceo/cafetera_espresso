import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const EXCLUDED_NAMES = new Set(['.git', '.next', '.vercel', 'node_modules']);

export function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function pullClientFromDrive(client, clientsRoot) {
  if (!client || path.basename(client) !== client || ['.', '..'].includes(client)) {
    throw new Error('El nombre del cliente debe ser una sola carpeta, sin rutas.');
  }

  const localClient = path.join(clientsRoot, client);
  const remoteBase = process.env.NITRO_CLIENTS_REMOTE?.trim() || 'gdrive:openclaw/clientes';
  await mkdir(localClient, { recursive: true });
  await execFileAsync(
    'rclone',
    ['copy', `${remoteBase}/${client}`, localClient, '--create-empty-src-dirs'],
    { timeout: 120_000, maxBuffer: 1024 * 1024 },
  );
  return localClient;
}

function isSecretLike(relativePath) {
  const base = path.basename(relativePath).toLowerCase();
  return base === '.env' || base.startsWith('.env.') || /(?:secret|credential|private[-_]?key)/i.test(base);
}

function imageDimensions(buffer, extension) {
  try {
    if (extension === 'png' && buffer.toString('ascii', 1, 4) === 'PNG') {
      return `${buffer.readUInt32BE(16)} × ${buffer.readUInt32BE(20)}`;
    }

    if (['jpg', 'jpeg'].includes(extension) && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
          return `${buffer.readUInt16BE(offset + 7)} × ${buffer.readUInt16BE(offset + 5)}`;
        }
        const length = buffer.readUInt16BE(offset + 2);
        if (length < 2) break;
        offset += 2 + length;
      }
    }

    if (extension === 'webp' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buffer.toString('ascii', 12, 16);
      if (chunk === 'VP8X') {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return `${width} × ${height}`;
      }
      if (chunk === 'VP8 ') {
        const signature = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
        if (signature >= 0) {
          const width = buffer.readUInt16LE(signature + 3) & 0x3fff;
          const height = buffer.readUInt16LE(signature + 5) & 0x3fff;
          return `${width} × ${height}`;
        }
      }
      if (chunk === 'VP8L' && buffer[20] === 0x2f) {
        const width = 1 + buffer[21] + ((buffer[22] & 0x3f) << 8);
        const height = 1 + ((buffer[22] & 0xc0) >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10);
        return `${width} × ${height}`;
      }
    }
  } catch {
    return '—';
  }
  return '—';
}

async function walk(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const items = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute);
    if (isSecretLike(relative)) {
      items.push({ relative, kind: 'omitido por seguridad', size: 0, omitted: true });
      continue;
    }
    if (entry.isDirectory()) items.push(...(await walk(absolute, root)));
    else if (entry.isFile()) {
      const details = await stat(absolute);
      const kind = path.extname(entry.name).slice(1).toLowerCase() || 'archivo';
      const bytes = await readFile(absolute);
      items.push({
        relative,
        kind,
        size: details.size,
        dimensions: imageDimensions(bytes, kind),
        hash: createHash('sha256').update(bytes).digest('hex').slice(0, 12),
        omitted: false,
      });
    }
  }
  return items;
}

export async function copyClientIntake(source, target) {
  const sourceStats = await stat(source).catch(() => null);
  if (!sourceStats?.isDirectory()) throw new Error(`No existe la carpeta de material: ${source}`);

  const intake = path.join(target, '_intake');
  await mkdir(intake, { recursive: true });
  const items = await walk(source);

  for (const item of items) {
    if (item.omitted) continue;
    const from = path.join(source, item.relative);
    const to = path.join(intake, item.relative);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
  }

  const hashCounts = new Map();
  for (const item of items) if (item.hash) hashCounts.set(item.hash, (hashCounts.get(item.hash) ?? 0) + 1);
  const rows = items.length
    ? items.map((item) => {
        const observation = item.omitted
          ? 'Omitido por seguridad'
          : hashCounts.get(item.hash) > 1 ? 'Posible duplicado' : '';
        return `| \`${item.relative.replaceAll('|', '\\|')}\` | ${item.kind} | ${item.dimensions ?? '—'} | ${item.omitted ? '—' : item.size.toLocaleString('es-CO')} | ${item.hash ?? '—'} | ${observation} |`;
      }).join('\n')
    : '| — | carpeta vacía | — | — | — | — |';
  const inventory = `# Inventario de fuentes\n\nGenerado desde \`${source}\`. Los archivos viven en \`_intake/\`, carpeta ignorada por Git. La preparación solo leyó bytes para calcular dimensiones y huellas; no interpretó ni resumió el contenido.\n\n| Ruta | Tipo | Dimensiones | Bytes | SHA-256 corto | Observación |\n|---|---|---:|---:|---|---|\n${rows}\n\nLos elementos "omitido por seguridad" no fueron copiados. Huellas iguales señalan posibles duplicados. El agente debe revisar el material, calidad visual y permisos de uso antes de copiar recursos a \`public/\` o Cloudinary.\n`;
  await writeFile(path.join(target, 'docs', 'SOURCE_INVENTORY.md'), inventory, 'utf8');
  return { copied: items.filter((item) => !item.omitted).length, omitted: items.filter((item) => item.omitted).length };
}

export async function directoryIsEmpty(directory) {
  return (await readdir(directory)).length === 0;
}

export async function readPackageName(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8')).name;
}
