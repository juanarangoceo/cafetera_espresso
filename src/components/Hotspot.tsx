import React, { useRef, useEffect, useState } from 'react';
import { Plus, X, ChevronRight } from 'lucide-react';
import { ProductFeature, HotspotProps } from '../types';

export const Hotspot: React.FC<HotspotProps> = ({ feature, isOpen, onToggle, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [positionClass, setPositionClass] = useState('left-full ml-4');

  // Adjust tooltip position to prevent screen overflow
  // Adjust tooltip position to stay inside the container
  useEffect(() => {
    if (isOpen) {
      // Simple heuristic: If the point is on the right half (>50%), open to the left.
      // If it's on the left half (<=50%), open to the right.
      if (feature.x > 50) {
        setPositionClass('right-full mr-4');
      } else {
         setPositionClass('left-full ml-4');
      }
    }
  }, [isOpen, feature.x]);

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

      {/* Popup / Tooltip */}
      {isOpen && (
        <div
          ref={popupRef}
          className={`absolute top-1/2 -translate-y-1/2 w-64 md:w-72 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-5 border border-white/20 transform transition-all duration-300 origin-center z-50 animate-in fade-in zoom-in-95 ${positionClass}`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside card
        >
          {/* Mobile Close Button (visible only on small screens mostly, but good for UX) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 md:hidden"
          >
            <X size={16} />
          </button>

          <h3 className="font-serif text-lg font-bold text-coffee-900 mb-1 leading-tight">
            {feature.title}
          </h3>
          
          <p className="text-sm text-coffee-600 mb-3 leading-relaxed">
            {feature.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
            {feature.price && (
              <span className="font-medium text-coffee-900">{feature.price}</span>
            )}
            {/* Removed "More Info" button for cleaner UI on this context, or we can keep it if needed */}
          </div>
          
          {/* Decorative triangle pointer */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent ${
              positionClass.includes('left-full') 
                ? 'border-r-white/95 -left-4' 
                : 'border-l-white/95 -right-4'
            }`}
          />
        </div>
      )}
    </div>
  );
};
