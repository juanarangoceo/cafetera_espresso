"use client";

import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Policy } from '../types';
import { POLICIES } from '../data/content';
import PolicyModal from './PolicyModal';

export default function Footer() {
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

    return (
        <footer className="bg-coffee-950 text-coffee-200 py-16 md:py-24 border-t border-coffee-800 text-sm relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-coffee-800 flex items-center justify-center text-gold-500">
                                <span className="font-serif font-bold text-xl">C</span>
                            </div>
                            <span className="text-xl font-serif font-bold text-white tracking-wide">CoffeeMaker<span className="text-gold-500">Pro</span></span>
                        </div>
                        <p className="text-coffee-300 leading-relaxed mb-6">
                            Elevando el estándar del café en casa. Tecnología italiana, corazón colombiano.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center hover:bg-gold-500 hover:text-white transition-all"><Facebook size={18} /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center hover:bg-gold-500 hover:text-white transition-all"><Instagram size={18} /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center hover:bg-gold-500 hover:text-white transition-all"><Twitter size={18} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Enlaces Rápidos</h4>
                        <ul className="space-y-3">
                            <li><button onClick={() => window.scrollTo(0, 0)} className="hover:text-gold-400 transition-colors">Inicio</button></li>
                            <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-gold-400 transition-colors">Experiencia</button></li>
                            <li><button onClick={() => document.getElementById('recipes')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-gold-400 transition-colors">Recetas</button></li>
                            <li><button onClick={() => document.getElementById('bonus')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-gold-400 transition-colors">Kit Regalo</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Legal</h4>
                        <ul className="space-y-3">
                            <li><button onClick={() => setSelectedPolicy(POLICIES.privacy)} className="hover:text-gold-400 transition-colors">Privacidad</button></li>
                            <li><button onClick={() => setSelectedPolicy(POLICIES.terms)} className="hover:text-gold-400 transition-colors">Términos</button></li>
                            <li><button onClick={() => setSelectedPolicy(POLICIES.shipping)} className="hover:text-gold-400 transition-colors">Envíos</button></li>
                            <li><button onClick={() => setSelectedPolicy(POLICIES.returns)} className="hover:text-gold-400 transition-colors">Garantía</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Contacto</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <Mail size={18} className="text-gold-500 shrink-0" />
                                <span className="text-coffee-300">hola@coffeemakerpro.com</span>
                            </li>
                            <li className="flex gap-3">
                                <Phone size={18} className="text-gold-500 shrink-0" />
                                <span className="text-coffee-300">+57 300 123 4567</span>
                            </li>
                            <li className="flex gap-3">
                                <MapPin size={18} className="text-gold-500 shrink-0" />
                                <span className="text-coffee-300">Bogotá, Colombia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-coffee-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-coffee-400">
                    <p>&copy; {new Date().getFullYear()} Coffee Maker Pro. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Sistemas Operativos
                    </p>
                </div>
            </div>
            <PolicyModal policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} />
        </footer>
    );
}
