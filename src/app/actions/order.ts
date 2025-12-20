'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const orderSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
});

export async function createOrder(formData: any) {
  // 1. Validar variables de entorno CRITICAS para Vercel/Local
  // Se hace dentro de la función para no romper el build estático si faltan en build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables are missing.');
    console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    return { 
      success: false, 
      message: 'Error de configuración del servidor. Por favor contacta al soporte.' 
    };
  }

  // 2. Validar Input del Usuario
  const validation = orderSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // 3. Inicializar Cliente
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 4. Insertar en Supabase y CAPTURAR ERROR EXPLICITAMENTE
    const { error } = await supabase
      .from('orders_cod')
      .insert([
        {
          full_name: validation.data.fullName,
          phone: validation.data.phone,
          city: validation.data.city,
          address: validation.data.address,
          total_price: 490000, // Hardcoded por ahora ya que es producto único
          status: 'pending'
        },
      ]);

    // 5. Manejo de Errores de Supabase
    if (error) {
        console.error("❌ Supabase Insert Error:", error); // Log detallado para Vercel
        return { 
            success: false, 
            message: 'Hubo un error guardando el pedido. Intenta nuevamente.' 
        };
    }

    // 6. Retorno Exitoso
    return { success: true, message: 'Pedido confirmado exitosamente' };

  } catch (err: any) {
    // Catch para errores de red o inesperados (no de Supabase logic per se)
    console.error('❌ Unexpected Error in createOrder:', err);
    return { success: false, message: 'Error inesperado al procesar el pedido.' };
  }
}
