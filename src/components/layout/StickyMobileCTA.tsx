"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanding } from '@/context/LandingContext';

export default function StickyMobileCTA() {
    const { openCheckout } = useLanding();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div 
            className={`
                fixed bottom-4 left-4 right-4 z-50 md:hidden
                flex items-center justify-between
                bg-coffee-950/90 backdrop-blur-md border border-gold-500/20 rounded-2xl shadow-2xl p-3
                transition-all duration-500 transform
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
            `}
        >
            {/* Left: Text */}
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">Estación Barista Pro</span>
                <span className="text-[10px] text-gold-400 flex items-center gap-1">
                    <Sparkles size={10} /> Oferta + Regalos Incluidos
                </span>
            </div>

            {/* Right: Button */}
            <button 
                onClick={openCheckout}
                className="bg-white text-coffee-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-1"
            >
                OBTENER OFERTA <ArrowRight size={12} />
            </button>
        </div>
    );
}
