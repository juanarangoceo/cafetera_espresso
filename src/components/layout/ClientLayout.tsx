"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { LandingProvider } from '@/context/LandingContext';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalModals from './GlobalModals';
import ChatBotWrapper from '../ChatBotWrapper';
import VoiceSalesAssistant from '../VoiceSalesAssistant';
import WhatsAppButton from '../WhatsAppButton';
import { DEFAULT_WHATSAPP_MESSAGE, type SiteChannels } from '@/lib/site-config';

export default function ClientLayout({
  children,
  channels,
}: {
  children: React.ReactNode;
  channels: SiteChannels;
}) {
  const pathname = usePathname();

  // La interfaz comercial solo pertenece a la landing. La comprobación es
  // deliberadamente cerrada: una ruta interna nueva, o un pathname todavía no
  // resuelto durante la hidratación, nunca debe heredar la invitación de voz,
  // WhatsApp, navegación, footer ni modales de venta.
  if (pathname !== '/') {
    return <>{children}</>;
  }

  const showWhatsApp = channels.whatsappEnabled && Boolean(channels.whatsappPhone);

  return (
    <LandingProvider>
      <Navbar />
      {children}
      <Footer />
      <GlobalModals />
      {channels.chatEnabled && <ChatBotWrapper />}
      {channels.voiceEnabled && <VoiceSalesAssistant />}
      {showWhatsApp && (
        <WhatsAppButton
          phone={channels.whatsappPhone!}
          message={channels.whatsappMessage?.trim() || DEFAULT_WHATSAPP_MESSAGE}
          stacked={channels.chatEnabled}
        />
      )}
    </LandingProvider>
  );
}
