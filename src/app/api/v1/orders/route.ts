import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { readBearerKey } from '@/lib/site-keys';
import { createOrderForSite, resolveSiteFromKey } from '@/lib/orders-intake';

/**
 * Ingesta de pedidos desde la landing de un cliente.
 *
 * Cada landing vive en su propio proyecto de Vercel y no lleva ninguna clave de
 * Supabase: solo su llave de sitio, que sirve para esto y nada más. Este
 * proyecto es el único que tiene `SUPABASE_SECRET_KEY`.
 *
 * La verificación de humano **no** ocurre aquí. BotID protege la ruta donde
 * está el formulario, que vive en el proyecto de la landing; para cuando la
 * petición llega a este endpoint ya es una llamada de servidor a servidor. Por
 * eso la llave es lo que la autoriza, y por eso no debe salir al navegador.
 */

export const dynamic = 'force-dynamic';

function unauthorized() {
  // Sin detalle sobre qué falló: distinguir "llave inexistente" de "llave
  // revocada" o "sitio inactivo" convertiría el endpoint en un oráculo para
  // averiguar qué llaves son válidas.
  return NextResponse.json(
    { success: false, message: 'Credencial de sitio inválida.' },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  const key = readBearerKey(request.headers.get('authorization'));
  if (!key) return unauthorized();

  const service = createServiceClient();
  if (!service) {
    console.error('❌ CRITICAL: falta SUPABASE_SECRET_KEY, la ingesta no puede escribir.');
    return NextResponse.json(
      { success: false, message: 'Error de configuración del servidor.' },
      { status: 500 },
    );
  }

  const site = await resolveSiteFromKey(service, key);
  if (!site) return unauthorized();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'El cuerpo de la petición no es JSON válido.' },
      { status: 400 },
    );
  }

  const result = await createOrderForSite(payload, site);

  if (!result.success) {
    // 422 y no 400: el cuerpo estaba bien formado y la credencial era válida;
    // lo que falló es el contenido del pedido.
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result, { status: 201 });
}
