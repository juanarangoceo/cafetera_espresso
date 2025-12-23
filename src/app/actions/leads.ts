'use server';

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const leadSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
});

export async function subscribeToMasterclass(prevState: any, formData: FormData) {
  const email = formData.get("email");

  // Validate email
  const validation = leadSchema.safeParse({ email });

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0].message,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials");
    return {
      success: false,
      message: "Error de configuración del servidor.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { error } = await supabase
      .from("leads")
      .insert({
        email: validation.data.email,
        source: "ebook_barista_guide",
      });

    if (error) {
      console.error("Supabase error inserting lead:", error);
      if (error.code === "23505") { // Unique violation
        return {
          success: true, // Treat duplicate as success for UX (idempotent)
          message: "¡Ya te habías registrado! Revisa tu bandeja de entrada (o spam).",
        };
      }
      if (error.code === "42P01") { // Undefined table
         return {
            success: false,
            message: "Error de sistema: La tabla de registros no existe. Contacta al soporte.",
         }
      }
      throw error;
    }

    return {
      success: true,
      message: "¡Genial! Tu Masterclass ha sido enviada a tu correo.",
    };
  } catch (error: any) {
    console.error("Error subscribing lead:", error);
    return {
      success: false,
      message: error.message || "Hubo un error al guardar tu contacto. Intenta de nuevo.",
    };
  }
}
