import React from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

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
      <div className="relative h-[85vh] max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="90vw"
          className="rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImageModal;
