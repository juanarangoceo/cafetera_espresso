import React, { useState } from 'react';
import Image from 'next/image';
import { Hotspot } from './Hotspot';
import { ProductFeature } from '../types';

// Using the main LCP image for consistency, or we could use the "scuare" one if different
const PRODUCT_IMAGE_URL = "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/scuare.jpg?v=1757995325";

// Coffee Maker Pro Hotspot Data
const FEATURES: ProductFeature[] = [
  {
    id: 'steam',
    title: 'Vaporizador Profesional',
    description: 'Potencia de vapor seco para texturizar leche. Crea micro-espuma sedosa para latte art.',
    x: 85,
    y: 40, 
  },
  {
    id: 'portafilter',
    title: 'Portafiltro Comercial 58mm',
    description: 'Estabilidad térmica y peso profesional. Compatible con filtros de competencia.',
    x: 50,
    y: 60, 
  },
  {
    id: 'body',
    title: 'Cuerpo Acero Inox 304',
    description: 'Construcción robusta y duradera. Fácil de limpiar y resistente a la corrosión.',
    x: 30,
    y: 65, 
  },
  {
      id: 'tray',
      title: 'Bandeja Calienta Tazas',
      description: 'Mantén tus tazas a la temperatura ideal antes de servir el espresso.',
      x: 50,
      y: 5 
  }
];

export const HotspotSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleHotspot = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
  };

  const closeAll = () => setActiveId(null);

  const activeFeature = activeId ? FEATURES.find(f => f.id === activeId) : null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24 bg-white relative">
        {/* Background Texture similar to other sections */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      {/* Header Section */}
      <div className="text-center mb-12 relative z-10 reveal fade-bottom">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mb-4">
          Ingeniería al Detalle
        </h2>
        <p className="text-coffee-600 max-w-2xl mx-auto text-lg">
          Toca los puntos interactivos para descubrir por qué esta no es una máquina común.
        </p>
      </div>

      {/* Interactive Container */}
      <div 
        className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-coffee-100 group cursor-default border-4 border-white/50 reveal zoom-in"
      >
        <div className="relative w-full" onClick={closeAll}>
           <Image 
            src={PRODUCT_IMAGE_URL} 
            alt="Detalles de la Cafetera Espresso" 
            width={1080}
            height={1080}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority={false} // Lazy load this interaction section
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Hotspots Layer */}
          <div className="absolute inset-0 z-20">
            {FEATURES.map(feature => (
              <Hotspot
                key={feature.id}
                feature={feature}
                isOpen={activeId === feature.id}
                onToggle={toggleHotspot}
                // No onClose needed here anymore, modal is separate
                onClose={closeAll} 
              />
            ))}
          </div>

          {/* --- CENTRALIZED POPUP MODAL --- */}
          {activeFeature && (
            <div 
                className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] transition-all duration-300"
                onClick={(e) => { e.stopPropagation(); closeAll(); }}
            >
                <div 
                    className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full mx-auto relative transform transition-all animate-in fade-in zoom-in-95 border-2 border-white"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button 
                        onClick={closeAll}
                        className="absolute top-3 right-3 text-coffee-400 hover:text-coffee-900 transition-colors bg-coffee-50 rounded-full p-1"
                    >
                        {/* Simple X Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <h3 className="font-serif text-2xl font-bold text-coffee-900 mb-3 pr-6">
                        {activeFeature.title}
                    </h3>
                    <p className="text-coffee-600 text-base leading-relaxed">
                        {activeFeature.description}
                    </p>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Hint */}
      <div className="mt-6 text-center md:hidden animate-pulse">
        <span className="text-sm text-coffee-500 font-medium flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-gold-500 rounded-full"/> Toca los puntos para explorar
        </span>
      </div>
    </section>
  );
};
