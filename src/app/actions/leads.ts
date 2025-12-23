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
        source: "barista_masterclass",
      });

    if (error) {
      if (error.code === "23505") { // Unique violation
        return {
          success: true, // Treat duplicate as success for UX (idempotent)
          message: "¡Ya te habías registrado! Revisa tu correo.",
        };
      }
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      success: true,
      message: "¡Enviado! Tu Masterclass llegará pronto.",
    };
  } catch (error) {
    console.error("Error subscribing lead:", error);
    return {
      success: false,
      message: "Hubo un error al guardar tu contacto. Intenta de nuevo.",
    };
  }
}
