'use server'

import { resend } from '@/lib/resend'

interface OrderDetails {
  fullName: string
  email: string
  totalPrice: number
  paymentMethod: string
  city: string
}

export async function sendOrderConfirmationEmail(order: OrderDetails) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CoffeeMaker Pro <onboarding@resend.dev>',
      // Try to send to the user's email.
      // NOTE: If your domain is NOT verified in Resend, this will only work if 
      // 'order.email' is the specific address you registered with Resend (or delivered@resend.dev).
      // Otherwise, it might fail or bounce in Test Mode.
      to: [order.email], 
      
      subject: 'Confirmación de Pedido - Cafetera Espresso Pro',
      html: `
        <div style="font-family: sans-serif; color: #58362e; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #cc9710;">¡Gracias por tu compra, ${order.fullName}!</h1>
          <p>Hemos recibido tu pedido de la <strong>Cafetera Espresso Pro</strong>.</p>
          <div style="background-color: #fcf9f6; padding: 20px; border-radius: 10px; border: 1px solid #eadcd3;">
            <p><strong>Total a pagar (Contraentrega):</strong> $${order.totalPrice.toLocaleString('es-CO')}</p>
            <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
          </div>
          <p>Tu pedido está siendo procesado y pronto nos pondremos en contacto contigo para coordinar la entrega en ${order.city}.</p>
          <p>Si tienes alguna pregunta, no dudes en responder a este correo.</p>
          <br/>
          <p style="font-size: 12px; color: #834d3b;">CoffeeMaker Pro - El arte del café en casa</p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error sending email:', error)
    return { success: false, error }
  }
}
