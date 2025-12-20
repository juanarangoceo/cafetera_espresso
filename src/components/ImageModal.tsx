import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-gold-500 transition-colors p-2 z-50"
      >
        <X size={32} />
      </button>
      <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    </div>
  );
};

export default ImageModal;
