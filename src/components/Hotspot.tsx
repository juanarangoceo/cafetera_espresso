import React from 'react';
import { Plus } from 'lucide-react';
import { HotspotProps } from '../types';

export const Hotspot: React.FC<HotspotProps> = ({ feature, isOpen, onToggle }) => {
  return (
    <div
      className="absolute z-10"
      style={{ top: `${feature.y}%`, left: `${feature.x}%` }}
    >
      {/* Pulse Animation Ring */}
      <div className={`absolute -inset-4 rounded-full bg-white/30 hotspot-ring ${isOpen ? 'hidden' : 'block'}`} />
      
      {/* The Dot Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(feature.id);
        }}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 ${
          isOpen ? 'bg-coffee-900 text-gold-500 rotate-45' : 'bg-white text-coffee-900'
        }`}
        aria-label={`Ver detalles de ${feature.title}`}
      >
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
};
