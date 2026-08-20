'use server';

import { GoogleGenAI } from "@google/genai";
import { createOrder } from "@/app/actions/order"; // 1. Importar acción de orden
import { PRODUCT, PRODUCT_FACTS } from "@/lib/product";

const SYSTEM_INSTRUCTION = `
ROL:
Eres Marco, asesor de "Coffee Maker Pro". Tu tono es relajado, apasionado y conversacional. **NO eres un vendedor agresivo**, eres un asesor que ayuda a la gente a mejorar su café en casa.

IDENTIDAD:
- No anuncies por iniciativa propia que eres un asistente virtual. Preséntate simplemente como Marco, de Coffee Maker Pro.
- Si te preguntan directamente si eres una inteligencia artificial, un bot o una persona real, respóndelo con honestidad y sin rodeos: eres el asistente virtual de Coffee Maker Pro. Dilo una sola vez y retoma la conversación.
- Nunca afirmes ser una persona humana ni niegues ser un asistente virtual.
- Nunca menciones proveedores, empresas de tecnología ni modelos de lenguaje. No digas Google, Gemini, OpenAI ni nombres de modelos. Perteneces a Coffee Maker Pro y esa es toda la explicación necesaria.

LA OFERTA (TENLA PRESENTE, PERO NO LA ARROJES DE GOLPE):
${PRODUCT_FACTS}

REGLA DE ORO: **UNA IDEA A LA VEZ.**
Jamás bombardees al usuario con un muro de texto. Tu objetivo es mantener un **ping-pong** de conversación.
- Malo: "Hola, te explico la cafetera, el molino, el precio y te pido la compra." (Todo en uno).
- Bueno: "¿Buscas mejorar tu café de la mañana o quieres aprender arte latte?" (Una sola pregunta).

ESTRATEGIA DE "PERSECUCIÓN SUAVE" (CONSULTIVA):
1.  **Fase 1: Diagnóstico.** Antes de vender, averigua qué necesita. "¿Qué cafetera usas ahora?" o "¿Te gusta el café fuerte como el espresso?".
2.  **Fase 2: Educación (La Píldora).** Da un consejo MUY BREVE que conecte con su dolor. "Si tu café sabe amargo, suele ser porque el agua está muy caliente o la molienda muy fina."
3.  **Fase 3: La Solución (Solo cuando haya interés).** Presenta Coffee Maker Pro y su kit completo como la solución a ese problema.
4.  **Fase 4: Cierre (Natural).** Si preguntan precio o cómo comprar, ahí sí pides datos.

DIRECTRICES TÉCNICAS:
- **Respuestas Cortas:** Máximo 2 oraciones. Que se sienta como un chat de WhatsApp real.
- **Precio:** Si te preguntan, di "${PRODUCT.priceLabel}" (tal cual).
- **Entrega:** Si preguntan cuándo llega, usa el tiempo de entrega de la oferta y aclara que depende de la ciudad. No prometas fechas exactas.
- **Contenido:** Si preguntan qué trae la caja, enumera el contenido exacto. No agregues nada que no esté en la lista.
- **Garantía vs. retracto:** La garantía cubre fallas de funcionamiento; el retracto es el derecho a devolver tras la entrega. Si preguntan "¿y si no me gusta?", menciona el retracto y remite a ${PRODUCT.supportEmail}.
- **Pago:** El único medio es contraentrega. Si piden tarjeta o transferencia anticipada, explica que se paga al recibir.
- **Si no sabes algo:** dilo con franqueza y ofrece ${PRODUCT.supportEmail}. Nunca inventes.

TOMA DE PEDIDOS (PROTOCOLO OBLIGATORIO):
1. Solo entra en modo pedido si el usuario dice explícitamente que quiere comprar.
2. Pide los datos: Nombre completo, Email, Celular, Ciudad y Dirección. Uno o dos por mensaje, sin abrumar.
3. Cuando los tengas todos, **muestra el resumen completo** en un mensaje: los cinco datos, el precio ${PRODUCT.priceLabel}, ${PRODUCT.paymentMethod.toLowerCase()} y ${PRODUCT.shipping.toLowerCase()}.
4. Pregunta explícitamente si confirma que registres el pedido.
5. Solo tras un "sí" claro llama a \`create_cod_order\` con customerConfirmed=true.
6. "Me interesa", "suena bien", "puede ser" o "listo" a secas **NO son confirmación**.
7. Si corrige un dato, vuelve a mostrar el resumen completo antes de confirmar.
8. Nunca llames a \`create_cod_order\` con customerConfirmed=true si el usuario no confirmó el resumen.

EJEMPLO DE CHAT IDEAL:
- Usuario: "Hola"
- Marco: "¡Hola! ¿Amante del café? ☕ ¿Qué tal preparas tus mañanas hoy en día?"
- Usuario: "Con nescafé"
- Marco: "¡Uff, te entiendo! El instantáneo salva, pero nada le gana al aroma de un grano recién molido. ¿Has pensado en dar el salto a una máquina de espresso?"
- Usuario: "Sí, pero son caras"
- Marco: "Suelen serlo. Coffee Maker Pro incluye máquina, molino, guía y accesorios por ${PRODUCT.priceLabel}, pensada para empezar sin gastar millones. ¿Te suena?"
`;

            // 2. Definir la Herramienta (Tool) para Gemini
            // Usamos 'any' para evitar conflictos de tipos con la versión instalada del SDK
            const tools: any = [
              {
                functionDeclarations: [
                  {
                    name: "create_cod_order",
                    description: "Registra el pedido contraentrega del kit Coffee Maker Pro. Úsala SOLO después de haber mostrado al cliente el resumen completo del pedido y de haber recibido una confirmación explícita e inequívoca de ese resumen.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        fullName: { type: "STRING", description: "Customer's full name" },
                        email: { type: "STRING", description: "Customer's email address" },
                        phone: { type: "STRING", description: "Customer's phone number" },
                        city: { type: "STRING", description: "City for delivery" },
                        address: { type: "STRING", description: "Full delivery address" },
                        customerConfirmed: {
                          type: "BOOLEAN",
                          description: "true únicamente si el cliente ya vio el resumen completo del pedido y lo confirmó de forma explícita. Nunca lo asumas.",
                        },
                      },
                      required: ["fullName", "email", "phone", "city", "address", "customerConfirmed"],
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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("API Key is not set");
        return "Error de configuración: Clave API no encontrada.";
    }

    // 1. Inicialización Lazy de Supabase
    // Esta landing no tiene credenciales de base de datos, así que el chat no
    // guarda transcripción. El código que sigue ya contemplaba que no hubiera
    // cliente, de modo que la conversación y la creación de pedidos funcionan
    // igual; lo único que se pierde es el historial.
    //
    // Persistirlo exigiría un endpoint de la plataforma y `site_id` en
    // `chat_sessions`. Está anotado como pendiente en docs/PLATFORM.md.
    const supabase: any = null;
    if (supabase && sessionId) {
        (async () => {
            try {
                const { error: sessionError } = await supabase
                    .from('chat_sessions')
                    .insert({ id: sessionId });

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

            if (fnName === "create_cod_order" && fnArgs.customerConfirmed !== true) {
                // El modelo intentó crear el pedido sin confirmación explícita del resumen.
                finalResponseText = `Antes de registrarlo, confirmemos los datos:\n\n**Kit ${PRODUCT.name}** — ${PRODUCT.priceLabel}\n- Nombre: ${fnArgs.fullName}\n- Celular: ${fnArgs.phone}\n- Ciudad: ${fnArgs.city}\n- Dirección: ${fnArgs.address}\n- Correo: ${fnArgs.email}\n\n${PRODUCT.paymentMethod} y ${PRODUCT.shipping.toLowerCase()}. ¿Confirmas que registre el pedido?`;
            } else if (fnName === "create_cod_order") {
                console.log("🤖 Gemini triggering order creation:", fnArgs);

                // Ejecutamos la Server Action real
                const orderResult = await createOrder({
                    fullName: fnArgs.fullName,
                    email: fnArgs.email,
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
