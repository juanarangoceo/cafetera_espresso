"use client";

import React from 'react';
import { LandingProvider } from '@/context/LandingContext';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalModals from './GlobalModals';
import ChatBotWrapper from '../ChatBotWrapper';
import VoiceSalesAssistant from '../VoiceSalesAssistant';
import WhatsAppButton from '../WhatsAppButton';
import { DEFAULT_WHATSAPP_MESSAGE, type SiteConfig } from '@/lib/site-config';

export default function ClientLayout({
  children,
  site,
}: {
  children: React.ReactNode;
  site: SiteConfig;
}) {
  const { channels } = site;
  const showWhatsApp =
    site.isActive && channels.whatsappEnabled && Boolean(channels.whatsappPhone);

  return (
    <LandingProvider>
      <Navbar />
      {!site.isActive && (
        <div className="bg-coffee-950 px-4 py-3 text-center text-sm font-bold text-white">
          Estamos actualizando la tienda y no podemos recibir pedidos en este momento.
        </div>
      )}
      {children}
      <Footer />
      <GlobalModals />
      {/* Con el sitio desconectado desde el panel se apagan también los
          asistentes: los tres canales crean pedidos, y la plataforma los
          rechazaría de todos modos. Mejor no ofrecer lo que no se puede
          cumplir. */}
      {site.isActive && channels.chatEnabled && <ChatBotWrapper />}
      {site.isActive && channels.voiceEnabled && <VoiceSalesAssistant />}
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
