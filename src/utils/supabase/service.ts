import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env';

/**
 * Cliente con `SUPABASE_SECRET_KEY`, que **se salta todas las políticas RLS**.
 *
 * Solo servidor y solo para lo que no puede resolverse con la sesión de quien
 * pide: hoy, comprobar si un correo tiene pedidos antes de enviarle su enlace
 * de acceso, cuando todavía no hay sesión de ninguna clase.
 *
 * Devuelve `null` si la variable no está configurada, para que quien llame
 * decida qué hacer en vez de caer silenciosamente a la clave pública.
 */
export function createServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) return null;

  const { url } = getSupabaseConfig();

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
