import Image from "next/image";
import { Banknote, Check, ShieldCheck, Truck } from "lucide-react";

import HeroActions from "@/components/sections/HeroActions";
import HomeContent from "@/components/HomeContent";
import { PRICE } from "@/lib/data";
import { SectionId } from "@/types";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f3ed] pb-24 text-coffee-950 md:pb-0">
      <section
        id={SectionId.HERO}
        className="relative isolate overflow-hidden bg-[#f3eee6] pb-16 pt-28 lg:min-h-[820px] lg:pb-24 lg:pt-40"
      >
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_30%,rgba(204,151,16,0.14),transparent_32%),linear-gradient(135deg,#fbf8f3_0%,#eee4d8_100%)]" />
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[46%] bg-coffee-950 lg:block" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-gold-700">
              Espresso en casa · Kit completo
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-coffee-950 sm:text-6xl lg:text-7xl">
              Café con calidad de cafetería,
              <span className="mt-2 block text-gold-700">hecho por ti.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-coffee-700 lg:mx-0 lg:text-xl">
              Prepara espresso, cappuccino y latte en minutos. Coffee Maker Pro reúne la máquina, el molino y la guía que necesitas para empezar con confianza.
            </p>

            <HeroActions />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-coffee-700 lg:justify-start">
              <span>{PRICE}</span>
              <span className="h-1 w-1 rounded-full bg-coffee-300" />
              <span>Molino incluido</span>
              <span className="h-1 w-1 rounded-full bg-coffee-300" />
              <span>Pago al recibir</span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-coffee-200 pt-6 text-left text-xs text-coffee-600 sm:text-sm">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold-700" /> Envío gratis</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold-700" /> Garantía 3 meses</div>
              <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-gold-700" /> Contraentrega</div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/5] max-w-[590px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-[#e9e1d8] shadow-[0_30px_90px_rgba(31,19,15,0.25)] lg:rounded-[2.5rem]">
              <div className="absolute inset-x-8 bottom-10 top-8">
                <Image
                  src="/images/hero-mobile.webp"
                  alt="Coffee Maker Pro preparando un espresso"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 46vw"
                  className="object-contain object-center mix-blend-multiply"
                />
              </div>
              <div className="absolute bottom-5 left-5 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-bold text-coffee-900 shadow-sm backdrop-blur">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-gold-700" /> Lista para tu primera extracción</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeContent />
    </main>
  );
}
