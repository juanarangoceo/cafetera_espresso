"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanding } from "@/context/LandingContext";
import { NAV_LINKS } from "@/lib/data";
import { SectionId } from "@/types";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCheckout } = useLanding();

  // Detectar ruta actual
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const isBlogPage = pathname?.startsWith("/blog") || false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    // Inicializar estado de scroll al montar
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lógica de navegación inteligente
  const handleNavigation = (id: string) => {
    setMobileMenuOpen(false);

    if (isHomePage) {
      // Si estamos en home, scroll suave
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      // Si estamos en blog, ir al home
      router.push(`/#${id}`);
    }
  };

  // Forzar fondo blanco si NO estamos en home - asegurar visibilidad siempre
  // En páginas de blog, siempre mostrar fondo blanco desde el inicio
  const navBackground =
    isScrolled || !isHomePage || isBlogPage
      ? "bg-white/95 backdrop-blur-xl shadow-sm py-3"
      : "bg-transparent py-4 md:py-8";

  const textColor =
    isScrolled || !isHomePage || isBlogPage
      ? "text-coffee-900"
      : "text-coffee-900 lg:text-coffee-900";
  const logoBg =
    isScrolled || !isHomePage || isBlogPage
      ? "bg-coffee-900 text-gold-500"
      : "bg-white text-coffee-900 shadow-lg";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${navBackground}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center min-h-[64px]">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${logoBg}`}
            >
              <Coffee size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <div
                className={`text-xl md:text-2xl font-serif font-black tracking-tight leading-none transition-colors duration-300 ${textColor}`}
              >
                CoffeeMaker<span className="text-gold-500">Pro</span>
              </div>
              <span
                className={`text-[9px] md:text-[10px] tracking-widest uppercase font-bold text-coffee-600 hidden sm:block`}
              >
                Tienda Oficial
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link: any) =>
              link.href ? (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-base font-bold uppercase tracking-wide hover:text-gold-600 transition-colors text-coffee-800"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.id)}
                  className="text-base font-bold uppercase tracking-wide hover:text-gold-600 transition-colors text-coffee-800"
                >
                  {link.name}
                </button>
              )
            )}
            <button
              onClick={() => handleNavigation(SectionId.PRICING)}
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
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/98 backdrop-blur-xl flex flex-col pt-28 px-8 gap-8 animate-fade-in-up overflow-y-auto">
          {NAV_LINKS.map((link: any) =>
            link.href ? (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-serif font-bold text-coffee-900 text-left border-b-2 border-transparent hover:border-gold-500 pb-2 active:text-gold-600 transition-all"
              >
                {link.name}
              </Link>
            ) : (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.id)}
                className="text-3xl font-serif font-bold text-coffee-900 text-left border-b-2 border-transparent hover:border-gold-500 pb-2 active:text-gold-600 transition-all"
              >
                {link.name}
              </button>
            )
          )}

          {!isHomePage && (
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-3xl font-serif font-bold text-gold-600 text-left pb-2"
            >
              Volver al Inicio
            </Link>
          )}

          <div className="mt-auto mb-12 space-y-4">
            <p className="text-coffee-400 text-base text-center">
              Incluye Molino Gratis por tiempo limitado.
            </p>
            <button
              onClick={openCheckout}
              className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold text-xl shadow-xl flex justify-center items-center gap-2"
            >
              ¡Quiero mi Kit! <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
