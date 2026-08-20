'use server'

import { resend } from '@/lib/resend'

import { OrderConfirmation } from '@/emails/OrderConfirmation'

interface OrderDetails {
  orderId: string
  fullName: string
  email: string
  siteName: string
  productName: string
  totalPrice: number
  paymentMethod: string
  city: string
}

export async function sendOrderConfirmationEmail(order: OrderDetails) {
  if (!resend) {
    console.info('ℹ️ Confirmación por correo omitida: Resend no está habilitado.');
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      // Remitente neutral mientras cada sitio no tenga un dominio verificado
      // propio. El contenido y el asunto sí se resuelven por cliente.
      from: 'Nitro Landing <onboarding@resend.dev>',
      to: [order.email],
      subject: `Confirmación de pedido - ${order.siteName}`,
      react: <OrderConfirmation
        orderId={order.orderId}
        fullName={order.fullName}
        siteName={order.siteName}
        productName={order.productName}
        totalPrice={order.totalPrice}
        paymentMethod={order.paymentMethod}
        city={order.city}
      />,
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
