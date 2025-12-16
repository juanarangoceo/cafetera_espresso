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

export async function sendMessageToGemini(userMessage: string, history: { role: string, parts: { text: string }[] }[] = []) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("API Key is not set");
        return "Error de configuración: Clave API no encontrada.";
    }

    try {
        const client = new GoogleGenAI({ apiKey });

        // Map history to the format expected by the SDK if needed, 
        // but the new SDK usually takes 'contents' in generateContent or chats.
        // We will use a simple chat session per request for now, or stateless generateContent if history is complex.
        // For simplicity and robustness in serverless, we'll just send the message with system instruction.

        // Note: To properly maintain history in a server action without a DB, 
        // we would need to pass the full history from the client.
        // For this implementation, we will perform a single-turn generation 
        // or a multi-turn if history is provided.

        const chat = client.chats.create({
            model: 'gemini-2.0-flash', // Updating to latest stable or flash model
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

        return text + sourcesText;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lo siento, tuve un problema técnico preparando el café. ¿Puedes repetir?";
    }
}
