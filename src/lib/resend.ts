import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY?.trim();

// El correo es complementario: un pedido contraentrega guardado no puede
// convertirse en error solo porque el dueño decidió aplazar Resend. Cuando no
// hay clave se omite el envío sin crear un cliente con credenciales falsas.
export const resend = apiKey ? new Resend(apiKey) : null;
