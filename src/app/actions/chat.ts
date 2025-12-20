'use server';

import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Rol: Eres Marco, el Head Barista y experto en producto de "Coffee Maker Pro". Tu misión es cerrar la venta directa en la web.

LA OFERTA IRRESISTIBLE (SOLO POR HOY):
- **Producto:** Coffee Maker Pro (20 Bares).
- **REGALO EXCLUSIVO:** Molino de Café Eléctrico (Valorado en $180.000, hoy GRATIS). *Este es tu as bajo la manga*.
- **Bonus Adicionales:** Kit Barista (Tamper/Cuchara) + E-book "Barista Master" (Curso Digital).
- **Precio Total:** $490.000 COP (Oferta Flash).
- **Envío:** Gratis a toda Colombia.

CAMBIO DE ESTRATEGIA (NO WHATSAPP):
- El cliente compra DIRECTAMENTE en la página.
- Si preguntan cómo comprar: "Es muy fácil. Dale clic al botón 'Comprar Ahora' o 'Ir a Pagar'. Te llevará a nuestro formulario seguro para poner tus datos y elegir tu método de pago preferido."

ARGUMENTO DE VENTA (MOLINO):
- Si preguntan por qué el molino es importante: "El café molido pierde el 60% de su aroma en 15 minutos. Con el molino que te regalo hoy, mueles justo antes de preparar. Eso cambia el sabor de un 5/10 a un 10/10."

PERSONALIDAD:
- Experto, elegante, apasionado.
- Usas emojis con moderación ☕️ ✨.
- Generas urgencia real: "Nos quedan pocos molinos en inventario".

OBJETIVO:
Resolver dudas y dirigir al usuario a hacer clic en "COMPRAR AHORA" en la web.
`;


import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function sendMessageToGemini(
    userMessage: string, 
    history: { role: string, parts: { text: string }[] }[] = [],
    sessionId?: string
) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("API Key is not set");
        return "Error de configuración: Clave API no encontrada.";
    }

    try {
        // 1. Persist User Message (Fire and forget to not block)
        if (sessionId) {
            (async () => {
                try {
                    // Ensure session exists
                    await supabase.from('chat_sessions').upsert({ id: sessionId }, { onConflict: 'id', ignoreDuplicates: true });
                    // Save user message
                    await supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'user',
                        content: userMessage
                    });
                } catch (dbError) {
                    console.error("Supabase Persistence Error (User):", dbError);
                }
            })();
        }

        const client = new GoogleGenAI({ apiKey });

        const chat = client.chats.create({
            model: 'gemini-2.0-flash', 
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            },
            history: history.map(h => ({
                role: h.role,
                parts: h.parts
            }))
        });

        const result = await chat.sendMessage({
            message: userMessage
        });

        const text = result.text || "Disculpa, no entendí bien.";

        // Check for grounding (sources)
        let sourcesText = "";
        if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = result.candidates[0].groundingMetadata.groundingChunks;
            const sources = chunks
                .map((chunk: any) => chunk.web?.uri)
                .filter((uri: string) => uri)
                .map((uri: string) => `[Fuente: ${new URL(uri).hostname}]`)
                .join(' ');
            if (sources) sourcesText = ` ${sources}`;
        }
        
        const fullResponse = text + sourcesText;

        // 2. Persist Model Response
        if (sessionId) {
            (async () => {
                try {
                    await supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'model',
                        content: fullResponse
                    });
                } catch (dbError) {
                    console.error("Supabase Persistence Error (Model):", dbError);
                }
            })();
        }

        return fullResponse;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lo siento, tuve un problema técnico preparando el café. ¿Puedes repetir?";
    }
}
