"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionId } from '@/types';

export default function HeroActions() {
  const scrollToPricing = () => {
    const element = document.getElementById(SectionId.PRICING);
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
        <button
            onClick={scrollToPricing}
            className="group bg-coffee-900 hover:bg-coffee-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 border border-coffee-700 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative">Comenzar mi Experiencia Barista</span>
            <span className="relative bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors"><ArrowRight size={18} /></span>
        </button>
    </div>
  );
}
