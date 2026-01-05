'use server'

import { resend } from '@/lib/resend'

import { OrderConfirmation } from '@/emails/OrderConfirmation'

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
      from: 'CoffeeMaker Pro <onboarding@resend.dev>', // Change this if you have a verified domain
      to: [order.email], 
      subject: 'Confirmación de Pedido - Cafetera Espresso Pro',
      react: <OrderConfirmation 
        fullName={order.fullName}
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
