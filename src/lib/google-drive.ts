import 'server-only';

import { JWT, OAuth2Client } from 'google-auth-library';
import { INTAKE_CATEGORIES, type IntakeCategory } from './intake';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

let cachedAuth: JWT | OAuth2Client | null = null;

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

function getDriveAuth() {
  if (cachedAuth) return cachedAuth;

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    const auth = new OAuth2Client(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    cachedAuth = auth;
    return auth;
  }

  const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (email && privateKey) {
    cachedAuth = new JWT({
      email,
      key: normalizePrivateKey(privateKey),
      scopes: [DRIVE_SCOPE],
    });
    return cachedAuth;
  }

  throw new Error('Google Drive no está configurado en el servidor.');
}

export function driveIsConfigured() {
  const oauth = Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID
      && process.env.GOOGLE_DRIVE_CLIENT_SECRET
      && process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  );
  const serviceAccount = Boolean(
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL
      && process.env.GOOGLE_DRIVE_PRIVATE_KEY,
  );
  return Boolean(process.env.OPENCLAW_CLIENTS_FOLDER_ID && (oauth || serviceAccount));
}

async function getAccessToken() {
  const token = await getDriveAuth().getAccessToken();
  const value = typeof token === 'string' ? token : token?.token;
  if (!value) throw new Error('Google Drive no entregó un token de acceso.');
  return value;
}

async function driveFetch(url: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Google Drive respondió ${response.status}: ${detail}`);
  }

  return response;
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findChild(parentId: string, name: string, mimeType?: string) {
  const parts = [
    `'${escapeDriveQuery(parentId)}' in parents`,
    `name = '${escapeDriveQuery(name)}'`,
    'trashed = false',
  ];
  if (mimeType) parts.push(`mimeType = '${escapeDriveQuery(mimeType)}'`);

  const params = new URLSearchParams({
    q: parts.join(' and '),
    fields: 'files(id,name,mimeType)',
    pageSize: '1',
    spaces: 'drive',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const response = await driveFetch(`${DRIVE_API}/files?${params}`);
  const body = await response.json() as { files?: Array<{ id: string }> };
  return body.files?.[0]?.id ?? null;
}

async function ensureFolder(parentId: string, name: string) {
  const existing = await findChild(parentId, name, 'application/vnd.google-apps.folder');
  if (existing) return existing;

  const response = await driveFetch(`${DRIVE_API}/files?supportsAllDrives=true&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  const body = await response.json() as { id: string };
  return body.id;
}

export async function ensureIntakeDriveFolders(siteSlug: string) {
  const clientsFolderId = process.env.OPENCLAW_CLIENTS_FOLDER_ID;
  if (!clientsFolderId) throw new Error('Falta OPENCLAW_CLIENTS_FOLDER_ID.');

  const rootId = await ensureFolder(clientsFolderId, siteSlug);
  const categories = {} as Record<IntakeCategory, string>;
  for (const [category, folderName] of Object.entries(INTAKE_CATEGORIES)) {
    categories[category as IntakeCategory] = await ensureFolder(rootId, folderName);
  }
  return { rootId, categories };
}

export async function uploadDriveStream(input: {
  parentId: string;
  name: string;
  mimeType: string;
  size: number;
  body: ReadableStream<Uint8Array>;
}) {
  const session = await driveFetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,size,md5Checksum`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': input.mimeType,
        'X-Upload-Content-Length': String(input.size),
      },
      body: JSON.stringify({ name: input.name, parents: [input.parentId] }),
    },
  );
  const location = session.headers.get('location');
  if (!location) throw new Error('Google Drive no devolvió la sesión de carga.');

  const uploaded = await driveFetch(location, {
    method: 'PUT',
    headers: {
      'Content-Type': input.mimeType,
      'Content-Length': String(input.size),
    },
    body: input.body,
    // Node necesita declarar que el cuerpo se transmite mientras se envía.
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  return uploaded.json() as Promise<{ id: string; name: string; size?: string; md5Checksum?: string }>;
}

export async function upsertDriveTextFile(parentId: string, name: string, content: string) {
  const existing = await findChild(parentId, name);
  const body = new TextEncoder().encode(content);
  const target = existing
    ? `${DRIVE_UPLOAD_API}/files/${existing}?uploadType=media&supportsAllDrives=true&fields=id`
    : `${DRIVE_UPLOAD_API}/files?uploadType=multipart&supportsAllDrives=true&fields=id`;

  if (existing) {
    const response = await driveFetch(target, {
      method: 'PATCH',
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      body,
    });
    return (await response.json() as { id: string }).id;
  }

  const boundary = `nitro-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: 'text/plain' });
  const multipart = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n`,
    body,
    `\r\n--${boundary}--`,
  ]);
  const response = await driveFetch(target, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  return (await response.json() as { id: string }).id;
}

export async function deleteDriveFile(fileId: string) {
  await driveFetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
    method: 'DELETE',
  });
}
