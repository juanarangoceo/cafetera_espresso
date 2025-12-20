"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, Star, Check, ShieldCheck, Truck, Zap, Thermometer, Settings, Menu, X, ArrowRight, PlayCircle, Coffee, Droplets, Gauge, Package, Touchpad, Box, ChefHat, Heart, ChevronRight, Users, Award, MapPin, BookOpen, Gift, Sparkles, CheckCircle2, Lock, Banknote, CreditCard, Info, Smartphone, Tablet, Wind, Speaker, Timer, XCircle, TrendingUp, DollarSign, Calculator, AlertTriangle, Loader2, Quote, Instagram, Flame, TimerReset, Camera, Maximize2, Shield, GraduationCap, Play, MonitorPlay, Receipt, Clock, MousePointerClick } from 'lucide-react';
import ChatBot from '../components/ChatBot';
import Countdown from '../components/Countdown';
import FAQ from '../components/FAQ';
import VideoPlayer from '../components/VideoPlayer';
import RecipeModal from '../components/RecipeModal';
import PolicyModal from '../components/PolicyModal';
import ImageModal from '../components/ImageModal';
import CheckoutDrawer from '../components/CheckoutDrawer';
import { HotspotSection } from '../components/HotspotSection';
import { SectionId, Recipe, Policy } from '../types';

// --- CONSTANTS ---
const CHECKOUT_URL = "#checkout-form";
const PRICE = "$490.000";
const OLD_PRICE = "$1.190.000";

// --- DATA: Testimonials (Strategic) ---
const TESTIMONIALS = [
    {
        id: 1,
        name: "Carlos M.",
        location: "Bogotá, DC",
        role: "Ahorrador Inteligente",
        text: "Hice cuentas y gastaba $300mil al mes en tintos de la calle. Con esta máquina me preparo algo mil veces mejor y me sale a $500 pesos la taza. El molino gratis es un detallazo.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop", // User photo
        highlight: "Ahorro Real"
    },
    {
        id: 2,
        name: "Andrea R.",
        location: "Medellín, ANT",
        role: "Principiante",
        text: "Tenía miedo de no saber usarla porque nunca he sido barista. El E-book que regalan explica todo súper fácil. Ya hago corazones en la leche (bueno, intentos jaja).",
        stars: 5,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop", // User photo
        highlight: "Fácil de Usar"
    },
    {
        id: 3,
        name: "Felipe G.",
        location: "Cali, VAL",
        role: "Exigente",
        text: "He tenido máquinas de marcas italianas caras. Esta Coffee Maker Pro no tiene nada que envidiarles. Los 20 bares son reales, la crema es espesa y consistente. Recomendada.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop", // User photo
        highlight: "Calidad Pro"
    }
];

// --- DATA: UGC Grid ---
const UGC_IMAGES = [
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop"
];

// --- DATA: Product Gallery (Updated for Bento Grid) ---
const PRODUCT_IMAGES = [
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-2.webp?v=1757995172",
        title: "Acero Inoxidable Premium",
        desc: "Cuerpo robusto de grado quirúrgico. No se oxida, no se mancha.",
        span: "md:col-span-2 md:row-span-2" // Hero Image
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-3.webp?v=1757995172",
        title: "Vaporizador Pro",
        desc: "Varilla de acero con rotación 360° para texturizar leche.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-4.webp?v=1757995172",
        title: "Portafiltro Sólido",
        desc: "Peso balanceado y doble salida para extracción uniforme.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-6.webp?v=1757995173",
        title: "Pantalla Táctil",
        desc: "Control intuitivo y preciso para cada preparación.",
        span: "md:col-span-2 md:row-span-1"
    }
];

// --- DATA: Recipes ---
const RECIPES: Recipe[] = [
    {
        id: 'tinto',
        title: 'Tinto Perfecto',
        subtitle: 'El clásico colombiano',
        time: '1 min',
        image: '/images/tinto.png',
        ingredients: ['18g de café en grano (Molienda Fina)', '60ml de agua (92°C)', 'Sin azúcar'],
        steps: ['Muele tus granos frescos con el molino de regalo.', 'Compacta con fuerza media usando el tamper.', 'Extrae por 25 segundos para obtener la crema perfecta.'],
        proSecret: 'El secreto no es el azúcar, es la molienda fresca. El café pre-molido pierde el 60% de sus aromas en 15 minutos.'
    },
    {
        id: 'cappuccino',
        title: 'Cappuccino de Autor',
        subtitle: 'Textura de terciopelo',
        time: '5 min',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=600&auto=format&fit=crop', // Keeping Unsplash for now (Limit reached)
        ingredients: ['1 Espresso simple', '150ml de leche entera fría', 'Cacao en polvo'],
        steps: ['Extrae el espresso en taza ancha.', 'Purga el vaporizador.', 'Texturiza la leche inclinando la jarra 45 grados hasta que brille.', 'Vierte creando un círculo blanco en el centro.'],
        proSecret: 'Para latte art, la leche no debe hervir. Debe estar a unos 65°C, justo cuando ya no puedes sostener la jarra metálica.'
    },
    {
        id: 'affogato',
        title: 'Affogato Italiano',
        subtitle: 'Postre y café en uno',
        time: '2 min',
        image: '/images/affogato.png',
        ingredients: ['2 bolas de helado de vainilla', '1 Espresso doble (60ml) intenso', 'Nueces trituradas'],
        steps: ['Sirve el helado en copa congelada.', 'Prepara el espresso doble directamente sobre el helado.', 'Decora con nueces.'],
        proSecret: 'Usa una molienda un poco más fina para este espresso, buscando una extracción "Ristretto" (más corta y dulce) que contraste con el helado.'
    },
    {
        id: 'iced',
        title: 'Cold Brew Express',
        subtitle: 'Refrescante y energizante',
        time: '3 min',
        image: '/images/coldbrew.png',
        ingredients: ['1 Espresso doble', 'Hielo grande', '100ml agua tónica', 'Rodaja de limón'],
        steps: ['Llena el vaso con hielo.', 'Agrega la tónica y el limón.', 'Vierte el espresso suavemente para que flote.'],
        proSecret: 'El gas de la tónica resalta las notas cítricas de los cafés colombianos de altura. Una experiencia sensorial única.'
    }
];

// --- DATA: Gallery Items (Lifestyle/Details) ---
const GALLERY_ITEMS = [
    {
        id: 1,
        title: "La Crema Perfecta",
        desc: "Densa, color avellana y capaz de sostener el azúcar. El sello de calidad de un espresso real.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-2.webp?v=1757995172",
        icon: <Droplets size={24} />
    },
    {
        id: 2,
        title: "Micro-espuma de Seda",
        desc: "Potencia de vapor seco para texturizar leche brillante y elástica. Tu Latte Art empieza aquí.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-3.webp?v=1757995172",
        icon: <Wind size={24} />
    },
    {
        id: 3,
        title: "Frescura Instantánea",
        desc: "Rompe el grano segundos antes. Los aceites esenciales van a tu taza, no al aire.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/molino_cafe_electrico_raf.webp?v=1758255802",
        icon: <Coffee size={24} />
    },
    {
        id: 4,
        title: "Acero Inoxidable Premium",
        desc: "Robusta, pesada y elegante. No es plástico, es maquinaria comercial para tu cocina.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/scuare.jpg?v=1757995325",
        icon: <Shield size={24} />
    }
];

// --- DATA: Policies ---
const POLICIES: Record<string, Policy> = {
    privacy: {
        id: 'privacy',
        title: 'Política de Privacidad',
        content: [
            'Tus datos están protegidos con encriptación SSL de 256 bits.',
            'Solo usamos tu información para procesar el envío y la garantía.',
            'Nunca vendemos tus datos a terceros.'
        ]
    },
    terms: {
        id: 'terms',
        title: 'Términos y Condiciones',
        content: [
            'Oferta del Molino Gratis válida hasta agotar inventario (50 unidades).',
            'Precios en COP con IVA incluido.',
            'El despacho se realiza al día siguiente hábil de la compra.'
        ]
    },
    shipping: {
        id: 'shipping',
        title: 'Información de Envíos',
        content: [
            'Envío GRATIS asegurado a todo el país.',
            'Aliados logísticos: Servientrega, Interrapidisimo, Envía.',
            'Tiempo de entrega: 2-4 días hábiles en ciudades principales.'
        ]
    },
    returns: {
        id: 'returns',
        title: 'Garantía Todopolis',
        content: [
            '1 Año de Garantía Directa por defectos de fábrica.',
            '30 Días de Garantía de Satisfacción Total.',
            'Soporte técnico prioritario para clientes.'
        ]
    }
};

export default function Home() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [selectedImage, setSelectedImage] = useState<{src: string, alt: string} | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // --- INTERSECTION OBSERVER FOR ANIMATIONS & SCROLL TRACKING ---
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);

        // General Reveal Animations
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
            window.removeEventListener('scroll', handleScroll);
            reveals.forEach(el => observerReveal.unobserve(el));
        };
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

    const handleCheckoutClick = () => {
        setIsCheckoutOpen(true);
    };

    const navLinks = [
        { name: 'Experiencia', id: SectionId.FEATURES },
        { name: 'Resultados', id: 'recipes' },
        { name: 'Kit Regalo', id: SectionId.BONUS },
        { name: 'Ahorro', id: 'roi' },
    ];

    return (
        <div className="min-h-screen bg-coffee-50 text-coffee-900 font-sans antialiased overflow-x-hidden selection:bg-gold-200 selection:text-coffee-900 pb-24 md:pb-0">

            {/* --- Sticky Navbar --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-4 md:py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${isScrolled ? 'bg-coffee-900 text-gold-500' : 'bg-white text-coffee-900 shadow-lg'}`}>
                            <Coffee size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className={`text-xl md:text-2xl font-serif font-black tracking-tight leading-none transition-colors duration-300 ${isScrolled ? 'text-coffee-900' : 'text-coffee-900 lg:text-coffee-900'}`}>
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
                            onClick={() => scrollToSection(SectionId.PRICING)}
                            className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg shadow-gold-500/20 flex items-center gap-2 border border-gold-400"
                        >
                            COMPRAR AHORA
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
                                onClick={handleCheckoutClick}
                                className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold text-xl shadow-xl flex justify-center items-center gap-2"
                            >
                                ¡Quiero mi Kit! <ArrowRight size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- Sticky Mobile CTA --- */}
            {isScrolled && (
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-coffee-100 p-4 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.08)] flex items-center gap-4 animate-slide-up safe-area-pb">
                    <div className="flex-1">
                        <p className="text-xs text-gold-600 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                            <Gift size={12} /> Oferta Limitada Activada
                        </p>
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-coffee-900 leading-tight">Molino + Curso Barista</p>
                            <span className="text-[10px] text-green-700 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> PAGO CONTRAENTREGA DISPONIBLE</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckoutClick}
                        className="bg-gold-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 active:scale-95 transition-transform text-sm whitespace-nowrap"
                    >
                        Reclamar Oferta
                    </button>
                </div>
            )}

            {/* --- HERO SECTION (CSS ANIMATION ONLY) --- */}
            <section id={SectionId.HERO} className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-noise">
                {/* Decorative Backgrounds - Reduced opacity for mobile */}
                <div className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-gradient-to-br from-gold-100/40 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/3 translate-x-1/3 z-0"></div>
                <div className="absolute bottom-0 left-0 w-[400px] lg:w-[700px] h-[400px] lg:h-[700px] bg-coffee-100/30 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4 z-0"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                    <div className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1">
                        {/* Banner removed by user request (Oferta Flash Activa) */}

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-coffee-900 leading-[1.1] tracking-tight drop-shadow-sm">
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

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <button
                                onClick={() => scrollToSection(SectionId.PRICING)}
                                className="group bg-coffee-900 hover:bg-coffee-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 border border-coffee-700 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative">Comenzar mi Experiencia Barista</span>
                                <span className="relative bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors"><ArrowRight size={18} /></span>
                            </button>
                        </div>
                        
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
                            <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                                <AlertTriangle size={18} />
                                Solo 7 Molinos Disponibles
                            </div>
                        </div>
                    </div>

                    {/* Main Image - CSS Animated Float (Optimized Mobile/Desktop Split) */}
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
                                    sizes="100vw"
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
                                    sizes="50vw"
                                    className="rounded-[2rem] shadow-2xl border-[4px] border-white bg-coffee-200 object-contain"
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* --- NEW SECTION: GIFT NOTIFICATION BAR (HIGH IMPACT) --- */}
            <section className="bg-coffee-900 py-6 border-b-4 border-gold-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <div className="bg-gold-500 text-white p-3 rounded-full animate-pulse shadow-lg shadow-gold-500/50">
                            <Gift size={28} />
                        </div>
                        <div>
                            <p className="text-gold-400 font-bold uppercase tracking-widest text-xs">Oferta Limitada Activada</p>
                            <h3 className="text-white text-xl md:text-2xl font-serif font-bold">
                                Comprando HOY recibes <span className="text-gold-500 underline decoration-2 underline-offset-4">2 REGALOS</span>
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-white/80">
                            <CheckCircle2 size={16} className="text-green-500" /> Molino Eléctrico
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <CheckCircle2 size={16} className="text-green-500" /> Masterclass Digital
                        </div>
                        <button onClick={() => scrollToSection(SectionId.BONUS)} className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors items-center gap-2 border border-white/20">
                            Ver Detalles <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: THE PROBLEM / SOLUTION --- */}
            <section id={SectionId.FEATURES} className="relative bg-white border-t border-coffee-100 py-16 md:py-24 overflow-hidden min-h-[500px]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12 md:mb-16 flex flex-col justify-center">
                        <div className="inline-block min-h-[36px]"><span className="text-gold-600 font-bold tracking-[0.2em] text-sm uppercase bg-coffee-50 border border-gold-200 px-5 py-2 rounded-full shadow-sm leading-none">La Realidad</span></div>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mt-6 leading-tight min-h-[1.1em]">
                            ¿Por qué tu café en casa no sabe<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coffee-600 to-coffee-400">como el de tu cafetería favorita?</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 md:gap-20 items-center">
                        {/* Visual Anchor: Video */}
                        <div className="flex flex-col items-center justify-center">
                            <VideoPlayer src="https://res.cloudinary.com/dohwyszdj/video/upload/v1766264202/video_reel_hcfoyo.mp4" />
                            <p className="text-center text-sm text-coffee-400 mt-6 italic max-w-xs mx-auto">Mira la extracción real a 20 Bares de la Coffee Maker Pro</p>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-6 md:space-y-8">
                            <div className="bg-coffee-50 rounded-2xl p-6 md:p-8 border border-coffee-100 hover:border-gold-300 transition-colors shadow-sm group">
                                <div className="flex items-start gap-5">
                                    <div className="bg-white p-3 rounded-full shadow-md text-gold-500 group-hover:scale-110 transition-transform shrink-0">
                                        <TimerReset size={28} className="md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-coffee-900 mb-3">1. El Problema del Café Oxidado</h3>
                                        <p className="text-coffee-700 leading-relaxed text-base md:text-lg">
                                            <span className="font-bold text-red-500">Lo que haces mal:</span> Usas café pre-molido de supermercado. <br />
                                            <span className="font-bold text-green-600">La Solución:</span> Te regalamos el <strong className="text-coffee-900">Molino Automático</strong>. Rompes el grano 10 segundos antes de beberlo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-coffee-50 rounded-2xl p-6 md:p-8 border border-coffee-100 hover:border-gold-300 transition-colors shadow-sm group">
                                <div className="flex items-start gap-5">
                                    <div className="bg-white p-3 rounded-full shadow-md text-gold-500 group-hover:scale-110 transition-transform shrink-0">
                                        <Gauge size={28} className="md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-coffee-900 mb-3">2. Presión Insuficiente</h3>
                                        <p className="text-coffee-700 leading-relaxed text-base md:text-lg">
                                            <span className="font-bold text-red-500">Lo que haces mal:</span> Usas cafeteras de goteo o cápsulas débiles.<br />
                                            <span className="font-bold text-green-600">La Solución:</span> Nuestra Bomba Italiana de <strong className="text-coffee-900">20 Bares</strong> empuja el agua con fuerza bruta a través del café.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-coffee-50 rounded-2xl p-6 md:p-8 border border-coffee-100 hover:border-gold-300 transition-colors shadow-sm group">
                                <div className="flex items-start gap-5">
                                    <div className="bg-white p-3 rounded-full shadow-md text-gold-500 group-hover:scale-110 transition-transform shrink-0">
                                        <Flame size={28} className="md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-coffee-900 mb-3">3. Sé el Barista de tu Equipo</h3>
                                        <p className="text-coffee-700 leading-relaxed text-base md:text-lg">
                                            <span className="font-bold text-red-500">Lo que haces mal:</span> Ofrecer café rancio o instantáneo.<br />
                                            <span className="font-bold text-green-600">La Solución:</span> Sorprende a tus visitas o clientes con un café real en segundos, no con agua manchada.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- NEW SECTION: PRODUCT PHOTOGRAPHY GALLERY (MOBILE OPTIMIZED & BENTO GRID) --- */}
            <section className="py-16 md:py-24 bg-coffee-950 text-white relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-12 gap-6 reveal fade-bottom">
                        <div>
                            <span className="text-gold-500 font-bold tracking-widest text-sm uppercase mb-2 block">ADN Italiano 🇮🇹</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">Más que una máquina,<br /><span className="text-coffee-200">una escultura.</span></h2>
                        </div>
                        <p className="text-coffee-200 max-w-sm text-base md:text-lg hidden md:block leading-relaxed opacity-90">
                            Construida en acero inoxidable Premium de grado quirúrgico. Diseñada para durar y lucir elegante en cualquier cocina o sala de juntas.
                        </p>
                    </div>

                    {/* Bento Grid Optimized with Overlay & Modal */}
                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px] reveal zoom-in">
                        {PRODUCT_IMAGES.map((img, idx) => (
                            <div 
                                key={idx} 
                                className={`relative rounded-2xl overflow-hidden group ${img.span} border border-white/5 shadow-2xl bg-coffee-900 aspect-square md:aspect-auto cursor-pointer`}
                                onClick={() => setSelectedImage({src: img.src, alt: img.title})}
                            >
                                <Image
                                    src={img.src}
                                    alt={img.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-40"
                                />
                                {/* Overlay Content - Bottom Aligned */}
                                <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-8 text-center z-10 hover:backdrop-blur-[2px] transition-all bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                    <h3 className="text-white text-2xl md:text-3xl font-serif font-bold mb-1 drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{img.title}</h3>
                                    <div className="w-12 h-1 bg-gold-500 rounded-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <p className="text-coffee-100 text-sm md:text-base font-medium max-w-[90%] opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 leading-tight">{img.desc}</p>
                                    
                                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full text-gold-400 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                                        <Maximize2 size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- RESULTS (RECIPES) --- */}
            <section id="recipes" className="py-16 md:py-24 bg-coffee-50 bg-noise relative text-coffee-900 border-t border-coffee-200">
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12 md:mb-16 reveal fade-bottom">
                        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-4 border border-coffee-200 shadow-sm">
                            <ChefHat className="text-gold-500" size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mb-4">Lo que vas a lograr</h2>
                        <p className="text-coffee-600 font-light text-lg md:text-xl max-w-2xl mx-auto">
                            Resultados de cafetería de especialidad, sin el costo de equipos industriales. Calidad accesible y garantizada.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {RECIPES.map((recipe, index) => (
                            <div key={recipe.id} className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group border border-coffee-100 hover:border-gold-300 flex flex-col cursor-pointer reveal fade-bottom`} style={{ transitionDelay: `${index * 100}ms` }} onClick={() => setSelectedRecipe(recipe)}>
                                <div className="h-56 overflow-hidden relative">
                                    <Image src={recipe.image} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 bg-coffee-100" alt={recipe.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-sm font-bold text-gold-600 shadow-sm">{recipe.time}</div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-serif font-bold text-2xl text-coffee-900 mb-1 group-hover:text-gold-600 transition-colors">{recipe.title}</h3>
                                    <p className="text-sm text-coffee-500 mb-5 uppercase tracking-wider font-medium">{recipe.subtitle}</p>
                                    <button className="mt-auto flex items-center gap-2 text-base text-coffee-600 hover:text-gold-600 transition-colors font-bold border-t border-coffee-100 pt-4">
                                        Ver Receta <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- GIFT 1: PREMIUM HARDWARE (REDESIGNED) --- */}
            <section id={SectionId.BONUS} className="py-20 md:py-32 bg-coffee-950 relative overflow-hidden text-white border-t border-coffee-800">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-gold-500/20 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">

                        {/* Text Content */}
                        <div className="order-2 lg:order-1 reveal fade-right">
                            <div className="bg-gradient-to-r from-gold-600 to-gold-400 text-white px-6 py-2 rounded-r-full border-l-4 border-white inline-block shadow-lg shadow-gold-500/20 mb-8 transform -translate-x-6">
                                <span className="text-sm md:text-base font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Gift size={18} className="animate-bounce" /> Regalo Exclusivo #1
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-serif font-bold leading-none mb-6">
                                Ingeniería de Precisión <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-white">Totalmente Gratis.</span>
                            </h2>
                            <p className="text-coffee-200 text-lg md:text-xl leading-relaxed mb-8 font-light">
                                Las cafeterías de especialidad no usan café pre-molido porque se oxida en minutos. Para que tu experiencia sea <span className="text-white font-bold">realmente premium</span>, necesitas moler al instante.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                        <Settings className="text-gold-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">Cuchillas de Acero Inox</h4>
                                        <p className="text-coffee-300 text-sm">Corte uniforme para una extracción balanceada y sin amargor.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                        <Zap className="text-gold-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">Motor de Alta Potencia</h4>
                                        <p className="text-coffee-300 text-sm">Pulveriza el grano en menos de 10 segundos con un solo toque.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-default">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Valor en Tienda</p>
                                    <p className="text-2xl font-serif text-gray-500 line-through decoration-red-500 decoration-2">$180.000</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gold-400 uppercase font-bold mb-1">Precio Hoy</p>
                                    <p className="text-4xl font-serif font-bold text-white text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-200">GRATIS</p>
                                </div>
                            </div>
                        </div>

                        {/* Image Content */}
                        <div className="order-1 lg:order-2 relative reveal zoom-in">
                            <div className="relative z-10">
                                <Image
                                    src="https://cdn.shopify.com/s/files/1/0608/6433/1831/files/molino_cafe_electrico_raf.webp?v=1758255802"
                                    width={800}
                                    height={800}
                                    className="w-full h-auto rounded-[2.5rem] shadow-2xl shadow-black/50 border border-white/10 bg-gradient-to-br from-gray-800 to-black p-2"
                                    alt="Molino de Café Eléctrico Premium"
                                />

                            </div>
                            {/* Back Glow */}
                            <div className="absolute inset-0 bg-gold-600 blur-[80px] opacity-20 -z-10 rounded-full"></div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- GIFT 2: E-BOOK (REDESIGNED ACADEMY STYLE) --- */}
            <section className="py-20 bg-coffee-50 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 reveal fade-bottom">
                         <div className="inline-block bg-coffee-900/5 px-6 py-2 rounded-full border border-coffee-900/10 mb-6">
                            <span className="text-gold-600 font-bold tracking-[0.2em] text-sm md:text-base uppercase">Regalo Exclusivo #2</span>
                         </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mt-3 mb-6">"No necesitas ser experto para parecer uno."</h2>
                        <p className="text-lg text-coffee-600">
                            La mayoría compra máquinas caras y las abandona porque no saben usarlas. Nosotros no te vendemos solo la máquina, te regalamos la habilidad.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-coffee-100 flex flex-col md:flex-row gap-12 items-center reveal fade-bottom">
                        {/* Visual: Tablet Mockup */}
                        <div className="w-full md:w-1/2 relative perspective-1000">
                            <div className="absolute inset-0 bg-gold-100 rounded-full filter blur-3xl opacity-60 transform scale-90"></div>

                            {/* Tablet Container simulating a device */}
                            <div className="relative z-10 bg-black rounded-[2rem] border-[8px] border-gray-800 shadow-2xl transform md:-rotate-3 hover:rotate-0 transition-all duration-500 w-full max-w-sm mx-auto overflow-hidden">
                                <div className="aspect-[3/4] relative">
                                    <Image
                                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop"
                                        fill
                                        sizes="(max-width: 640px) 90vw, 384px"
                                        className="object-cover opacity-90"
                                        alt="Ebook Cover on Tablet"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                                        <p className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-1">Masterclass Oficial</p>
                                        <h3 className="font-serif text-2xl font-bold leading-none">Barista Master <br />Guide 2025</h3>
                                    </div>
                                    {/* Play Button Overlay */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40">
                                        <MonitorPlay className="text-white ml-1" size={32} />
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -right-4 top-10 bg-coffee-900 text-white p-3 rounded-lg shadow-lg z-20 animate-bounce hidden md:block">
                                <GraduationCap size={24} className="text-gold-500 mb-1" />
                                <span className="text-xs font-bold">Certificado</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="w-full md:w-1/2">
                            <h3 className="text-3xl font-serif font-bold text-coffee-900 mb-2">Barista Master Class</h3>
                            <p className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-6">Libro Digital Interactivo + Videos</p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-coffee-800">Módulo 1: Calibración Perfecta</h4>
                                        <p className="text-sm text-coffee-500">Aprende a ajustar tu molino para que el espresso salga como miel.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-coffee-800">Módulo 2: Leche de Seda</h4>
                                        <p className="text-sm text-coffee-500">La técnica exacta para que la leche brille y no tenga burbujas.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-coffee-800">Módulo 3: Arte Latte desde Cero</h4>
                                        <p className="text-sm text-coffee-500">Haz tu primer corazón en menos de 24 horas.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-coffee-100 flex items-center justify-between">
                                <span className="text-coffee-400 line-through font-medium">$120.000 COP</span>
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm border border-green-200 shadow-sm">INCLUIDO GRATIS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- HOTSPOT SECTION (INTERACTIVE DETAILS) --- */}
             <HotspotSection />

            {/* --- VISUAL GALLERY (OPTIMIZED) --- */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12 md:mb-16 reveal fade-bottom">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-coffee-900">Detalles que Enamoran</h2>
                        <p className="text-coffee-500 mt-4 text-lg">La diferencia entre un electrodoméstico y una herramienta profesional.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {GALLERY_ITEMS.map((item, index) => (
                            <div
                                key={item.id}
                                className={`relative rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 shadow-xl border border-transparent hover:border-gold-500/50 reveal fade-bottom`}
                                style={{ aspectRatio: '3/4', transitionDelay: `${index * 100}ms` }}
                                onClick={() => setSelectedImage({src: item.image, alt: item.title})}
                            >
                                <div className="absolute inset-0 bg-coffee-900">
                                    <Image src={item.image} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-60" alt={item.title} />
                                </div>
                                
                                {/* Top Icon */}
                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-full text-gold-400 group-hover:bg-gold-500 group-hover:text-white transition-colors duration-300 border border-white/10 z-20">
                                    {item.icon}
                                </div>

                                {/* Text Overlay - Bottom Aligned */}
                                <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-8 text-center z-10 bg-gradient-to-t from-coffee-950/90 via-coffee-900/40 to-transparent">
                                    <div className="w-10 h-1 bg-gold-500 mb-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                    <p className="font-serif text-2xl md:text-3xl font-bold leading-none mb-2 text-white drop-shadow-md">{item.title}</p>
                                    <p className="text-sm text-coffee-100 opacity-90 group-hover:text-white transition-colors duration-300 leading-tight">{item.desc}</p>
                                </div>
                                
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-0"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

      {/* --- ROI CALCULATOR (REDESIGNED - DETAILED RECEIPT 'LA FACTURA INVISIBLE') --- */}
      <section id="roi" className="py-20 bg-coffee-100 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
            
            <div className="text-center mb-16 reveal fade-bottom">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-red-200 shadow-sm">
                    <AlertTriangle size={14} /> Advertencia Financiera
                </div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mb-4">
                    La "Factura Invisible"
                </h2>
                <p className="text-coffee-600 text-lg max-w-2xl mx-auto">
                    ¿Sabes cuánto te cuesta <b>realmente</b> no tener esta máquina? El gasto hormiga te está quitando unas vacaciones al año.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center reveal zoom-in">
                
                {/* LEFT: THE RECEIPT (PAIN) */}
                <div className="relative bg-white p-8 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500 max-w-md mx-auto w-full border-t-[12px] border-red-500" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))" }}>
                     <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                         <div className="flex justify-center mb-2"><Receipt className="text-gray-400" size={32} /></div>
                         <h3 className="font-mono font-bold text-xl text-gray-800 uppercase tracking-widest">Gasto Anual</h3>
                         <p className="text-xs text-gray-500">Cafetería de la Esquina</p>
                         <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
                     </div>

                     <div className="space-y-3 font-mono text-sm text-gray-600 mb-6">
                         <div className="flex justify-between">
                             <span>Café Diario (365 dias)</span>
                             <span className="font-bold">$1.825.000</span>
                         </div>
                         <div className="pl-4 text-xs text-gray-400 italic">@ $5.000 / taza promedio</div>
                         
                         <div className="flex justify-between">
                             <span>Antojos "de paso"</span>
                             <span className="font-bold">$450.000</span>
                         </div>
                         <div className="pl-4 text-xs text-gray-400 italic">Pan, galletas, propinas</div>

                         <div className="flex justify-between text-red-500">
                             <span>Transporte / Gasolina</span>
                             <span className="font-bold">$200.000</span>
                         </div>
                         
                         <div className="flex justify-between text-gray-400">
                             <span>Tiempo en filas (25h)</span>
                             <span className="font-bold">Invaluable</span>
                         </div>
                     </div>

                     <div className="border-t-2 border-dashed border-gray-800 pt-4 mt-4">
                         <div className="flex justify-between items-end">
                             <span className="font-bold text-2xl uppercase">Total</span>
                             <span className="font-extrabold text-3xl text-red-600 tracking-tighter">$2.475.000</span>
                         </div>
                         <p className="text-center text-xs text-red-400 mt-4 font-bold uppercase">❌ Dinero Quemado</p>
                     </div>
                </div>

                {/* RIGHT: THE CURIOSITY HOOK (SOLUTION) */}
                <div className="text-center md:text-left">
                     <h3 className="text-3xl font-serif font-bold text-coffee-900 mb-4 leading-tight">
                         ¿Y si pudieras borrar esa factura por el precio de <span className="text-gold-600 bg-gold-50 px-2 rounded">2 meses de café</span>?
                     </h3>
                     <p className="text-coffee-600 text-lg mb-8 leading-relaxed">
                         Al tener tu propia estación de café en casa, el costo por taza baja de $5.000 a <b>$600 pesos</b>. La máquina se paga sola antes de que termine el año, y además te llevas 2 regalos hoy.
                     </p>

                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-coffee-200 mb-8 inline-block w-full">
                         <div className="flex items-center gap-4 mb-2">
                             <div className="p-2 bg-green-100 rounded-full text-green-600"><TrendingUp size={20} /></div>
                             <span className="text-coffee-900 font-bold">Tu Ahorro Proyectado:</span>
                         </div>
                         <div className="text-4xl font-extrabold text-green-600 tracking-tight">+$1.985.000 / año</div>
                     </div>
                     
                     <div>
                        <button 
                            onClick={handleCheckoutClick}
                            className="w-full md:w-auto bg-coffee-900 hover:bg-black text-white text-lg font-bold py-4 px-10 rounded-xl shadow-xl hover:shadow-gold-500/20 transition-all flex items-center justify-center gap-3 group"
                        >
                            <span>Detener la Fuga de Dinero</span>
                            <ArrowRight size={20} className="text-gold-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-xs text-coffee-400 mt-3 text-center md:text-left">
                            <Lock size={12} className="inline mr-1" /> Oferta protegida por Garantía de Satisfacción.
                        </p>
                     </div>
                </div>

            </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF --- */}
      <section id={SectionId.TESTIMONIALS} className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-100/30 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-coffee-100/40 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Macro Proof Header */}
            <div className="text-center mb-16 reveal fade-bottom">
                 <div className="flex justify-center items-center gap-2 mb-4">
                     <div className="flex text-gold-500">
                         {[1,2,3,4,5].map(i => <Star key={i} size={22} fill="currentColor" />)}
                     </div>
                     <span className="text-coffee-900 font-bold text-xl">4.9/5</span>
                     <span className="text-coffee-500 text-base font-medium">(+1,200 Clientes Felices)</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee-900 mb-6">Ellos ya son Baristas en Casa</h2>
            </div>

            {/* Strategic Reviews Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
                {TESTIMONIALS.map((t, idx) => (
                    <div key={t.id} className={`bg-coffee-50 p-8 rounded-2xl relative border border-coffee-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal fade-bottom`} style={{transitionDelay: `${idx * 100}ms`}}>
                        <Quote className="absolute top-6 right-6 text-coffee-200" size={40} />
                        <div className="inline-block bg-white text-gold-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6 border border-gold-100">
                            {t.highlight}
                        </div>
                        <p className="text-coffee-800 text-lg mb-6 leading-relaxed italic">"{t.text}"</p>
                        <div className="flex items-center gap-4 mt-auto">
                            <div className="w-14 h-14 rounded-full bg-coffee-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                <Image src={t.image} alt={t.name} width={56} height={56} className="bg-coffee-300 object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-coffee-900 leading-none text-lg">{t.name}</h4>
                                <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span className="text-sm text-coffee-500 font-medium">{t.role} • {t.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* "Wall of Love" */}
            <div className="bg-coffee-950 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden reveal zoom-in">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/10">
                            <Instagram className="text-white" size={36} />
                        </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
                        Únete a la comunidad <span className="text-gold-500">#CoffeeMakerPro</span>
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                        {UGC_IMAGES.map((img, i) => (
                            <div key={i} className="aspect-square bg-coffee-800 rounded-xl overflow-hidden relative group cursor-pointer border border-white/5">
                                <Image src={img} fill sizes="(max-width: 768px) 33vw, 16vw" className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 bg-coffee-800" alt="Cliente Feliz" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PRICING (DIRECT CHECKOUT) --- */}
      <section id={SectionId.PRICING} className="py-16 md:py-24 bg-white content-relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-coffee-900 to-coffee-950 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-coffee-900/40 border-2 border-coffee-800 group reveal zoom-in">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             
            <div className="relative bg-gradient-to-r from-red-600 to-red-500 text-white text-center py-3 font-bold uppercase tracking-[0.2em] text-xs md:text-sm shadow-lg z-10 border-b border-white/10 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                ¡OFERTA LIMITADA ACTIVA!
            </div>
            
            <div className="relative z-10 p-6 md:p-12 lg:p-16 grid md:grid-cols-2 gap-12 items-center">
                
                <div className="text-white space-y-6 md:space-y-8">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-serif font-bold leading-none mb-3 text-coffee-50">Kit Barista <span className="text-gold-500">Pro</span></h2>
                        <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-lg text-coffee-200 text-base font-medium">
                            Todo lo que necesitas en una caja
                        </div>
                    </div>
                    
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-sm font-bold uppercase tracking-wider text-coffee-300 mb-4">Lo que recibes hoy:</p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-white text-base md:text-lg font-bold">
                                <div className="p-1 rounded-full shrink-0 bg-gold-500 text-white">
                                    <Check size={16} strokeWidth={3} />
                                </div>
                                Máquina Espresso 20 Bares
                            </li>
                            <li className="flex items-center gap-3 text-gold-300 text-base md:text-lg font-bold animate-pulse">
                                <div className="p-1 rounded-full shrink-0 bg-red-500 text-white">
                                    <Gift size={16} strokeWidth={3} />
                                </div>
                                Molino Eléctrico (GRATIS)
                            </li>
                            <li className="flex items-center gap-3 text-gold-300 text-base md:text-lg font-bold animate-pulse">
                                <div className="p-1 rounded-full shrink-0 bg-red-500 text-white">
                                    <Gift size={16} strokeWidth={3} />
                                </div>
                                E-book 'Barista Master' (GRATIS)
                            </li>
                        </ul>
                    </div>
                    
                    <div className="pt-2 opacity-70 text-base border-t border-white/10 mt-2 flex justify-between items-center text-coffee-200 font-medium">
                        <span>Valor Total Real:</span>
                        <span className="line-through text-red-400 font-bold decoration-2">{OLD_PRICE} COP</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transform md:scale-105 border-4 border-gold-500/30 relative overflow-hidden transition-transform duration-300 flex flex-col h-full">
                    
                    <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl shadow-md tracking-wider">STOCK LIMITADO</div>

                    <div className="mb-4 md:mb-6">
                        <Countdown />
                        
                        {/* HERO DEL PRECIO */}
                        <div className="flex items-start gap-4 border-b border-coffee-100 pb-3 mb-3 md:pb-4 md:mb-4">
                            <div className="bg-coffee-100 p-2 md:p-3 rounded-xl shrink-0">
                                <Coffee size={28} className="text-coffee-900 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-serif font-bold text-coffee-900 leading-tight">Estación Espresso Pro (Edición Acero)</h3>
                                <p className="text-xs md:text-sm text-coffee-500 font-medium">Calidad de Cafetería en Casa u Oficina</p>
                            </div>
                        </div>

                        {/* SECCION DE REGALOS */}
                        <div className="bg-gold-50/50 rounded-xl p-3 md:p-4 border border-gold-100 mb-4 md:mb-6">
                            <p className="text-[10px] md:text-xs font-bold text-coffee-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Gift size={12} className="text-gold-600" /> BONUS INCLUIDOS HOY:
                            </p>
                            <ul className="space-y-2">
                                <li className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-coffee-700 font-medium truncate pr-2">Molino Eléctrico Ajustable</span>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="text-red-400 line-through text-[10px]">$180.000</span>
                                        <span className="text-green-600 font-bold text-[10px] md:text-xs">GRATIS</span>
                                    </div>
                                </li>
                                <li className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-coffee-700 font-medium truncate pr-2">Kit Barista (Tamper + Cuchara)</span>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="text-red-400 line-through text-[10px]">$50.000</span>
                                        <span className="text-green-600 font-bold text-[10px] md:text-xs">GRATIS</span>
                                    </div>
                                </li>
                                <li className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-coffee-700 font-medium truncate pr-2">Curso Digital: Barista Master</span>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="text-red-400 line-through text-[10px]">$90.000</span>
                                        <span className="text-green-600 font-bold text-[10px] md:text-xs">GRATIS</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        {/* TOTAL PRICE */}
                        <div className="text-center mb-4 md:mb-6">
                            <p className="text-coffee-400 uppercase text-[10px] font-bold tracking-widest mb-0.5">Precio Total Hoy</p>
                             <div className="flex flex-col items-center justify-center gap-0">
                                <span className="text-base md:text-xl text-red-500 line-through font-medium opacity-60">{OLD_PRICE}</span>
                                <span className="text-4xl md:text-6xl font-extrabold text-coffee-900 tracking-tighter">{PRICE}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckoutClick}
                            className="w-full bg-coffee-900 hover:bg-black text-white text-base md:text-lg font-bold py-3.5 md:py-4 rounded-xl shadow-xl hover:shadow-gold-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex flex-col items-center justify-center gap-0.5 group relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2 relative z-10">
                                <span>RESERVAR MI KIT PRO + REGALOS</span>
                                <ArrowRight size={20} className="text-gold-500" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-medium text-coffee-200 uppercase tracking-wider relative z-10">Pago Contraentrega • Envío Asegurado</span>
                            
                            <span className="absolute w-full h-full bg-white/5 top-0 left-0 animate-pulse"></span>
                        </button>
                        
                        <div className="mt-3 md:mt-4 pt-3 border-t border-coffee-100/50 text-[10px] md:text-xs text-coffee-500 font-medium text-center">
                            <p className="mb-1.5 font-bold">Pasarela de Pagos Segura:</p>
                            <div className="flex flex-wrap justify-center gap-2 opacity-90">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-200 flex items-center gap-1">
                                    <Banknote size={12} /> PAGO CONTRAENTREGA (Efectivo)
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

      {/* --- FAQ SECTION --- */}
      <section className="py-16 md:py-24 bg-coffee-50 border-t border-coffee-200 relative z-10">
         <div className="reveal fade-bottom">
            <FAQ />
         </div>
      </section>

      {/* --- FINAL CTA (LAST CHANCE) --- */}
      <section className="py-20 bg-coffee-900 relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                ¿Vas a seguir tomando café quemado?
            </h2>
            <p className="text-coffee-200 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                La oferta del Molino Gratis se acaba cuando el contador llegue a cero o se agote el stock. No digas que no te avisamos.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={handleCheckoutClick}
                    className="bg-gold-500 hover:bg-gold-600 text-white text-xl md:text-2xl font-black py-5 px-10 rounded-full shadow-2xl hover:shadow-gold-500/50 transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2 animate-pulse-slow"
                >
                    ¡QUIERO MI ESTACIÓN PRO + REGALOS! <ArrowRight size={28} strokeWidth={3} />
                </button>
                <p className="text-sm text-coffee-400 font-medium mt-2 sm:mt-0">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                    3 unidades restantes
                </p>
            </div>
        </div>
      </section>

      <footer className="bg-coffee-950 text-coffee-300 py-12 md:py-16 border-t border-coffee-900 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
                <span className="font-serif font-bold text-white text-3xl">Todopolis.</span>
                <p className="text-base mt-3 max-w-xs leading-relaxed opacity-70">Llevando la cultura del buen café a cada hogar colombiano 🇨🇴.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-base font-medium">
                <button onClick={() => setSelectedPolicy(POLICIES.privacy)} className="hover:text-gold-500 transition-colors">Privacidad</button>
                <button onClick={() => setSelectedPolicy(POLICIES.terms)} className="hover:text-gold-500 transition-colors">Términos</button>
                <button onClick={() => setSelectedPolicy(POLICIES.shipping)} className="hover:text-gold-500 transition-colors">Envíos</button>
                <button onClick={() => setSelectedPolicy(POLICIES.returns)} className="hover:text-gold-500 transition-colors">Garantía</button>
            </div>
        </div>
      </footer>
      
      {/* --- MODALS --- */}
      {selectedRecipe && (
         <RecipeModal 
             recipe={selectedRecipe} 
             onClose={() => setSelectedRecipe(null)} 
         />
      )}

      {selectedPolicy && (
         <PolicyModal 
             policy={selectedPolicy}
             onClose={() => setSelectedPolicy(null)}
         />
      )}

      {selectedImage && (
         <ImageModal
             src={selectedImage.src}
             alt={selectedImage.alt}
             onClose={() => setSelectedImage(null)}
         />
      )}

            <CheckoutDrawer
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                checkoutUrl={CHECKOUT_URL}
            />

            <ChatBot />

        </div>
    );
}
