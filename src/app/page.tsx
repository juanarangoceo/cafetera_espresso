
import React from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Truck, Banknote, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

// Components
import HeroActions from '@/components/sections/HeroActions';
import HomeContent from '@/components/HomeContent';

import { SectionId } from '@/types';

export default function Home() {
    return (
        <div className="min-h-screen bg-coffee-50 text-coffee-900 font-sans antialiased overflow-x-hidden selection:bg-gold-200 selection:text-coffee-900 pb-24 md:pb-0">

            {/* --- HERO SECTION (Server Component) --- */}
                <section id={SectionId.HERO} className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-noise">
                    {/* Decorative Backgrounds */}
                    <div className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-gradient-to-br from-gold-100/40 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/3 translate-x-1/3 z-0"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] lg:w-[700px] h-[400px] lg:h-[700px] bg-coffee-100/30 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4 z-0"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                        <div className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1">
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-coffee-900 leading-[1.1] tracking-tight drop-shadow-sm">
                                Tu Propia Barra de Café<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400 relative italic pr-2">
                                    Barista en Casa u Oficina
                                    <svg className="absolute w-full h-2 lg:h-3 -bottom-1 left-0 text-gold-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
                                    </svg>
                                </span>
                            </h1>
                            <p className="text-lg lg:text-xl text-coffee-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                                Olvídate del café quemado. Disfruta de espressos, cappuccinos y lattes con calidad de cafetería italiana, sin salir de tu espacio.
                            </p>

                            {/* Client Actions (Scroll Button) */}
                            <HeroActions />
                            
                            <div className="flex items-center justify-center lg:justify-start gap-4 mt-4">
                                 <div className="flex items-center gap-1.5 text-sm font-medium text-coffee-700">
                                     <Truck size={16} className="text-green-600" /> Envío Gratis
                                 </div>
                                 <span className="text-coffee-300">•</span>
                                 <div className="flex items-center gap-1.5 text-sm font-medium text-coffee-700">
                                     <Banknote size={16} className="text-green-600" /> Paga al Recibir
                                 </div>
                            </div>

                            <div className="pt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-4 text-base text-coffee-500 font-medium border-t border-coffee-200 mt-8">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-gold-500" />
                                    Garantía 1 Año
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-gold-500" />
                                    Envío Gratis
                                </div>
                                <div className="flex items-center gap-2 text-gold-700 font-bold bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
                                    <AlertTriangle size={16} />
                                    Alta Demanda: Últimas unidades
                                </div>
                            </div>
                        </div>

                        {/* Main Image - Server Rendered for LCP */}
                        <div className="relative order-1 lg:order-2 aspect-[4/5] md:aspect-square w-full">
                            <div className="relative z-10 perspective-1000 w-full h-full">
                                
                                {/* Glow Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-white/80 to-transparent blur-3xl -z-10"></div>

                                {/* --- VERSIÓN MÓVIL (Vertical 4:5) --- */}
                                <div className="block md:hidden relative w-full h-full">
                                    <Image
                                        src="/images/hero-mobile.webp"
                                        alt="Cafetera Coffee Maker Pro - Vista Móvil"
                                        fill
                                        priority={true}
                                        fetchPriority="high"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="rounded-[2rem] shadow-2xl border-[4px] border-white bg-coffee-200 object-cover"
                                    />
                                </div>

                                {/* --- VERSIÓN ESCRITORIO (Cuadrada) --- */}
                                <div className="hidden md:block relative w-full h-full">
                                    <Image
                                        src="/images/hero-desktop.webp"
                                        alt="Cafetera Coffee Maker Pro - Vista Escritorio"
                                        fill
                                        priority={true}
                                        fetchPriority="high"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="rounded-[2rem] shadow-2xl border-[4px] border-white bg-coffee-200 object-contain"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CLIENT CONTENT --- */}
                <HomeContent />
            </div>
    );
}
