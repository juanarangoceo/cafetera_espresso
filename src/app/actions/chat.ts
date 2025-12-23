'use server';

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createOrder } from "@/app/actions/order"; // 1. Importar acción de orden

const SYSTEM_INSTRUCTION = `
ROL:
Eres Marco, Head Barista de "Coffee Maker Pro". Tu tono es conversacional, experto y educativo. No solo vendes, **asesoras y enseñas** por qué el buen café mejora la vida.

LA OFERTA IRRESISTIBLE (PACK BARISTA PRO):
- Producto Principal: Cafetera Espresso Pro (20 Bares, Acero Inox).
- REGALOS (Valorados en $250k): Molino Eléctrico + E-book "Barista Master" + Tamper.
- PRECIO: **$490.000** (Escríbelo así, sin puntos al final de la cifra para evitar confusiones, y siempre en una sola línea).
- ENVÍO: Gratis y SOLO PAGAS AL RECIBIR (Contraentrega).

OBJETIVO PRINCIPAL (VENTA AUTOMATIZADA):
**Tu meta principal es cerrar la venta AQUÍ MISMO.**
Si el usuario muestra interés en comprar, NO lo mandes a la web. **Pídele sus datos amablemente** (Nombre, Celular, Ciudad, Dirección) uno por uno o todos juntos.

REGLAS DE ORO DE INTERACCIÓN:
1.  **EDUCAR PARA VENDER:** Antes de pedir la compra o datos, da un dato curioso o consejo breve.
2.  **FORMATO DE PRECIO:** Escribe siempre "$490.000" completo.
3.  **TOMA DE PEDIDO:**
    - Si el usuario dice "quiero comprar", responde: "¡Perfecto! 🎉 Para enviarte tu Pack Barista Pro con pago contraentrega, necesito unos datos. ¿Cuál es tu Nombre completo?"
    - Ve pidiendo los datos que falten (Celular, Ciudad, Dirección).
4.  **EJECUCIÓN DE ORDEN (CRÍTICO):**
    - Una vez tengas los 4 datos (Nombre, Celular, Ciudad, Dirección), **NO confirmes con texto**.
    - **EJECUTA INMEDIATAMENTE la función \`create_cod_order\`** con los datos recolectados.
    - NO digas "voy a crear tu orden", HAZLO.

EJEMPLO DE FLUJO DE CIERRE:
- Usuario: "Vivo en Bogotá, Calle 123, Juan Perez, 3001234567"
- Marco: (NO ESCRIBE TEXTO, LLAMA A LA FUNCIÓN \`create_cod_order\` SILENCIOSAMENTE).
`;

// 2. Definir la Herramienta (Tool) para Gemini
// Usamos 'any' para evitar conflictos de tipos con la versión instalada del SDK
const tools: any = [
  {
    functionDeclarations: [
      {
        name: "create_cod_order",
        description: "Creates a Cash on Delivery (COD) order for the Coffee Maker Pro Pack. Use this IMMEDIATELY when you have collected the user's Full Name, Phone, City, and Address.",
        parameters: {
          type: "OBJECT",
          properties: {
            fullName: { type: "STRING", description: "Customer's full name" },
            phone: { type: "STRING", description: "Customer's phone number" },
            city: { type: "STRING", description: "City for delivery" },
            address: { type: "STRING", description: "Full delivery address" },
          },
          required: ["fullName", "phone", "city", "address"],
        },
      },
    ],
  },
];

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

    // 2. Persistir Mensaje del Usuario
    if (supabase && sessionId) {
        (async () => {
            try {
                const { error: sessionError } = await supabase
                    .from('chat_sessions')
                    .insert({ id: sessionId })
                    .select();

                if (sessionError && sessionError.code !== '23505') { 
                     console.error("Error creating session:", sessionError);
                }

                const { error: msgError } = await supabase
                    .from('chat_messages')
                    .insert({ session_id: sessionId, role: 'user', content: userMessage });
                
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
                tools: tools, 
            },
            history: history.map(h => ({
                role: h.role,
                parts: h.parts
            }))
        });

        // Enviamos mensaje
        const result: any = await chat.sendMessage(userMessage);
        
        // 3. Manejar Llamada a Función (Function Calling)
        // Intentamos obtener las llamadas a función de forma segura para varias versiones del SDK
        let functionCalls = null;
        
        if (typeof result.functionCalls === 'function') {
             functionCalls = result.functionCalls();
        } else if (result.functionCalls) {
             functionCalls = result.functionCalls;
        } else if (result.response && typeof result.response.functionCalls === 'function') {
             functionCalls = result.response.functionCalls();
        }

        let finalResponseText = "";

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
            if (call.name === "create_cod_order") {
                const args = call.args as any;
                console.log("🤖 Gemini triggering order creation:", args);

                // Ejecutamos la Server Action real
                const orderResult = await createOrder({
                    fullName: args.fullName,
                    phone: args.phone,
                    city: args.city,
                    address: args.address
                });

                if (orderResult.success) {
                    finalResponseText = `¡Listo ${args.fullName}! ☕🎉\n\nYa agendé tu pedido para **${args.city}**. Te llegará la confirmación y guía pronto.\n\nGracias por elegir Coffee Maker Pro. ¡Prepárate para el mejor café de tu vida!`;
                } else {
                    finalResponseText = `Uuups, tuve un pequeño problema técnico al guardar el pedido: ${orderResult.message}. \n\n¿Podrías intentar enviarme los datos nuevamente o usar el formulario de arriba?`;
                }
            }
        } else {
            // Obtener texto de respuesta de manera segura
            if (result.response && typeof result.response.text === 'function') {
                finalResponseText = result.response.text();
            } else if (result.response && result.response.text) {
                 finalResponseText = result.response.text;
            } else if (typeof result.text === 'function') {
                 finalResponseText = result.text();
            } else {
                 finalResponseText = "Disculpa, no entendí bien.";
            }
        }

        // 4. Persistir Respuesta del Bot
        if (supabase && sessionId) {
             (async () => {
                try {
                     const { error } = await supabase
                        .from('chat_messages')
                        .insert({ session_id: sessionId, role: 'model', content: finalResponseText });
                
                    if (error) console.error("Error saving bot response:", error);
                } catch (err) {
                     console.error("Error persisting bot response:", err);
                }
             })();
        }

        return finalResponseText;

    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        return "Lo siento, estoy teniendo problemas para conectar con la central de café. ¿Podrías intentar de nuevo en un momento?";
    }
}
