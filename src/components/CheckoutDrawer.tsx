import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Truck, Gift, CheckCircle2, Lock, ArrowRight, CreditCard, ShoppingBag, Star, BookOpen, Coffee } from 'lucide-react';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string;
}

const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1); // 1: Review, 2: Processing

  // Handle animation delay for unmount/mount
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; // Prevent scroll on body
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleAction = () => {
    setStep(2);
    // Simulation of transition to Shopify Checkout or Order placement
    setTimeout(() => {
        // In a real scenario, this would trigger Shopify Checkout Kit or redirect
        alert("¡Excelente decisión! Redirigiendo a Shopify para finalizar tu pedido...");
        setStep(1);
        onClose();
    }, 1500);
  };

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
            <ShoppingBag size={20} className="text-gold-500" />
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
                 <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 animate-pulse">
                    AHORRAS $700k
                </div>
                <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-coffee-100 rounded-xl overflow-hidden shrink-0 border border-coffee-200">
                        <img src="https://images.unsplash.com/photo-1599395932585-e7a83709b43d?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Kit Barista" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-coffee-900 text-lg leading-tight">Kit Barista Pro Edición Limitada</h3>
                        <div className="flex items-center gap-1 mt-1">
                             <Star size={12} className="text-gold-500 fill-gold-500" />
                             <span className="text-xs text-coffee-500 font-bold">4.9/5 (1.2k reseñas)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. The Value Stack (What they get) */}
            <div>
                <h4 className="font-bold text-coffee-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" /> Tu Pack Incluye:
                </h4>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-coffee-100 space-y-4">
                    
                    {/* Item 1 */}
                    <div className="flex justify-between items-center pb-3 border-b border-coffee-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-coffee-100 p-2 rounded-lg text-coffee-700"><Coffee size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">Máquina Espresso 20 Bares</p>
                                <p className="text-xs text-coffee-500">Garantía 1 Año</p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-coffee-900">$490k</span>
                    </div>

                    {/* Item 2 (GIFT) */}
                    <div className="flex justify-between items-center pb-3 border-b border-coffee-50 bg-gold-50/50 p-2 rounded-lg -mx-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-gold-100 p-2 rounded-lg text-gold-600"><Gift size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">Molino Automático</p>
                                <p className="text-xs text-gold-600 font-bold">¡Regalo Hoy!</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs text-red-400 line-through">$180k</span>
                            <span className="block text-sm font-bold text-green-600">GRATIS</span>
                        </div>
                    </div>

                    {/* Item 3 (GIFT) */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gold-100 p-2 rounded-lg text-gold-600"><BookOpen size={18} /></div>
                            <div>
                                <p className="font-bold text-coffee-900 text-sm">E-book &quot;Barista Master&quot;</p>
                                <p className="text-xs text-gold-600 font-bold">Curso Digital</p>
                            </div>
                        </div>
                         <div className="text-right">
                            <span className="block text-xs text-red-400 line-through">$120k</span>
                            <span className="block text-sm font-bold text-green-600">GRATIS</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. Shipping & Payment Info */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
                    <Truck size={20} className="text-green-600 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-green-800">Envío Gratis Asegurado</p>
                        <p className="text-xs text-green-600">Llega en 2-4 días hábiles</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-coffee-100 p-3 rounded-xl border border-coffee-200">
                    <ShieldCheck size={20} className="text-coffee-700 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-coffee-900">Compra 100% Segura</p>
                        <p className="text-xs text-coffee-600">Pagas al recibir en casa</p>
                    </div>
                </div>
            </div>
            
            {/* Payment Method Selected Visual */}
             <div className="border border-gold-500 bg-gold-50/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-4 border-gold-500 bg-white"></div>
                    <span className="font-bold text-coffee-900 text-sm">Pago Contraentrega</span>
                </div>
                <CreditCard size={18} className="text-gold-600" />
             </div>

        </div>

        {/* Footer / Sticky Action */}
        <div className="bg-white border-t border-coffee-100 p-5 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-8">
            <div className="flex justify-between items-end mb-4">
                <span className="text-coffee-500 text-sm font-medium">Total a Pagar:</span>
                <div className="text-right">
                    <span className="text-xs text-red-400 line-through mr-2 font-medium">$1.190.000</span>
                    <span className="text-3xl font-serif font-bold text-coffee-900">$490.000</span>
                </div>
            </div>
            
            <button 
                onClick={handleAction}
                disabled={step === 2}
                className="w-full bg-coffee-900 hover:bg-black text-white text-lg font-bold py-4 rounded-xl shadow-xl hover:shadow-gold-500/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
                {step === 1 ? (
                    <>
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></span>
                    <Truck size={24} className="text-gold-500" />
                    PEDIR CONTRAENTREGA
                    </>
                ) : (
                    <>
                     <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                     Procesando...
                    </>
                )}
            </button>
            <p className="text-center text-[11px] text-coffee-400 mt-3">
                Al confirmar, serás redirigido para finalizar tu orden segura.
            </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDrawer;