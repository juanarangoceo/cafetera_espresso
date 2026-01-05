import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from '@react-email/components';
import React from 'react';

interface OrderConfirmationProps {
  fullName: string;
  totalPrice: number;
  paymentMethod: string;
  city: string;
  orderId?: string;
}

export const OrderConfirmation = ({
  fullName = 'Amante del Café',
  totalPrice = 490000,
  paymentMethod = 'Contraentrega',
  city = 'Bogotá',
  orderId = 'PENDIENTE',
}: OrderConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>¡Tu pedido de Coffee Maker Pro está confirmado!</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                coffee: {
                  50: '#fcf9f6',
                  100: '#f6f0ea',
                  600: '#834d3b',
                  900: '#58362e',
                },
                gold: {
                  500: '#cc9710',
                },
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            {/* Header / Logo */}
            <Section className="mb-8 text-center">
             {/* Replace with your actual logo URL usually hosted on public bucket or website */}
             <Heading className="text-3xl font-serif font-bold text-coffee-900 m-0">
               Coffee<span className="text-gold-500">Maker</span>Pro
             </Heading>
            </Section>

            {/* Main Card */}
            <Section className="bg-coffee-50 border border-coffee-100 rounded-2xl p-8 shadow-sm">
              <Heading className="text-2xl font-bold text-coffee-900 mb-4 text-center">
                ¡Gracias por tu compra, {fullName.split(' ')[0]}! ☕
              </Heading>
              
              <Text className="text-coffee-600 text-base leading-relaxed text-center mb-8">
                Hemos recibido tu pedido correctamente. Estamos preparando tu <strong>Pack Barista</strong> para que inicies tu viaje en el mundo del café de especialidad.
              </Text>

              <Hr className="border-coffee-100 my-6" />

              {/* Order Details */}
              <Section className="bg-white rounded-xl p-6 border border-coffee-100">
                <Text className="text-xs uppercase tracking-wider font-bold text-coffee-600 mb-4">
                  Resumen del Pedido
                </Text>
                
                <div className="flex justify-between items-center mb-3">
                  <Text className="text-coffee-900 m-0 font-medium">Cafetera Espresso Pro + Kit Regalo</Text>
                  <Text className="text-coffee-900 m-0 font-bold">$490.000</Text>
                </div>
                 <div className="flex justify-between items-center mb-3">
                  <Text className="text-coffee-900 m-0 font-medium">Envío</Text>
                  <Text className="text-green-600 m-0 font-bold">Gratis</Text>
                </div>
                
                <Hr className="border-dashed border-coffee-100 my-4" />
                
                <div className="flex justify-between items-center">
                  <Text className="text-lg font-bold text-coffee-900 m-0">Total</Text>
                  <Text className="text-xl font-bold text-gold-500 m-0">
                    ${totalPrice.toLocaleString('es-CO')}
                  </Text>
                </div>
              </Section>

              <Section className="mt-6">
                <Text className="text-sm text-coffee-600 m-0 mb-2">
                  <strong>Método de Pago:</strong> {paymentMethod} (Pagas al recibir)
                </Text>
                <Text className="text-sm text-coffee-600 m-0">
                  <strong>Ciudad de Destino:</strong> {city}
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="text-center mt-8">
              <Text className="text-sm text-coffee-600 mb-2">
                ¿Tienes alguna duda? Responde a este correo.
              </Text>
              <Text className="text-xs text-coffee-400">
                © 2024 Coffee Maker Pro. Todos los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmation;
