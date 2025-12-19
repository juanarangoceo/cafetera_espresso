"use client";

import React from 'react';
import { CheckoutProvider } from '../context/CheckoutContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      {children}
    </CheckoutProvider>
  );
}
