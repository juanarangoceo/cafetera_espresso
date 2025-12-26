"use client";

import React from 'react';
import { Coffee, MapPin, Instagram, Mail, ChevronRight, Scale, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';
import { useLanding } from '@/context/LandingContext';
import { POLICIES } from '@/lib/data';
import { SectionId } from '@/types';

export default function Footer() {
    const { openPolicy } = useLanding();

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className="bg-black text-white relative overflow-hidden border-t border-white/10">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-coffee-900/40 rounded-full blur-3xl rounded-r-none"></div>

            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2.5 rounded-xl">
                                <Coffee className="text-gold-500 w-6 h-6" />
                            </div>
                            <span className="font-serif font-bold text-2xl tracking-tight">CoffeeMaker Pro</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Elevando el estándar del café en casa. Ingeniería italiana, soporte local y pasión por cada taza servida en Colombia.
                        </p>
                        <div className="flex gap-4">
                            <a 
                                href="https://instagram.com/coffeemakerprofesional" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white/5 hover:bg-gold-500 hover:text-black p-3 rounded-full transition-all duration-300 group"
                                aria-label="Instagram"
                            >
                                <Instagram size={20}/>
                            </a>
                            <a 
                                href="mailto:hola@coffeemakerpro.com" 
                                className="bg-white/5 hover:bg-gold-500 hover:text-black p-3 rounded-full transition-all duration-300"
                                aria-label="Email"
                            >
                                <Mail size={20}/>
                            </a>
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-gold-100 flex items-center gap-2">
                            Explorar
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li>
                                <button onClick={() => scrollTo(SectionId.HERO)} className="hover:text-gold-500 flex items-center gap-2 transition-colors group">
                                    <ChevronRight size={14} className="text-gold-500/50 group-hover:text-gold-500 transition-colors" /> Inicio
                                </button>
                            </li>
                            <li>
                                <button onClick={() => scrollTo(SectionId.FEATURES)} className="hover:text-gold-500 flex items-center gap-2 transition-colors group">
                                    <ChevronRight size={14} className="text-gold-500/50 group-hover:text-gold-500 transition-colors" /> Características
                                </button>
                            </li>
                            <li>
                                <button onClick={() => scrollTo('recipes')} className="hover:text-gold-500 flex items-center gap-2 transition-colors group">
                                    <ChevronRight size={14} className="text-gold-500/50 group-hover:text-gold-500 transition-colors" /> Recetas
                                </button>
                            </li>
                             <li>
                                <button onClick={() => scrollTo(SectionId.BONUS)} className="hover:text-gold-500 flex items-center gap-2 transition-colors group">
                                    <ChevronRight size={14} className="text-gold-500/50 group-hover:text-gold-500 transition-colors" /> Regalos
                                </button>
                            </li>
                             <li>
                                <Link href="/blog" className="hover:text-gold-500 flex items-center gap-2 transition-colors group">
                                    <ChevronRight size={14} className="text-gold-500/50 group-hover:text-gold-500 transition-colors" /> Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-gold-100">
                            Legal y Garantías
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li>
                                <button onClick={() => openPolicy(POLICIES.terms)} className="hover:text-gold-500 flex items-center gap-2 transition-colors">
                                    <Scale size={16} className="text-gray-500" /> Términos y Condiciones
                                </button>
                            </li>
                            <li>
                                <button onClick={() => openPolicy(POLICIES.privacy)} className="hover:text-gold-500 flex items-center gap-2 transition-colors">
                                    <FileText size={16} className="text-gray-500" /> Política de Privacidad
                                </button>
                            </li>
                            <li>
                                <button onClick={() => openPolicy(POLICIES.returns)} className="hover:text-gold-500 flex items-center gap-2 transition-colors">
                                    <ShieldCheck size={16} className="text-gray-500" /> Garantía y Devoluciones
                                </button>
                            </li>
                             <li>
                                <button onClick={() => openPolicy(POLICIES.shipping)} className="hover:text-gold-500 flex items-center gap-2 transition-colors">
                                    <TruckIcon /> Información de Envíos
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-gold-100">
                            Contacto
                        </h4>
                        <ul className="space-y-5 text-sm">
                            <li className="flex items-start gap-4 text-gray-300">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg">
                                    <MapPin size={18} className="text-gold-500" />
                                </div>
                                <div>
                                    <span className="block font-medium text-white">Oficina Central</span>
                                    Bogotá D.C., Colombia
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-gray-300">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg">
                                    <Instagram size={18} className="text-gold-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-300">@coffeemakerprofesional</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} Coffee Maker Pro. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <span>Hecho con ☕ en Colombia</span>
                    </div>
                </div>
            </div>
            {/* Safe area padding for mobile nav if needed */}
            <div className="h-20 md:h-0"></div> 
        </footer>
    );
}

function TruckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/></svg>
    )
}
