"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, Truck, ShieldCheck, Coffee, Gift, ArrowRight, Home, Banknote, Clock, MapPin, Instagram, Facebook } from 'lucide-react';
import { useLanding } from '@/context/LandingContext';
import { SectionId } from '@/types';
import { RECIPES, TESTIMONIALS, GALLERY_ITEMS, OLD_PRICE, PRICE } from '@/lib/data';
import Countdown from './Countdown';
import FAQ from './FAQ';
import VideoPlayer from './VideoPlayer';
import { HotspotSection } from './HotspotSection';
import { TimerReset, Gauge, ChevronRight } from 'lucide-react';
import StickyMobileCTA from './layout/StickyMobileCTA';
import LeadMagnet from './sections/LeadMagnet';

// Helper for dynamic icon rendering in Gallery
const GalleryIcon = ({ type }: { type: string }) => {
    // Simple mapping for icons used in data.ts
    // In a real app, pass the component itself or use a proper map
    return <CheckCircle2 size={24} className="text-gold-500" />;
};

export default function HomeContent() {
    const { openCheckout, openRecipe, openImage, openPolicy } = useLanding();

    useEffect(() => {
        const observerReveal = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(el => observerReveal.observe(el));

        return () => {
            reveals.forEach(el => observerReveal.unobserve(el));
        };
    }, []);

    const handleCheckoutClick = () => {
        openCheckout();
    };

    return (
        <>
            {/* --- SECTION 2: THE PROBLEM / SOLUTION --- */}
            <section id={SectionId.FEATURES} className="relative bg-white border-t border-coffee-100 py-20 md:py-32 overflow-hidden min-h-[600px]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24 flex flex-col justify-center">
                        <div className="inline-block min-h-[36px]"><span className="text-gold-600 font-bold tracking-[0.2em] text-sm md:text-base uppercase bg-coffee-50 border border-gold-200 px-6 py-2.5 rounded-full shadow-sm leading-none">La Realidad</span></div>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-coffee-900 mt-8 leading-[1.1] min-h-[1.1em]">
                            ¿Por qué tu café en casa no sabe<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coffee-600 to-coffee-400">como el de tu cafetería favorita?</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
                        <div className="flex flex-col items-center justify-center">
                            <VideoPlayer src="https://res.cloudinary.com/dohwyszdj/video/upload/v1766264202/video_reel_hcfoyo.mp4" />
                            <p className="text-center text-base text-coffee-400 mt-8 italic max-w-sm mx-auto">Mira la extracción real a 20 Bares de la Coffee Maker Pro</p>
                        </div>

                        <div className="space-y-8 md:space-y-10">
                            <div className="bg-coffee-50 rounded-[2rem] p-6 md:p-10 border border-coffee-100 hover:border-gold-300 transition-colors shadow-sm group">
                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-md text-gold-500 group-hover:scale-110 transition-transform shrink-0 mb-2 sm:mb-0">
                                        <TimerReset size={32} className="md:w-10 md:h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-coffee-900 mb-4">1. El Problema del Café Oxidado</h3>
                                        <p className="text-coffee-700 leading-relaxed text-lg md:text-xl">
                                            <span className="font-bold text-red-500">Lo que haces mal:</span> Usas café pre-molido de supermercado. <br />
                                            <span className="font-bold text-gray-400 block my-1">vs</span>
                                            <span className="font-bold text-green-600">La Solución:</span> Te regalamos el <strong className="text-coffee-900 text-xl md:text-2xl decoration-gold-400 underline decoration-2 underline-offset-4">Molino Automático</strong>. Rompes el grano 10 segundos antes de beberlo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-coffee-50 rounded-[2rem] p-6 md:p-10 border border-coffee-100 hover:border-gold-300 transition-colors shadow-sm group">
                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-md text-gold-500 group-hover:scale-110 transition-transform shrink-0 mb-2 sm:mb-0">
                                        <Gauge size={32} className="md:w-10 md:h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-coffee-900 mb-4">2. Presión Insuficiente</h3>
                                        <p className="text-coffee-700 leading-relaxed text-lg md:text-xl">
                                            <span className="font-bold text-red-500">Tu máquina actual:</span> Tiene 3-9 bares (muy poco) o 15 bares falsos.<br />
                                            <span className="font-bold text-gray-400 block my-1">vs</span>
                                            <span className="font-bold text-green-600">La Pro:</span> <strong className="text-coffee-900 text-xl md:text-2xl decoration-gold-400 underline decoration-2 underline-offset-4">20 Bares Reales</strong> de bomba italiana. La única forma de obtener la "Crema Avellana".
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             <HotspotSection />

            <section className="py-16 md:py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-gold-600 font-bold tracking-widest text-sm uppercase">Detalles que Enamoran</span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-coffee-900 mt-4">Ingeniería Italiana, Diseño Moderno</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {GALLERY_ITEMS.map((item, index) => (
                            <div key={item.id} className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-coffee-900 aspect-square reveal fade-up delay-${index * 100} cursor-pointer`}
                                onClick={() => openImage(item.image, item.title)}
                            >
                                <Image 
                                    src={item.image} 
                                    alt={item.title} 
                                    fill 
                                    className="object-cover opacity-80 group-hover:opacity-60 group-hover:scale-110 transition-transform duration-700"
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end pb-8">
                                    <h3 className="text-xl font-bold text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{item.title}</h3>
                                    <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             <section id="recipes" className="py-16 md:py-24 bg-coffee-50 border-t border-coffee-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                     <Coffee size={400} />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12 md:mb-16">
                         <span className="text-gold-600 font-bold tracking-widest text-sm uppercase">Tu Menú Diario</span>
                         <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mt-4 leading-tight">
                            Resultados de cafetería de especialidad, sin el costo de equipos industriales. <br/>
                            <span className="text-coffee-600">Calidad accesible y garantizada.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {RECIPES.map((recipe, index) => (
                             <div 
                                key={recipe.id}
                                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group border border-coffee-100 reveal fade-up delay-${index * 100}`}
                                onClick={() => openRecipe(recipe)}
                             >
                                <div className="relative h-56 overflow-hidden">
                                     <Image 
                                        src={recipe.image}
                                        alt={recipe.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        sizes="(max-width: 768px) 100vw, 25vw"
                                     />
                                </div>
                                <div className="p-6">
                                     <h3 className="text-xl font-bold text-coffee-900 mb-1">{recipe.title}</h3>
                                     <p className="text-coffee-500 text-sm mb-4">{recipe.subtitle}</p>
                                     <div className="flex items-center text-gold-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                                         Ver Receta <ChevronRight size={16} />
                                     </div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
             </section>



            {/* --- SECTION 5: GIFT KIT (RESTORED & IMPROVED) --- */}
            <section id={SectionId.BONUS} className="py-24 md:py-32 bg-coffee-900 text-white relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold-500/10 to-transparent blur-3xl opacity-50"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 md:mb-24">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <span className="w-12 h-[1px] bg-gold-500/50"></span>
                            <span className="text-gold-400 font-bold tracking-[0.3em] text-xs md:text-sm uppercase shadow-gold-glow">Solo Por Hoy</span>
                            <span className="w-12 h-[1px] bg-gold-500/50"></span>
                        </div>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-none tracking-tight">
                            Tu Cafetería en Casa <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-200 animate-shimmer">Completa & Gratis</span>
                        </h2>
                        <p className="text-coffee-200 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                            Equipamiento profesional valorado en <span className="text-gold-400 font-bold">$430.000</span> incluido sin costo adicional con tu orden.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 items-stretch">
                        {/* GIFT 1: MOLINO */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent rounded-[3rem] transform rotate-2 group-hover:rotate-3 transition-transform duration-500"></div>
                            <div className="relative h-full bg-coffee-950/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 overflow-hidden hover:border-gold-500/30 transition-all duration-500 flex flex-col shadow-2xl">
                                
                                <div className="absolute top-0 right-0 z-20">
                                    <span className="bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold px-8 py-3 rounded-bl-3xl shadow-lg block text-sm tracking-widest">GRATIS</span>
                                </div>

                                <div className="h-64 md:h-80 relative mb-8 transform group-hover:scale-105 transition-transform duration-700">
                                   <Image 
                                        src="https://cdn.shopify.com/s/files/1/0608/6433/1831/files/molino_cafe_electrico_raf.webp?v=1758255802"
                                        alt="Molino de Café Eléctrico"
                                        fill
                                        className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                   />
                                </div>
                                
                                <span className="text-gold-500 font-medium tracking-widest text-xs uppercase mb-2 block">Regalo Exclusivo #1</span>
                                <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 leading-tight">Molino de Muelas <br/><span className="text-gray-400 text-2xl">Edición Titanio</span></h3>
                                
                                <p className="text-gray-400 text-base leading-relaxed mb-8 border-l-2 border-gold-500/30 pl-4">
                                    "La consistencia es clave". Olvídate de las cuchillas. Muelas cónicas de acero para una extracción uniforme.
                                </p>
                                
                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-3 text-gray-200">
                                        <div className="bg-gold-500/10 p-2 rounded-full text-gold-500"><CheckCircle2 size={18} /></div>
                                        <span className="font-medium">25 Ajustes de Molienda</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-200">
                                        <div className="bg-gold-500/10 p-2 rounded-full text-gold-500"><CheckCircle2 size={18} /></div>
                                        <span className="font-medium">Valorado en $180.000</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GIFT 2: LEAD MAGNET */}
                        <LeadMagnet />
                    </div>
                </div>
            </section>

             <section id="roi" className="py-20 md:py-32 bg-coffee-50 border-t border-coffee-200 relative overflow-hidden">
                 <div className="max-w-6xl mx-auto px-6">
                     <div className="text-center mb-16">
                         <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mb-6">Matemáticas Simples</h2>
                         <p className="text-xl text-coffee-600 max-w-2xl mx-auto">Tu hábito actual de café está financiando la cafetería. <br/>Es hora de financiar tus propios sueños.</p>
                     </div>

                     <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-coffee-100 flex flex-col md:flex-row">
                         {/* LEFT: THE RECEIPT (FACTURA) */}
                         <div className="w-full md:w-1/2 bg-[#f8f5f2] p-8 md:p-12 relative border-r-2 border-dashed border-gray-300">
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/5 to-transparent"></div>
                            
                            <div className="bg-white p-6 shadow-sm border border-gray-200 rotate-1 max-w-sm mx-auto relative font-mono text-sm md:text-base text-gray-800">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4 opacity-50"></div>
                                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                                    <h4 className="font-bold text-lg uppercase tracking-widest">Cafetería X</h4>
                                    <p className="text-xs text-gray-500">Cajero: 04 - Fecha: Todos los días</p>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span>1x Cappuccino Grande</span>
                                        <span>$12.000</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 text-xs">
                                        <span> Leche de Almendras (Ad)</span>
                                        <span>$2.000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>1x Muffin Arándanos</span>
                                        <span>$8.000</span>
                                    </div>
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-4">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>TOTAL DIARIO</span>
                                        <span>$22.000</span>
                                    </div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                                    <p className="text-xs text-red-500 uppercase tracking-widest font-bold mb-1">Gasto Anual (365 días)</p>
                                    <p className="text-3xl font-bold text-red-600 font-sans">$8.030.000</p>
                                </div>
                                <div className="mt-6 text-center">
                                    <p className="font-serif italic text-gray-400 text-xs">"¡Gracias por su visita!"</p>
                                </div>
                                {/* Jagged bottom edge simulation */}
                                <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#f8f5f2]" style={{clipPath: 'polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0)'}}></div>
                            </div>
                         </div>

                         {/* RIGHT: THE SAVINGS */}
                         <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-coffee-900 text-white relative overflow-hidden">
                             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                             
                             <div className="relative z-10">
                                 <h3 className="text-3xl font-serif font-bold mb-6 text-gold-400">La Experiencia en Casa</h3>
                                 <ul className="space-y-6 mb-8">
                                     <li className="flex items-center justify-between border-b border-white/10 pb-2">
                                         <span className="text-gray-300 text-lg">Costo por Taza (Café de Especialidad)</span>
                                         <span className="font-bold text-2xl font-mono text-white">$500</span>
                                     </li>
                                     <li className="flex items-center justify-between border-b border-white/10 pb-2">
                                         <span className="text-gray-300 text-lg">Tiempo de preparación</span>
                                         <span className="font-bold text-2xl font-mono text-white">2 min</span>
                                     </li>
                                     <li className="flex items-center justify-between border-b border-white/10 pb-2">
                                         <span className="text-gray-300 text-lg">Gusto</span>
                                         <span className="font-bold text-2xl font-serif text-gold-400">Infinito</span>
                                     </li>
                                 </ul>
                                 
                                 <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20 backdrop-blur-md">
                                     <p className="text-sm uppercase tracking-widest text-gray-300 mb-2">Tu Ahorro el Primer Año</p>
                                     <p className="text-5xl md:text-6xl font-bold text-green-400 font-mono tracking-tighter">
                                         $7.5M+
                                     </p>
                                     <p className="text-xs text-gray-400 mt-2">Suficiente para unas vacaciones en Europa.</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </section>

            <section id={SectionId.PRICING} className="py-16 md:py-24 bg-gradient-to-b from-coffee-50 to-white relative scroll-mt-20 overflow-hidden">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                    
                    <div className="order-2 lg:order-1 space-y-8 text-center lg:text-left">
                        <div>
                            <span className="text-red-500 font-bold tracking-widest uppercase text-sm animate-pulse mb-2 block">🔥 Oferta por Tiempo Limitado</span>
                            <h2 className="text-4xl md:text-6xl font-serif font-bold text-coffee-900 leading-tight">
                                Todo lo que necesitas para ser <span className="text-gold-600">Barista PRO</span>
                            </h2>
                        </div>
                        <p className="text-lg text-coffee-600 leading-relaxed">
                            No solo compras una máquina. Obtienes el ecosistema completo para dominar el arte del café desde el día 1.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-coffee-100 mx-auto lg:mx-0 max-w-md">
                                <div className="bg-green-100 p-2 rounded-full text-green-700"><CheckCircle2 size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-coffee-900">Molino Eléctrico (Regalo #1)</h4>
                                    <p className="text-sm text-coffee-500">Valor real: $180.000. Molienda fresca = Sabor real.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-coffee-100 mx-auto lg:mx-0 max-w-md">
                                <div className="bg-green-100 p-2 rounded-full text-green-700"><CheckCircle2 size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-coffee-900">E-book Barista (Regalo #2)</h4>
                                    <p className="text-sm text-coffee-500">Guía práctica "Barista en 5 min".</p>
                                </div>
                            </div>
                            
                        </div>
        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-coffee-50 p-4 rounded-xl text-center">
                                <Truck size={24} className="mx-auto text-coffee-900 mb-2" />
                                <span className="font-bold text-sm block">Envío Gratis</span>
                                <span className="text-xs text-coffee-500">A toda Colombia</span>
                            </div>
                            <div className="bg-coffee-50 p-4 rounded-xl text-center">
                                <ShieldCheck size={24} className="mx-auto text-coffee-900 mb-2" />
                                <span className="font-bold text-sm block">Garantía Total</span>
                                <span className="text-xs text-coffee-500">12 Meses Directa</span>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 w-full"> 
                        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] lg:scale-105 border-4 border-gold-500/30 relative overflow-hidden transition-transform duration-300 flex flex-col h-full w-full max-w-md mx-auto lg:max-w-none">
                            
                            <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl shadow-md tracking-wider">STOCK LIMITADO</div>
        
                            <div className="mb-4 md:mb-6">
                                <Countdown />
                                
                                <div className="flex items-start gap-4 border-b border-coffee-100 pb-4 mb-4">
                                    <div className="bg-coffee-100 p-3 rounded-xl shrink-0">
                                        <Coffee size={24} className="text-coffee-900 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-serif font-bold text-coffee-900 leading-tight">Estación Espresso Pro</h3>
                                        <p className="text-xs md:text-sm text-coffee-500 font-medium leading-tight">Calidad de Cafetería</p>
                                    </div>
                                </div>
        
                                <div className="bg-gold-50/50 rounded-xl p-4 border border-gold-100 mb-4 md:mb-6">
                                    <p className="text-xs font-bold text-coffee-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Gift size={12} className="text-gold-600" /> BONUS ACTIVOS:
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex justify-between items-center text-sm">
                                            <span className="text-coffee-700 font-medium truncate pr-2">Molino Ajustable</span>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-red-400 line-through text-[10px] md:text-xs">$180.000</span>
                                                <span className="text-green-600 font-bold text-[10px] md:text-xs">GRATIS</span>
                                            </div>
                                        </li>
                                        <li className="flex justify-between items-center text-sm">
                                            <span className="text-coffee-700 font-medium truncate pr-2">E-book Barista</span>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-red-400 line-through text-[10px] md:text-xs">$47.000</span>
                                                <span className="text-green-600 font-bold text-[10px] md:text-xs">GRATIS</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="text-center mb-6">
                                    <p className="text-coffee-400 uppercase text-[10px] font-bold tracking-widest mb-0">Precio Total Hoy</p>
                                     <div className="flex flex-col items-center justify-center gap-0">
                                        <span className="text-xl text-red-500 line-through font-medium opacity-60">{OLD_PRICE}</span>
                                        <span className="text-5xl md:text-6xl font-extrabold text-coffee-900 tracking-tighter">{PRICE}</span>
                                    </div>
                                </div>
        
                                <button 
                                    onClick={handleCheckoutClick}
                                    className="w-full bg-coffee-900 hover:bg-black text-white text-lg md:text-xl font-bold py-4 rounded-xl shadow-xl hover:shadow-gold-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 relative z-10">
                                        <span>OBTENER OFERTA</span>
                                        <ArrowRight size={24} className="text-gold-500" />
                                    </div>
                                    <span className="text-[10px] font-medium text-coffee-200 uppercase tracking-wider relative z-10">Pago Contraentrega • Envío Asegurado</span>
                                    <span className="absolute w-full h-full bg-white/5 top-0 left-0 animate-pulse"></span>
                                </button>
                                
                                <div className="mt-4 pt-3 border-t border-coffee-100/50 text-xs text-coffee-500 font-medium text-center">
                                    <p className="mb-2 font-bold">Pasarela de Pagos Segura:</p>
                                    <div className="flex flex-wrap justify-center gap-2 opacity-90">
                                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold border border-green-200 flex items-center gap-1">
                                            <Banknote size={14} /> PAGO CONTRAENTREGA (Efectivo)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                  <p className="text-center text-coffee-500 text-sm mt-10 flex justify-center items-center gap-2 font-medium">
                    <ShieldCheck size={18} className="text-green-600" /> Garantía Todopolis: Compra 100% Protegida.
                  </p>
                </div>
              </section>
        
              <section className="py-16 md:py-24 bg-coffee-50 border-t border-coffee-200 relative z-10 overflow-hidden">
                 <div className="reveal fade-bottom">
                      <FAQ />
                 </div>
              </section>

        
            <StickyMobileCTA />

        </>
    );
}
