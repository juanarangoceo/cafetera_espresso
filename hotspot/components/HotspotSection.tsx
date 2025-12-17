import React, { useState } from 'react';
import { Hotspot } from './Hotspot';
import { ProductFeature } from '../types';

// Provided image URL
const PRODUCT_IMAGE_URL = "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/scuare.jpg?v=1757995325";

// Mock Data - In a real Next.js app, this could come from a CMS or props
const FEATURES: ProductFeature[] = [
  {
    id: 'fabric',
    title: 'Premium Organic Cotton',
    description: 'Sourced from sustainable farms, this ultra-soft weave provides breathability and lasting comfort for all-day wear.',
    x: 28,
    y: 35,
    price: '$89.00 USD'
  },
  {
    id: 'pattern',
    title: 'Artisan Screen Print',
    description: 'Each piece features a unique, hand-applied pattern that ensures no two items are exactly alike.',
    x: 55,
    y: 48,
  },
  {
    id: 'stitching',
    title: 'Reinforced Double Stitching',
    description: 'Designed for durability, the high-stress areas are fortified to maintain shape and integrity over years of use.',
    x: 72,
    y: 75,
  },
  {
    id: 'label',
    title: 'Signature Branding',
    description: 'Subtle, minimalist branding tag made from recycled polyester.',
    x: 42,
    y: 65,
  }
];

export const HotspotSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleHotspot = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
  };

  const closeAll = () => setActiveId(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 lg:py-20">
      
      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="serif text-3xl md:text-5xl font-medium text-gray-900 mb-4">
          Discover the Details
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light">
          Click on the interactive points to explore the craftsmanship and materials that make this piece unique.
        </p>
      </div>

      {/* Interactive Container */}
      <div 
        className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gray-100 group cursor-default"
        onClick={closeAll} // Clicking background closes popups
      >
        {/* Removing forced aspect ratios to let the image dictate height */}
        <div className="relative w-full">
           <img 
            src={PRODUCT_IMAGE_URL} 
            alt="Interactive Product Detail" 
            className="w-full h-auto block"
          />
          
          {/* Overlay gradient for better text contrast if needed, currently transparent */}
          <div className="absolute inset-0 bg-black/5 transition-opacity duration-500 group-hover:bg-black/0 pointer-events-none" />

          {/* Hotspots Layer */}
          <div className="absolute inset-0">
            {FEATURES.map(feature => (
              <Hotspot
                key={feature.id}
                feature={feature}
                isOpen={activeId === feature.id}
                onToggle={toggleHotspot}
                onClose={closeAll}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="mt-6 text-center md:hidden animate-pulse">
        <span className="text-sm text-gray-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"/> Tap the points to explore
        </span>
      </div>
    </div>
  );
};
