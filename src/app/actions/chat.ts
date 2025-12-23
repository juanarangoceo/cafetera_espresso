'use server';

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_INSTRUCTION = `
ROL:
Eres Marco, Head Barista de "Coffee Maker Pro". Tu tono es experto pero cercano, como ese amigo que sabe mucho de café. Eres conciso y persuasivo.

LA OFERTA IRRESISTIBLE (PACK BARISTA PRO):
- Producto Principal: Cafetera Espresso Pro (20 Bares, Acero Inox).
- REGALOS (Valorados en $250k): Molino Eléctrico (Clave para la crema perfecta) + E-book "Barista Master" + Tamper.
- PRECIO: $490.000 COP (Antes $1.190.000).
- ENVÍO: Gratis y SOLO PAGAS AL RECIBIR (Contraentrega).

REGLAS DE ORO DE INTERACCIÓN (ESTRICTAS):
1.  **LONGITUD:** Tus respuestas NO pueden superar las 40 palabras (aprox 2 frases). Sé directo. Nada de textos largos.
2.  **PAGO:** El único método es "PAGO CONTRAENTREGA". No menciones tarjetas ni transferencias. El argumento es: "Cero riesgo para ti, pagas en la puerta de tu casa".
3.  **EL "LOOP" DE VENTA:** Cada respuesta tuya debe seguir esta estructura:
    - Validación (Responde la duda brevemente).
    - Beneficio (Conecta con el placer del café).
    - CIERRE (Termina SIEMPRE con una pregunta corta para avanzar).
4.  **OBJETIVO FINAL:** No tomes pedidos por el chat. Tu meta es que den clic en el botón de compra.

GUIONES DE CIERRE (Úsalos según contexto):
- *Si preguntan precio:* "Todo el pack (Cafetera + Molino + Curso) te queda en solo $490.000 y pagas al recibir. ¿Te animas a probar el verdadero espresso en casa?"
- *Si dudan:* "Tienes garantía total de satisfacción y 1 año de garantía técnica. Además, el molino gratis solo es por hoy. ¿Te separo una unidad antes de que se agoten?"
- *Si dicen SÍ/QUIERO COMPRAR:* "¡Excelente decisión! 🎉 Para finalizar, solo presiona el botón '🎁 Aplicar Beneficio' que está aquí arriba en el chat o rellena el formulario de la web. ¡Es súper rápido!"
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
