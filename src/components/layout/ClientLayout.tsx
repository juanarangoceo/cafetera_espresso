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

  // El panel no es la landing: no lleva navegación comercial, ni pie de página,
  // ni asistentes de venta. Se decide por ruta en vez de mover las rutas
  // existentes a un grupo, porque el worktree ya arrastra muchos cambios sin
  // confirmar y renombrar rutas de un sitio en producción no vale el riesgo.
  if (
    pathname?.startsWith('/admin')
    || pathname?.startsWith('/platform')
    || pathname?.startsWith('/intake')
  ) {
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
