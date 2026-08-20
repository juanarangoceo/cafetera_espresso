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
    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-8">
        <button
            onClick={scrollToPricing}
            className="group relative flex items-center justify-center gap-3 rounded-full bg-coffee-950 px-8 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-coffee-800 sm:text-lg"
        >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative">Quiero mi Coffee Maker Pro</span>
            <span className="relative bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors"><ArrowRight size={18} /></span>
        </button>
    </div>
  );
}
