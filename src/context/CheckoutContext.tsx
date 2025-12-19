"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context shape
interface CheckoutContextType {
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

// Create the context
const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Provider Component
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  return (
    <CheckoutContext.Provider value={{ isCheckoutOpen, openCheckout, closeCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
}

// Custom Hook for consumption
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
