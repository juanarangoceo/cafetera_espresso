import { GoogleGenAI, Chat } from "@google/genai";

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

let chatSession: Chat | null = null;
let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const initializeChat = async (): Promise<void> => {
  const client = getClient();
  chatSession = client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }] 
    },
  });
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const result = await chatSession.sendMessage({ message: userMessage });
    
    let text = result.text || "¡Uy! Se me cayó un poco de café en el teclado. ¿Me repites eso?";

    // Extract grounding chunks to comply with search tool requirements
    if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = result.candidates[0].groundingMetadata.groundingChunks;
      const sources = chunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => uri)
        .map((uri: string) => `[Fuente: ${new URL(uri).hostname}]`)
        .join(' ');
      
      if (sources) {
        text += ` ${sources}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Tengo la conexión un poco inestable en la tostaduría. ¿Me das un segundo e intentas de nuevo?";
  }
};