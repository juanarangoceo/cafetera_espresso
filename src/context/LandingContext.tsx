"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, Policy } from '../types';

interface LandingContextType {
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  
  selectedRecipe: Recipe | null;
  openRecipe: (recipe: Recipe) => void;
  closeRecipe: () => void;

  selectedPolicy: Policy | null;
  openPolicy: (policy: Policy) => void;
  closePolicy: () => void;

  selectedImage: { src: string; alt: string } | null;
  openImage: (src: string, alt: string) => void;
  closeImage: () => void;
}

const LandingContext = createContext<LandingContextType | undefined>(undefined);

export function LandingProvider({ children }: { children: ReactNode }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  const openRecipe = (recipe: Recipe) => setSelectedRecipe(recipe);
  const closeRecipe = () => setSelectedRecipe(null);

  const openPolicy = (policy: Policy) => setSelectedPolicy(policy);
  const closePolicy = () => setSelectedPolicy(null);

  const openImage = (src: string, alt: string) => setSelectedImage({ src, alt });
  const closeImage = () => setSelectedImage(null);

  return (
    <LandingContext.Provider
      value={{
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        selectedRecipe,
        openRecipe,
        closeRecipe,
        selectedPolicy,
        openPolicy,
        closePolicy,
        selectedImage,
        openImage,
        closeImage,
      }}
    >
      {children}
    </LandingContext.Provider>
  );
}

export function useLanding() {
  const context = useContext(LandingContext);
  if (context === undefined) {
    throw new Error('useLanding must be used within a LandingProvider');
  }
  return context;
}
