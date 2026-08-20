"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Menu, X, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanding } from "@/context/LandingContext";
import { NAV_LINKS } from "@/lib/data";
import { SectionId } from "@/types";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCheckout } = useLanding();

  // El portal del comprador vive en la plataforma, no en esta landing: leer la
  // sesión aquí exigiría credenciales de Supabase en el navegador, que es
  // justamente lo que este proyecto no tiene. Si la variable no está definida,
  // el enlace no se muestra en vez de llevar a una ruta inexistente.
  const portalUrl = process.env.NEXT_PUBLIC_NITRO_PORTAL_URL?.trim();

  // Detectar ruta actual
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

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
      // Desde cualquier otra ruta, volver al home y ubicar la sección.
      router.push(`/#${id}`);
    }
  };

  const navPosition = isScrolled ? "pt-2" : "pt-3 lg:pt-5";

  return (
    <>
      <nav
        className={`fixed left-0 top-0 z-50 w-full px-3 transition-all duration-300 ease-in-out lg:px-6 ${navPosition}`}
      >
        <div className={`mx-auto flex min-h-[64px] max-w-7xl items-center justify-between rounded-2xl border border-white/70 bg-white/95 px-4 backdrop-blur-xl transition-shadow duration-300 lg:rounded-full lg:px-6 ${isScrolled ? "shadow-[0_14px_40px_rgba(47,27,23,0.16)]" : "shadow-[0_10px_30px_rgba(47,27,23,0.10)]"}`}>
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-coffee-950 text-gold-400 transition-colors duration-300 md:h-10 md:w-10"
            >
              <Coffee size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <div
                className="font-serif text-xl font-black leading-none tracking-tight text-coffee-950 transition-colors duration-300 md:text-2xl"
              >
                Coffee Maker <span className="text-gold-500">Pro</span>
              </div>
              <span
                className={`text-[9px] md:text-[10px] tracking-widest uppercase font-bold text-coffee-600 hidden sm:block`}
              >
                Tienda Oficial
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-5 lg:flex xl:gap-7">
            {NAV_LINKS.map((link: any) =>
              link.href ? (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs font-bold uppercase tracking-[0.08em] text-coffee-700 transition-colors hover:text-gold-700"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.id)}
                  className="text-xs font-bold uppercase tracking-[0.08em] text-coffee-700 transition-colors hover:text-gold-700"
                >
                  {link.name}
                </button>
              )
            )}

            {portalUrl && (
              <a
                href={portalUrl}
                className="rounded-full p-2 text-coffee-600 transition-colors hover:bg-coffee-50 hover:text-coffee-950"
                title="Consultar mi pedido"
                aria-label="Consultar mi pedido"
              >
                <User size={20} />
              </a>
            )}

            <button
              onClick={() => handleNavigation(SectionId.PRICING)}
              className="flex items-center gap-2 rounded-full bg-coffee-950 px-5 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-coffee-800"
            >
              COMPRAR AHORA
            </button>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            {portalUrl && (
              <a
                href={portalUrl}
                className="rounded-full p-2 text-coffee-700 transition-colors hover:bg-coffee-50"
                aria-label="Consultar mi pedido"
              >
                <User size={20} />
              </a>
            )}
            <button
              className="z-50 rounded-xl bg-coffee-950 p-2 text-white shadow-sm transition-colors active:bg-coffee-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col gap-8 overflow-y-auto bg-white/98 px-8 pt-28 backdrop-blur-xl animate-fade-in-up lg:hidden">
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
              Máquina, molino y guía incluidos.
            </p>
            <button
              onClick={openCheckout}
              className="w-full bg-gold-500 text-white py-4 rounded-xl font-bold text-xl shadow-xl flex justify-center items-center gap-2"
            >
              Quiero mi Coffee Maker Pro <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
