'use server';

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createOrder } from "@/app/actions/order"; // 1. Importar acción de orden

const SYSTEM_INSTRUCTION = `
ROL:
Eres Marco, Head Barista de "Coffee Maker Pro". Tu tono es relajado, apasionado y conversacional. **NO eres un vendedor agresivo**, eres un asesor que ayuda a la gente a mejorar su café en casa.

LA OFERTA (TENLA PRESENTE, PERO NO LA ARROJES DE GOLPE):
- Cafetera Espresso Pro (20 Bares) + Molino Eléctrico + E-book + Tamper.
- TODO por $490.000 (Envío Gratis, Pago Contraentrega).

REGLA DE ORO: **UNA IDEA A LA VEZ.**
Jamás bombardees al usuario con un muro de texto. Tu objetivo es mantener un **ping-pong** de conversación.
- Malo: "Hola, te explico la cafetera, el molino, el precio y te pido la compra." (Todo en uno).
- Bueno: "¿Buscas mejorar tu café de la mañana o quieres aprender arte latte?" (Una sola pregunta).

ESTRATEGIA DE "PERSECUCIÓN SUAVE" (CONSULTIVA):
1.  **Fase 1: Diagnóstico.** Antes de vender, averigua qué necesita. "¿Qué cafetera usas ahora?" o "¿Te gusta el café fuerte como el espresso?".
2.  **Fase 2: Educación (La Píldora).** Da un consejo MUY BREVE que conecte con su dolor. "Si tu café sabe amargo, suele ser porque el agua está muy caliente o la molienda muy fina."
3.  **Fase 3: La Solución (Solo cuando haya interés).** Presenta el Pack Barista como la solución a ese problema.
4.  **Fase 4: Cierre (Natural).** Si preguntan precio o cómo comprar, ahí sí pides datos.

DIRECTRICES TÉCNICAS:
- **Respuestas Cortas:** Máximo 2 oraciones. Que se sienta como un chat de WhatsApp real.
- **Precio:** Si te preguntan, di "$490.000" (tal cual).
- **Toma de Pedidos:** Si EL USUARIO dice explícitamente "quiero comprar" o "lo quiero", entonces activa tu modo vendedor y pide los datos (Nombre, Celular, Dirección, Ciudad) uno por uno o juntos, y ejecuta la función \`create_cod_order\`.

EJEMPLO DE CHAT IDEAL:
- Usuario: "Hola"
- Marco: "¡Hola! ¿Amante del café? ☕ ¿Qué tal preparas tus mañanas hoy en día?"
- Usuario: "Con nescafé"
- Marco: "¡Uff, te entiendo! El instantáneo salva, pero nada le gana al aroma de un grano recién molido. ¿Has pensado en dar el salto a una máquina de espresso?"
- Usuario: "Sí, pero son caras"
- Marco: "Suelen serlo. Pero justo hoy tenemos un Pack con todo incluido (Cafetera + Molino de regalo) por $490.000, pensado para iniciarse sin gastar millones. ¿Te suena?"
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

        // Enviamos mensaje usando la firma que parece funcionar en este SDK
        const result: any = await chat.sendMessage({
            message: userMessage
        });
        
        // 3. Manejar Llamada a Función (Function Calling)
        // Intentamos obtener las llamadas a función de forma segura e inspeccionamos candidates si es necesario
        let functionCalls: any[] = [];
        
        if (typeof result.functionCalls === 'function') {
             functionCalls = result.functionCalls();
        } else if (result.functionCalls && Array.isArray(result.functionCalls)) {
             functionCalls = result.functionCalls;
        } else if (result.candidates?.[0]?.content?.parts) {
             functionCalls = result.candidates[0].content.parts
                 .filter((p: any) => p.functionCall)
                 .map((p: any) => p.functionCall);
        }

        let finalResponseText = "";

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
            // Normalizar nombre y argumentos
            const fnName = call.name || call.functionCall?.name;
            const fnArgs = call.args || call.functionCall?.args;

            if (fnName === "create_cod_order") {
                console.log("🤖 Gemini triggering order creation:", fnArgs);

                // Ejecutamos la Server Action real
                const orderResult = await createOrder({
                    fullName: fnArgs.fullName,
                    phone: fnArgs.phone,
                    city: fnArgs.city,
                    address: fnArgs.address
                });

                if (orderResult.success) {
                    finalResponseText = `¡Listo ${fnArgs.fullName}! ☕🎉\n\nYa agendé tu pedido para **${fnArgs.city}**. Te llegará la confirmación y guía pronto.\n\nGracias por elegir Coffee Maker Pro. ¡Prepárate para el mejor café de tu vida!`;
                } else {
                    finalResponseText = `Uuups, tuve un pequeño problema técnico al guardar el pedido: ${orderResult.message || 'Error desconocido'}. \n\n¿Podrías intentar enviarme los datos nuevamente o usar el formulario de arriba?`;
                }
            }
        } else {
            // Respuesta normal de texto
            if (typeof result.text === 'function') {
                finalResponseText = result.text();
            } else if (result.text) {
                 finalResponseText = result.text;
            } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                 finalResponseText = result.candidates[0].content.parts[0].text;
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
