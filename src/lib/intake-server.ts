import 'server-only';

import {
  allowedIntakeMimeTypes,
  hashIntakeToken,
  INTAKE_BUCKET,
  intakeAnswersSchema,
  MAX_INTAKE_FILE_BYTES,
  type IntakeAnswers,
} from './intake';
import { createServiceClient } from '@/utils/supabase/service';

export type IntakeRequest = {
  id: string;
  siteId: string | null;
  siteSlug: string;
  siteName: string;
  logoUrl: string | null;
  status: 'draft' | 'submitted' | 'revoked';
  expiresAt: string;
  submittedAt: string | null;
  answers: IntakeAnswers;
};

export async function resolveIntakeToken(token: string): Promise<IntakeRequest | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;

  const service = createServiceClient();
  if (!service) return null;

  const { data, error } = await service
    .from('intake_requests')
    .select('id, site_id, provisional_name, slug, status, answers, expires_at, submitted_at, sites(slug, name, logo_url)')
    .eq('token_hash', hashIntakeToken(token))
    .maybeSingle();

  if (error || !data) return null;
  const site = Array.isArray(data.sites) ? data.sites[0] : data.sites;

  return {
    id: data.id,
    siteId: data.site_id,
    siteSlug: site?.slug ?? data.slug,
    siteName: site?.name ?? data.provisional_name,
    logoUrl: site?.logo_url ?? null,
    status: data.status,
    expiresAt: data.expires_at,
    submittedAt: data.submitted_at,
    answers: intakeAnswersSchema.parse(data.answers ?? {}),
  };
}

export function intakeIsOpen(request: IntakeRequest) {
  return request.status === 'draft' && new Date(request.expiresAt).getTime() > Date.now();
}

/**
 * Storage inicializa su esquema después de las migraciones del proyecto en el
 * entorno local. Por eso el bucket se garantiza desde el servidor, privado y
 * sin políticas de navegador, justo antes de emitir una carga firmada.
 */
export async function ensureIntakeBucket() {
  const service = createServiceClient();
  if (!service) return 'El servicio no está disponible.';

  const { data, error } = await service.storage.getBucket(INTAKE_BUCKET);
  if (data) return null;
  if (error && !/not found|does not exist/i.test(error.message)) {
    console.error('❌ No se pudo comprobar el bucket de intake:', error);
    return 'No se pudo preparar el almacenamiento.';
  }

  const { error: createError } = await service.storage.createBucket(INTAKE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_INTAKE_FILE_BYTES,
    allowedMimeTypes: Array.from(allowedIntakeMimeTypes),
  });
  if (createError && !/already exists/i.test(createError.message)) {
    console.error('❌ No se pudo crear el bucket de intake:', createError);
    return 'No se pudo preparar el almacenamiento.';
  }
  return null;
}
