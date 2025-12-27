"use client";

import React from 'react';
import { LandingProvider } from '@/context/LandingContext';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalModals from './GlobalModals';
import ChatBotWrapper from '../ChatBotWrapper';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingProvider>
      <Navbar />
      {children}
      <Footer />
      <GlobalModals />
      <ChatBotWrapper />
    </LandingProvider>
  );
}
