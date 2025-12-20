'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Re-initialize for server-side usage to ensure clean execution environment
// or import from utils if acceptable. Importing strictly is fine usually.
// But to be safe with 'use server' sometimes explicit client creation is clearer.
// Let's reuse the variables/logic.
// Client initialization moved inside action to handle missing env vars gracefully

const orderSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
});

export async function createOrder(formData: any) {
  const validation = orderSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // Check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL ERROR: Supabase environment variables are missing.');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    return { 
      success: false, 
      message: 'Error de configuración del servidor. Contacta al soporte.' 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { error } = await supabase
      .from('orders_cod')
      .insert([
        {
          full_name: validation.data.fullName,
          phone: validation.data.phone,
          city: validation.data.city,
          address: validation.data.address,
        },
      ]);

    if (error) {
        console.error('Supabase Error:', error);
        throw new Error(error.message);
    }

    return { success: true, message: 'Pedido recibido' };
  } catch (err: any) {
    console.error('Error in createOrder:', err);
    return { success: false, message: 'Error al procesar el pedido. Inténtalo de nuevo.' };
  }
}
