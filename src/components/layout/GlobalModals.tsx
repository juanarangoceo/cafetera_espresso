"use client";

import React from 'react';
import { useLanding } from '@/context/LandingContext';
import CheckoutDrawer from '@/components/CheckoutDrawer';
import RecipeModal from '@/components/RecipeModal';
import PolicyModal from '@/components/PolicyModal';
import ImageModal from '@/components/ImageModal';

export default function GlobalModals() {
  const {
    isCheckoutOpen,
    closeCheckout,
    selectedRecipe,
    closeRecipe,
    selectedPolicy,
    closePolicy,
    selectedImage,
    closeImage,
  } = useLanding();

  return (
    <>
      <CheckoutDrawer isOpen={isCheckoutOpen} onClose={closeCheckout} />
      
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={closeRecipe} />
      )}
      
      {selectedPolicy && (
        <PolicyModal policy={selectedPolicy} onClose={closePolicy} />
      )}
      
      {selectedImage && (
        <ImageModal 
          src={selectedImage.src} 
          alt={selectedImage.alt} 
          isOpen={true} 
          onClose={closeImage} 
        />
      )}
    </>
  );
}
