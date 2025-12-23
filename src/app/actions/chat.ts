'use server';

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_INSTRUCTION = `
ROL:
Eres Marco, Head Barista de "Coffee Maker Pro". Tu tono es conversacional, experto y educativo. No solo vendes, **asesoras y enseñas** por qué el buen café mejora la vida.

LA OFERTA IRRESISTIBLE (PACK BARISTA PRO):
- Producto Principal: Cafetera Espresso Pro (20 Bares, Acero Inox).
- REGALOS (Valorados en $250k): Molino Eléctrico + E-book "Barista Master" + Tamper.
- PRECIO: **$490.000** (Escríbelo así, sin puntos al final de la cifra para evitar confusiones, y siempre en una sola línea).
- ENVÍO: Gratis y SOLO PAGAS AL RECIBIR (Contraentrega).

REGLAS DE INTERACCIÓN:
1.  **EDUCAR PARA VENDER:** Antes de pedir la compra, da un dato curioso o consejo breve. Ejemplo: "Una cafetera de 20 bares extrae más aceites del grano, dándote esa crema espesa que ves en cafeterías."
2.  **FORMATO DE PRECIO:** Escribe siempre "$490.000" completo. Nunca separes la cifra.
3.  **CIERRE OBLIGATORIO:** *CADA* respuesta tuya debe terminar con una PREGUNTA.
    - Si estás educando: "¿Sabías que el molino es el 70% del sabor de tu espresso?"
    - Si estás cerrando: "¿Te gustaría recibir el Pack Barista mañana mismo?"
4.  **LONGITUD:** Mantén tus respuestas conversacionales pero concisas (máx 40-50 palabras).

EJEMPLO DE FLUJO:
- Usuario: "¿Es buena?"
- Marco: "¡Es una máquina profesional adaptada para casa! Su bomba de 20 bares garantiza una extracción perfecta, sin amargor quemado. Además, al ser de acero inoxidable, te durará años. ¿Buscas tu primera cafetera espresso o ya tienes experiencia?"
`;

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

    // 1. Inicialización Lazy de Supabase
    let supabase: any = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else {
        console.warn("⚠️ Supabase credentials needed for chat history persistence are missing.");
    }

    // 2. Persistir Mensaje del Usuario (Fire-and-Forget controlado)
    if (supabase && sessionId) {
        (async () => {
            try {
                // Primero intentamos crear la sesión si no existe
                const { error: sessionError } = await supabase
                    .from('chat_sessions')
                    .insert({ id: sessionId })
                    .select(); // .select() es a menudo necesario para confirmar la inserción o recibir error

                // Ignoramos error de duplicado (PGRST110 es violación de unique, pero 'ignoreDuplicates' en insert directo a veces es tricky sin upsert,
                // el usuario pidió específicamente: "Si el error es por 'clave duplicada'... ignóralo".
                // UPSERT es mas seguro para esto, pero seguiré la instrucción: insert y catch error.
                if (sessionError && sessionError.code !== '23505') { 
                     // 23505 es duplicate key value en Postgres
                     console.error("Error creating session:", sessionError);
                }

                // Guardar mensaje
                const { error: msgError } = await supabase
                    .from('chat_messages')
                    .insert({
                        session_id: sessionId,
                        role: 'user',
                        content: userMessage
                    });
                
                if (msgError) console.error("Error saving user message:", msgError);

            } catch (err) {
                console.error("❌ Unexpected Error persisting user message:", err);
            }
        })();
    }

    try {
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

        // 3. Persistir Respuesta del Modelo
        if (supabase && sessionId) {
            (async () => {
                try {
                    const { error } = await supabase
                        .from('chat_messages')
                        .insert({
                            session_id: sessionId,
                            role: 'model',
                            content: fullResponse
                        });
                    
                    if (error) console.error("Error saving model response:", error);

                } catch (dbError) {
                    console.error("❌ Unexpected Error persisting model response:", dbError);
                }
            })();
        }

        return fullResponse;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lo siento, tuve un problema técnico preparando el café. ¿Puedes repetir?";
    }
}
