"use client";

import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { useCheckout } from '../context/CheckoutContext';

export default function StickyMobileCTA() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { openCheckout } = useCheckout();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isScrolled) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-coffee-100 p-4 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.08)] flex items-center gap-4 animate-slide-up safe-area-pb">
            <div className="flex-1">
                <p className="text-xs text-gold-600 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Gift size={12} /> Oferta Limitada Activada
                </p>
                <div className="flex flex-col">
                    <p className="text-sm font-bold text-coffee-900 leading-tight">Molino + Curso Barista</p>
                    <span className="text-xs text-green-600 font-bold">INCLUIDOS GRATIS</span>
                </div>
            </div>
            <button
                onClick={openCheckout}
                className="bg-gold-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 active:scale-95 transition-transform text-sm whitespace-nowrap"
            >
                Reclamar Oferta
            </button>
        </div>
    );
}
