"use client";

import React, { useState, useEffect } from 'react';
import { Coffee, Menu, X, ArrowRight } from 'lucide-react';
import { useCheckout } from '../context/CheckoutContext';
import { SectionId } from '../types';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { openCheckout } = useCheckout();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
        setMobileMenuOpen(false);
    };

    const navLinks = [
        { name: 'Experiencia', id: SectionId.FEATURES },
        { name: 'Resultados', id: 'recipes' },
        { name: 'Kit Regalo', id: SectionId.BONUS },
        { name: 'Ahorro', id: 'roi' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-4 md:py-8'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${isScrolled ? 'bg-coffee-900 text-gold-500' : 'bg-white text-coffee-900 shadow-lg'}`}>
                        <Coffee size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className={`text-lg md:text-2xl font-serif font-bold tracking-tight leading-none transition-colors duration-300 ${isScrolled ? 'text-coffee-900' : 'text-coffee-900 lg:text-coffee-900'}`}>
                            CoffeeMaker<span className="text-gold-500">Pro</span>
                        </div>
                        <span className={`text-[9px] md:text-[10px] tracking-widest uppercase font-bold ${isScrolled ? 'text-coffee-400' : 'text-coffee-600'} hidden sm:block`}>Tienda Oficial</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map(link => (
                        <button
                            key={link.name}
                            onClick={() => scrollToSection(link.id)}
                            className="text-base font-bold uppercase tracking-wide hover:text-gold-600 transition-colors text-coffee-800"
                        >
                            {link.name}
                        </button>
                    ))}
                    <button
                        onClick={openCheckout}
                        className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg shadow-gold-500/20 flex items-center gap-2 border border-gold-400"
                    >
                        Reclamar Oferta
                    </button>
                </div>

                <button
                    className="md:hidden text-coffee-900 bg-white/90 p-2 rounded-lg backdrop-blur-sm border border-coffee-100 shadow-sm active:bg-coffee-50 z-50"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-white/98 backdrop-blur-xl flex flex-col pt-28 px-8 gap-8 animate-fade-in-up">
                    {navLinks.map(link => (
                        <button
                            key={link.name}
                            onClick={() => scrollToSection(link.id)}
                            className="text-3xl font-serif font-bold text-coffee-900 text-left border-b-2 border-transparent hover:border-gold-500 pb-2 active:text-gold-600 transition-all"
                        >
                            {link.name}
                        </button>
                    ))}
                    <div className="mt-auto mb-12 space-y-4">
                        <p className="text-coffee-400 text-base text-center">Incluye Molino Gratis por tiempo limitado.</p>
                        <button
                            onClick={openCheckout}
                            className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold text-xl shadow-xl flex justify-center items-center gap-2"
                        >
                            ¡Quiero mi Kit! <ArrowRight size={24} />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
