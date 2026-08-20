import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Coffee, Gift, BookOpen } from 'lucide-react';
import CODForm from './CODForm';
import Image from 'next/image';
import { PRODUCT } from '@/lib/product';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string; // Optional if we generate it internally
}

const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation delay for unmount/mount
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; 
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end isolate">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-coffee-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div 
        className={`relative w-full max-w-md h-full bg-coffee-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-white border-b border-coffee-100 p-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-2 text-coffee-900">
            <Coffee className="h-6 w-6 text-gold-600" />
            <span className="font-bold text-sm tracking-wide uppercase">Resumen del Pedido</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-coffee-100 rounded-full transition-colors text-coffee-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* 1. Hero Product Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-coffee-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-coffee-900 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                    MOLINO INCLUIDO
                </div>
                <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-coffee-100 rounded-xl overflow-hidden shrink-0 border border-coffee-200">
                        <Image src="/images/hero-mobile.webp" width={96} height={96} className="h-full w-full object-contain mix-blend-multiply" alt="Coffee Maker Pro" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-coffee-900 text-lg leading-tight">Kit Coffee Maker Pro</h3>
                        <p className="mt-1 text-xs font-medium text-coffee-500">Máquina, molino y guía de preparación</p>
                    </div>
                </div>
            </div>

            {/* 2. The Value Stack (What they get) */}
            <div>
                <h4 className="font-bold text-coffee-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" /> Tu kit incluye:
                </h4>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-coffee-100 space-y-4">
                    
                    {/* Item 1 */}
                    <div className="flex justify-between items-center pb-3 border-b border-coffee-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-coffee-100 p-2 rounded-lg text-coffee-700"><Coffee size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">Cafetera Coffee Maker Pro</p>
                                <p className="text-xs text-coffee-500">{PRODUCT.warranty}</p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-coffee-900">{PRODUCT.priceLabel}</span>
                    </div>

                    {/* Item 2 (GIFT) */}
                    <div className="flex justify-between items-center pb-3 border-b border-coffee-50 bg-green-50/50 p-2 rounded-lg -mx-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600"><Gift size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">Molino eléctrico incluido</p>
                                <p className="text-xs text-green-600 font-bold">Parte del kit completo</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-bold text-green-600">INCLUIDO</span>
                        </div>
                    </div>

                    {/* Item 3 (GIFT) */}
                    <div className="flex justify-between items-center p-2 -mx-2 bg-green-50/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600"><BookOpen size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">Guía de preparación</p>
                                <p className="text-xs text-green-600 font-bold">Formato digital</p>
                            </div>
                        </div>
                         <div className="text-right">
                            <span className="block text-sm font-bold text-green-600">INCLUIDA</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. COD Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 overflow-hidden">
                <div className="bg-coffee-50 p-4 border-b border-coffee-100 flex justify-between items-center">
                    <span className="text-coffee-500 text-sm font-medium">Total a Pagar:</span>
                    <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-coffee-900">{PRODUCT.priceLabel}</span>
                    </div>
                </div>
                <CODForm />
            </div>

            <p className="text-center text-xs leading-5 text-coffee-500">
              ¿Necesitas ayuda antes de pedir? Escríbenos a{' '}
              <a href={`mailto:${PRODUCT.supportEmail}`} className="font-bold text-coffee-800 underline underline-offset-2">{PRODUCT.supportEmail}</a>
            </p>
            
        </div>
      </div>
    </div>
  );
};


export default CheckoutDrawer;
