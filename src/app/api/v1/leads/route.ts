import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/utils/supabase/service';
import { hashSiteKey, readBearerKey } from '@/lib/site-keys';

/**
 * Captación de correos desde la landing de un cliente.
 *
 * Espejo de `/api/v1/orders` para el otro camino de escritura de la landing.
 * El correo se atribuye al sitio que lo captó: sin eso, los suscriptores de
 * todos los clientes se acumularían bajo la primera landing y ninguno podría
 * leer los suyos.
 */

export const dynamic = 'force-dynamic';

const leadSchema = z.object({
  email: z.string().email('Por favor ingresa un email válido.'),
});

export async function POST(request: NextRequest) {
  const key = readBearerKey(request.headers.get('authorization'));
  if (!key) {
    return NextResponse.json(
      { success: false, message: 'Credencial de sitio inválida.' },
      { status: 401 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { success: false, message: 'Error de configuración del servidor.' },
      { status: 500 },
    );
  }

  const { data: keyRow } = await service
    .from('site_api_keys')
    .select('site_id, revoked_at')
    .eq('key_hash', hashSiteKey(key))
    .maybeSingle();

  if (!keyRow || keyRow.revoked_at) {
    return NextResponse.json(
      { success: false, message: 'Credencial de sitio inválida.' },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'El cuerpo de la petición no es JSON válido.' },
      { status: 400 },
    );
  }

  const validation = leadSchema.safeParse(payload);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: validation.error.issues[0].message },
      { status: 422 },
    );
  }

  const { error } = await service.from('leads').insert({
    email: validation.data.email.toLowerCase(),
    source: 'ebook_barista_guide',
    site_id: keyRow.site_id,
  });

  if (error) {
    // Volver a suscribirse no es un fallo que el visitante deba resolver: ya
    // está en la lista. Se responde como éxito a propósito.
    if (error.code === '23505') {
      return NextResponse.json({
        success: true,
        message: '¡Ya te habías registrado! Revisa tu bandeja de entrada (o spam).',
      });
    }

    console.error('❌ No se pudo guardar el correo captado:', error);
    return NextResponse.json(
      { success: false, message: 'Hubo un error al guardar tu contacto. Intenta de nuevo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: '¡Genial! Tu Masterclass ha sido enviada a tu correo.',
  });
}
