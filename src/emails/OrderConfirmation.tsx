import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from '@react-email/components';
import React from 'react';

interface OrderConfirmationProps {
  siteName: string;
  productName: string;
  fullName: string;
  totalPrice: number;
  paymentMethod: string;
  city: string;
  orderId: string;
}

export const OrderConfirmation = ({
  siteName,
  productName,
  fullName,
  totalPrice,
  paymentMethod = 'Contraentrega',
  city = 'Bogotá',
  orderId,
}: OrderConfirmationProps) => {
  const firstName = fullName.trim().split(/\s+/)[0] || 'cliente';

  return (
    <Html>
      <Head />
      <Preview>Tu pedido en {siteName} está confirmado.</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                ink: {
                  50: '#f8fafc',
                  100: '#e2e8f0',
                  600: '#475569',
                  900: '#0f172a',
                },
                accent: {
                  500: '#f59e0b',
                },
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="mb-8 text-center">
              <Heading className="m-0 text-3xl font-bold text-ink-900">{siteName}</Heading>
            </Section>

            <Section className="rounded-2xl border border-ink-100 bg-ink-50 p-8 shadow-sm">
              <Heading className="mb-4 text-center text-2xl font-bold text-ink-900">
                ¡Gracias por tu compra, {firstName}!
              </Heading>

              <Text className="mb-8 text-center text-base leading-relaxed text-ink-600">
                Recibimos correctamente tu pedido de <strong>{productName}</strong>. El equipo de{' '}
                {siteName} continuará con la preparación y entrega.
              </Text>

              <Hr className="my-6 border-ink-100" />

              <Section className="rounded-xl border border-ink-100 bg-white p-6">
                <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-600">
                  Resumen del Pedido
                </Text>

                <div className="flex justify-between items-center mb-3">
                  <Text className="m-0 font-medium text-ink-900">{productName}</Text>
                  <Text className="m-0 font-bold text-ink-900">
                    ${totalPrice.toLocaleString('es-CO')}
                  </Text>
                </div>

                <Hr className="my-4 border-dashed border-ink-100" />

                <div className="flex justify-between items-center">
                  <Text className="m-0 text-lg font-bold text-ink-900">Total</Text>
                  <Text className="m-0 text-xl font-bold text-accent-500">
                    ${totalPrice.toLocaleString('es-CO')}
                  </Text>
                </div>
              </Section>

              <Section className="mt-6">
                <Text className="m-0 mb-2 text-sm text-ink-600">
                  <strong>Número de pedido:</strong> {orderId}
                </Text>
                <Text className="m-0 mb-2 text-sm text-ink-600">
                  <strong>Método de Pago:</strong> {paymentMethod} (Pagas al recibir)
                </Text>
                <Text className="m-0 text-sm text-ink-600">
                  <strong>Ciudad de Destino:</strong> {city}
                </Text>
              </Section>
            </Section>

            <Section className="text-center mt-8">
              <Text className="text-xs text-ink-600">
                Este mensaje confirma la recepción del pedido. {siteName} podrá contactarte para
                coordinar la entrega.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmation;
