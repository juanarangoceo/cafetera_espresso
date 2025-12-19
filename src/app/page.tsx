import React from 'react';
import Image from 'next/image';
import { Gift, CheckCircle2, AlertTriangle, TimerReset, Gauge, Flame, Maximize2, Settings, Zap, ArrowRight, MonitorPlay, GraduationCap, Check, Sparkles } from 'lucide-react';
import { SectionId } from '../types';
import { TESTIMONIALS, PRODUCT_IMAGES, GALLERY_ITEMS } from '../data/content';

// Client Components
import Navbar from '../components/Navbar';
import HeroCTA from '../components/HeroCTA';
import StickyMobileCTA from '../components/StickyMobileCTA';
import RecipeGallery from '../components/RecipeGallery';
import ChatBot from '../components/ChatBot';
import Countdown from '../components/Countdown';
import FAQ from '../components/FAQ';
import VideoPlayer from '../components/VideoPlayer';
import { HotspotSection } from '../components/HotspotSection';
import Footer from '../components/Footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-coffee-50 text-coffee-900 font-sans antialiased overflow-x-hidden selection:bg-gold-200 selection:text-coffee-900 pb-24 md:pb-0">

            <Navbar />
            <StickyMobileCTA />

            {/* --- HERO SECTION (SERVER RENDERED FOR LCP) --- */}
            <section id={SectionId.HERO} className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-noise">
                {/* Decorative Backgrounds - Server Rendered Static */}
                <div className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-gradient-to-br from-gold-100/40 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/3 translate-x-1/3 z-0"></div>
                <div className="absolute bottom-0 left-0 w-[400px] lg:w-[700px] h-[400px] lg:h-[700px] bg-coffee-100/30 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4 z-0"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                    <div className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 bg-gold-500 text-white px-5 py-2 rounded-full shadow-lg shadow-gold-500/30 mx-auto lg:mx-0 transform hover:scale-105 transition-transform cursor-pointer">
                            <Gift size={18} fill="white" />
                            <span className="text-sm font-bold tracking-widest uppercase">Oferta Flash Activa</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-coffee-900 leading-[1.1] tracking-tight drop-shadow-sm">
                            El café perfecto<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400 relative italic pr-2">
                                exige molienda fresca.
                                <svg className="absolute w-full h-2 lg:h-3 -bottom-1 left-0 text-gold-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-coffee-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                            La máquina te da la presión (20 Bares), pero el molino te da el sabor. Llévate hoy el <span className="font-bold text-coffee-800">Kit Barista Completo</span> y deja de tomar café oxidado.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <HeroCTA />
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

             {/* --- SECTION: GIFT NOTIFICATION BAR --- */}
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
                        {/* Note: scrollToSection not available in server component, but we have ID links in Footer or internal links. 
                            For this simple button, we can remove it or make it a simple <a> tag anchor link */}
                         <a href={`#${SectionId.BONUS}`} className="hidden md:flex bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors items-center gap-2 border border-white/20">
                            Ver Detalles <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: THE PROBLEM / SOLUTION --- */}
            <section id={SectionId.FEATURES} className="relative bg-white border-t border-coffee-100 py-16 md:py-24 overflow-hidden min-h-[500px]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12 md:mb-16 flex flex-col justify-center">
                        <div className="inline-block min-h-[36px]"><span className="text-gold-600 font-bold tracking-[0.2em] text-sm uppercase bg-coffee-50 border border-gold-200 px-5 py-2 rounded-full shadow-sm leading-none">La Verdad Incómoda</span></div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mt-6 leading-tight min-h-[1.1em]">
                            Tu café casero sabe mal<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coffee-600 to-coffee-400">por estas 3 razones.</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 md:gap-20 items-center">
                        <div>
                            <VideoPlayer />
                            <p className="text-center text-sm text-coffee-400 mt-4 italic">Mira la extracción real a 20 Bares con Coffee Maker Pro</p>
                        </div>

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
                                        <h3 className="text-xl md:text-2xl font-bold text-coffee-900 mb-3">3. Temperatura Inestable</h3>
                                        <p className="text-coffee-700 leading-relaxed text-base md:text-lg">
                                            <span className="font-bold text-red-500">Lo que haces mal:</span> Agua hirviendo (quema) o tibia (ácida).<br />
                                            <span className="font-bold text-green-600">La Solución:</span> Tecnología <strong className="text-coffee-900">ThermoBlock</strong>. Calienta el agua a 92°C exactos en 25 segundos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* --- PRODUCT PHOTOGRAPHY GALLERY --- */}
             <section className="py-16 md:py-24 bg-coffee-950 text-white relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-12 gap-6 reveal fade-bottom">
                        <div>
                            <span className="text-gold-500 font-bold tracking-widest text-sm uppercase mb-2 block">ADN Italiano 🇮🇹</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">Más que una máquina,<br /><span className="text-coffee-200">una escultura.</span></h2>
                        </div>
                        <p className="text-coffee-200 max-w-sm text-base md:text-lg hidden md:block leading-relaxed opacity-90">
                            Construida en acero inoxidable 304 de grado quirúrgico. Pesada, robusta y diseñada para durar décadas, no años.
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px] reveal zoom-in">
                        {PRODUCT_IMAGES.map((img, idx) => (
                            <div key={idx} className={`relative rounded-2xl overflow-hidden group ${img.span} border border-white/5 shadow-2xl bg-coffee-900 aspect-[4/5] md:aspect-auto`}>
                                <Image
                                    src={img.src}
                                    alt={img.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white text-xl md:text-2xl font-serif font-bold mb-1">{img.title}</h3>
                                    <p className="text-coffee-200 text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{img.desc}</p>
                                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} className="text-gold-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- RESULTS (RECIPES) - Client Component --- */}
            <RecipeGallery />

            {/* --- GIFT 1: PREMIUM HARDWARE --- */}
            <section id={SectionId.BONUS} className="py-20 md:py-32 bg-coffee-950 relative overflow-hidden text-white border-t border-coffee-800">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-gold-500/20 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">

                        {/* Text Content */}
                        <div className="order-2 lg:order-1 reveal fade-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-bold uppercase tracking-widest mb-6">
                                <Gift size={14} /> Regalo Exclusivo #1
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

                                {/* Floating Badge */}
                                <div className="absolute -bottom-6 -left-6 bg-gold-500 text-coffee-950 p-6 rounded-2xl shadow-xl animate-float">
                                    <Sparkles size={32} className="mb-2" />
                                    <p className="font-bold text-3xl leading-none">100%</p>
                                    <p className="text-xs font-bold uppercase tracking-wider">Bonificado</p>
                                </div>
                            </div>
                            {/* Back Glow */}
                            <div className="absolute inset-0 bg-gold-600 blur-[80px] opacity-20 -z-10 rounded-full"></div>
                        </div>

                    </div>
                </div>
            </section>

             {/* --- GIFT 2: E-BOOK --- */}
             <section className="py-20 bg-coffee-50 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 reveal fade-bottom">
                        <span className="text-gold-600 font-bold tracking-[0.2em] text-sm uppercase">Regalo #2: Academia Digital</span>
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

            <HotspotSection />

             {/* --- VISUAL GALLERY --- */}
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
                                style={{ aspectRatio: '3/4' }}
                            >
                                <div className="absolute inset-0 bg-coffee-900">
                                    <Image src={item.image} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-90" alt={item.title} />
                                </div>

                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity`}></div>

                                {/* Top Icon */}
                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-full text-gold-400 group-hover:bg-gold-500 group-hover:text-white transition-colors duration-300 border border-white/10">
                                    {/* Icon is component */}
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white font-serif font-bold text-xl mb-2 leading-tight">{item.title}</h3>
                                    <p className="text-coffee-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SOCIAL PROOF (TESTIMONIALS) --- */}
            <section className="py-20 bg-coffee-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-gold-600 font-bold tracking-[0.2em] text-sm uppercase">Comunidad 3.000+</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mt-3">Ellos ya son sus propios baristas</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-lg border border-coffee-100 relative group hover:border-gold-300 transition-colors">
                                <div className="absolute -top-6 left-8">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                                            <Image src={testimonial.image} fill className="object-cover" alt={testimonial.name} />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {testimonial.highlight}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.stars)].map((_, i) => (
                                            <Star key={i} size={14} className="text-gold-500 fill-gold-500" />
                                        ))}
                                    </div>
                                    <p className="text-coffee-700 italic mb-6 leading-relaxed">"{testimonial.text}"</p>
                                    <div>
                                        <p className="font-bold text-coffee-900">{testimonial.name}</p>
                                        <p className="text-xs text-coffee-400 font-bold uppercase tracking-wider">{testimonial.location} • {testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            <section className="py-20 bg-white">
                <FAQ />
            </section>

            <section className="py-12 bg-coffee-900 border-t border-coffee-800">
                 <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-gold-400 font-serif font-bold text-3xl mb-4">Oferta Relámpago</h3>
                    <p className="text-white/80 mb-6">El molino de regalo se agota rápido. Asegura tu kit ahora.</p>
                    <Countdown />
                    <div className="mt-8 flex justify-center">
                         <HeroCTA />
                    </div>
                 </div>
            </section>
            
            <Footer />
            <ChatBot />

        </div>
    );
}

function Star({ size, className, fill }: { size: number, className?: string, fill?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    )
}
