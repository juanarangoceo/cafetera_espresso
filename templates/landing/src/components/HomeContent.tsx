"use client";

import Image from "next/image";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  Check,
  CheckCircle2,
  Coffee,
  Droplets,
  Gift,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Truck,
  Wind,
} from "lucide-react";

import FAQ from "./FAQ";
import StickyMobileCTA from "./layout/StickyMobileCTA";
import VideoPlayer from "./VideoPlayer";
import { useLanding } from "@/context/LandingContext";
import { GALLERY_ITEMS, PRICE, RECIPES, TESTIMONIALS } from "@/lib/data";
import { SectionId } from "@/types";
import { PRODUCT } from "@/lib/product";

const BENEFITS = [
  { icon: Coffee, title: "Molienda fresca", text: "El molino incluido te permite moler justo antes de preparar cada taza." },
  { icon: Droplets, title: "Espresso con cuerpo", text: "Controla la dosis y la extracción para encontrar el sabor que prefieres." },
  { icon: Wind, title: "Leche texturizada", text: "Usa el vaporizador para preparar cappuccinos, lattes y bebidas frías." },
];

const STEPS = [
  { number: "01", title: "Muele", text: "Elige tu café y muele solo la cantidad que vas a usar." },
  { number: "02", title: "Extrae", text: "Dosifica, compacta y prepara uno o dos espressos." },
  { number: "03", title: "Crea", text: "Disfrútalo solo o añade leche texturizada para tu bebida favorita." },
];

const TECH_SPECS = [
  ["Potencia", PRODUCT.specifications.power],
  ["Preparaciones", PRODUCT.specifications.servings],
  ["Sistema", PRODUCT.specifications.system],
  ["Incluye", "Portafiltro, filtros y medidor"],
  ["Soporte", "Atención local en Colombia"],
  ["Garantía", PRODUCT.warranty],
];

export default function HomeContent() {
  const { openCheckout, openRecipe, openImage } = useLanding();

  return (
    <>
      <section className="border-y border-coffee-200 bg-white py-7">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-6 text-center md:grid-cols-4">
          {[
            [Truck, "Envío gratis", "A toda Colombia"],
            [Banknote, "Pago al recibir", "Compra con tranquilidad"],
            [ShieldCheck, "Garantía 3 meses", "Por funcionamiento"],
            [Gift, "Molino incluido", "Kit listo para empezar"],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof Truck;
            return (
              <div key={title as string} className="flex flex-col items-center gap-1.5 md:flex-row md:text-left">
                <ItemIcon className="h-5 w-5 text-gold-700" />
                <div><p className="text-sm font-bold text-coffee-950">{title as string}</p><p className="text-xs text-coffee-500">{text as string}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      <section id={SectionId.FEATURES} className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">El resultado importa</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-6xl">Una rutina sencilla. Un café que sí provoca repetir.</h2>
            <p className="mt-5 text-lg leading-8 text-coffee-600">No necesitas experiencia previa. El kit reúne las herramientas esenciales para aprender, ajustar y disfrutar el proceso.</p>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="mx-auto w-full max-w-sm">
              <VideoPlayer src="https://res.cloudinary.com/dohwyszdj/video/upload/v1766264202/video_reel_hcfoyo.mp4" />
              <p className="mt-4 text-center text-sm text-coffee-500">Mira una extracción real con Coffee Maker Pro.</p>
            </div>
            <div className="grid gap-4">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <article key={title} className="grid grid-cols-[auto_1fr] gap-5 rounded-3xl border border-coffee-100 bg-[#fbf8f4] p-6 md:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coffee-950 text-gold-400"><Icon className="h-6 w-6" /></span>
                  <div><h3 className="text-xl font-bold text-coffee-950">{title}</h3><p className="mt-2 leading-7 text-coffee-600">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roi" className="bg-[#e9dfd3] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">Cuentas claras</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-5xl">El kit se paga solo en tres meses.</h2>
            <p className="mt-5 text-lg leading-8 text-coffee-600">Un cappuccino en la calle cuesta casi cinco veces lo que cuesta prepararlo en tu cocina. Esta es la cuenta, con el mismo café y la misma frecuencia en los dos lados.</p>
          </div>

          <div className="grid overflow-hidden rounded-[2rem] border border-coffee-100 bg-[#f7f3ee] shadow-[0_24px_70px_rgba(47,27,23,0.12)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative border-b border-dashed border-coffee-300 p-6 md:p-10 lg:border-b-0 lg:border-r">
              <div className="mx-auto max-w-sm rotate-[-0.6deg] bg-white px-6 pb-9 pt-7 font-mono text-sm text-coffee-800 shadow-lg md:px-8">
                <div className="border-b border-dashed border-coffee-300 pb-5 text-center">
                  <Coffee className="mx-auto mb-3 h-7 w-7 text-coffee-900" />
                  <p className="font-bold uppercase tracking-[0.18em]">Tu cafetería de siempre</p>
                  <p className="mt-1 text-[11px] text-coffee-500">Ejemplo de consumo · Colombia</p>
                </div>

                <div className="space-y-3 border-b border-dashed border-coffee-300 py-5">
                  <div className="flex justify-between gap-4"><span>1 Cappuccino</span><span>$12.000</span></div>
                  <div className="flex justify-between gap-4"><span>4 por semana</span><span>$48.000</span></div>
                  <div className="flex justify-between gap-4 text-coffee-500"><span>52 semanas</span><span>× 52</span></div>
                </div>

                <div className="py-5">
                  <div className="flex items-end justify-between gap-4 font-bold"><span>TOTAL AL AÑO</span><span className="text-xl">$2.496.000</span></div>
                  <p className="mt-2 text-[11px] leading-4 text-coffee-500">No incluye transporte, propinas ni acompañamientos.</p>
                </div>

                <div className="rounded-lg bg-[#f9eee9] p-4 text-center text-red-700">
                  <p className="text-sm font-bold leading-5">Casi 5 veces más caro que prepararlo en casa</p>
                </div>

                <div className="absolute inset-x-6 bottom-5 h-3 bg-[#f7f3ee] md:inset-x-10" style={{ clipPath: "polygon(0 0, 4% 100%, 8% 0, 12% 100%, 16% 0, 20% 100%, 24% 0, 28% 100%, 32% 0, 36% 100%, 40% 0, 44% 100%, 48% 0, 52% 100%, 56% 0, 60% 100%, 64% 0, 68% 100%, 72% 0, 76% 100%, 80% 0, 84% 100%, 88% 0, 92% 100%, 96% 0, 100% 100%)" }} />
              </div>
            </div>

            <div className="relative flex flex-col justify-center overflow-hidden bg-coffee-950 p-5 text-white sm:p-7 md:p-12">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">En tu cocina</p>
                <h3 className="mt-4 font-serif text-3xl font-semibold md:text-4xl">Ahí pagas cada taza. Aquí pagas una vez, y la máquina es tuya.</h3>

                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
                  <div className="bg-coffee-950 p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase leading-4 tracking-wider text-coffee-400 sm:text-[11px]">Afuera, cada taza</p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-coffee-400 line-through decoration-red-400/80 decoration-2 sm:text-3xl">$12.000</p>
                  </div>
                  <div className="bg-coffee-950 p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase leading-4 tracking-wider text-gold-400 sm:text-[11px]">En tu cocina</p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-gold-400 sm:text-3xl">$2.500</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gold-400/20 bg-white/5 p-6">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-coffee-300">La máquina se paga sola en</p>
                      <p className="mt-2 font-serif text-5xl font-bold tracking-tight text-gold-400 md:text-6xl">3 meses</p>
                      <p className="mt-3 text-sm leading-6 text-coffee-200">Te ahorras unos <strong className="text-white">$164.000 al mes</strong>. Pasado ese punto, el kit ya se pagó y lo que sigue queda a tu favor.</p>
                    </div>
                    <Sparkles className="hidden h-8 w-8 shrink-0 text-gold-400 sm:block" />
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm leading-6 text-coffee-100">
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> El segundo café del día deja de ser un gasto extra.</li>
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> A la hora que quieras, sin filas ni domicilios.</li>
                  <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> Tú eliges el grano, la molienda y el punto de la leche.</li>
                </ul>

                <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-white/5 px-5 py-4">
                  <span className="text-sm leading-5 text-coffee-200">En un año, preparándolo en casa</span>
                  <span className="shrink-0 text-right"><span className="font-mono text-lg font-bold text-white">$520.000</span><span className="block text-[11px] text-coffee-400">frente a $2.496.000</span></span>
                </div>

                <button onClick={openCheckout} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 px-6 py-4 text-base font-bold text-coffee-950 transition-colors hover:bg-gold-300">
                  Quiero mi kit por {PRICE} <ArrowRight className="h-5 w-5" />
                </button>
                <p className="mt-3 text-center text-xs text-coffee-200">{PRODUCT.shipping} · {PRODUCT.paymentMethod}</p>

                <p className="mt-5 text-xs leading-5 text-coffee-300">Ejemplo ilustrativo calculado con 18 g de café y leche por preparación. El costo real cambia según los ingredientes, el precio de tu cafetería y la frecuencia de consumo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recipes" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">Tu menú, a tu manera</p>
              <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-5xl">Mucho más que un espresso.</h2>
            </div>
            <p className="max-w-md leading-7 text-coffee-600">Experimenta con café colombiano, distintos tipos de leche y preparaciones para cada momento del día.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RECIPES.map((recipe) => (
              <button key={recipe.id} onClick={() => openRecipe(recipe)} className="group overflow-hidden rounded-3xl border border-coffee-100 bg-white text-left shadow-sm transition-transform hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={recipe.image} alt={recipe.title} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5"><h3 className="text-lg font-bold text-coffee-950">{recipe.title}</h3><p className="mt-1 text-sm text-coffee-500">{recipe.subtitle}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gold-700">Ver preparación <ArrowRight className="h-4 w-4" /></span></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-coffee-950 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">Del grano a la taza</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">Tres pasos para empezar.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
            {STEPS.map((step) => (
              <article key={step.number} className="bg-coffee-950 p-8 md:p-10">
                <span className="font-mono text-sm text-gold-400">{step.number}</span>
                <h3 className="mt-8 font-serif text-3xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-7 text-coffee-200">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 gap-4">
            {GALLERY_ITEMS.map((item) => (
              <button key={item.id} onClick={() => openImage(item.image, item.title)} className="group relative aspect-square overflow-hidden rounded-3xl bg-coffee-100 text-left">
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-12 text-white sm:p-5 sm:pt-20">
                  <span className="block text-[13px] font-bold leading-4 sm:text-sm">{item.title}</span>
                  <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-white/80 sm:line-clamp-none sm:text-xs sm:leading-5">{item.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">Conoce tu máquina</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-5xl">Lo esencial, explicado con claridad.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-coffee-600">Una estación doméstica pensada para preparar espresso y bebidas con leche sin ocupar el espacio de un equipo industrial.</p>
            <dl className="mt-9 divide-y divide-coffee-100 border-y border-coffee-100">
              {TECH_SPECS.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[0.8fr_1.2fr] gap-4 py-4 text-sm"><dt className="text-coffee-500">{label}</dt><dd className="font-semibold text-coffee-950">{value}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-[#f3eee7] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">Experiencias de clientes</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-5xl">Lo que cambia cuando preparas tu propio café.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure key={testimonial.id} className="rounded-3xl border border-coffee-100 bg-white p-7 shadow-sm">
                <div className="mb-5 flex gap-1 text-gold-600" aria-label="5 de 5 estrellas">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="leading-7 text-coffee-700">“{testimonial.text}”</blockquote>
                <figcaption className="mt-6 border-t border-coffee-100 pt-5"><p className="font-bold text-coffee-950">{testimonial.name}</p><p className="text-sm text-coffee-500">{testimonial.location} · {testimonial.highlight}</p></figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-coffee-500">Testimonios compartidos por clientes. Los resultados pueden variar según el café, la molienda y la preparación.</p>
          <div className="mt-8 text-center">
            <button onClick={openCheckout} className="inline-flex items-center gap-2 rounded-full border border-coffee-300 bg-white px-6 py-3 text-sm font-bold text-coffee-950 transition-colors hover:border-gold-500 hover:text-gold-700">Conocer el kit completo <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section id={SectionId.BONUS} className="scroll-mt-24 overflow-hidden bg-coffee-950 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">El kit completo</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">La máquina inicia la rutina. El kit te ayuda a dominarla.</h2>
            <p className="mt-5 text-lg leading-8 text-coffee-200">Recibes todo lo necesario para pasar del grano a la taza desde el primer día, sin tener que buscar cada pieza por separado.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white to-[#e7ddd2] p-7 text-coffee-950 md:p-10">
              <div className="relative z-10 max-w-sm">
                <span className="inline-flex rounded-full bg-coffee-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">Producto principal</span>
                <h3 className="mt-5 font-serif text-4xl font-semibold">Coffee Maker Pro</h3>
                <p className="mt-3 leading-7 text-coffee-600">Prepara uno o dos espressos y utiliza el vaporizador para crear cappuccinos y lattes en casa.</p>
              </div>
              <div className="absolute inset-x-4 bottom-0 top-48 md:left-40 md:top-24">
                <Image src="/images/hero-mobile.webp" alt="Máquina Coffee Maker Pro incluida en el kit" fill sizes="(max-width: 1024px) 90vw, 48vw" className="object-contain object-bottom mix-blend-multiply" />
              </div>
              <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur md:bottom-8 md:left-8"><Check className="h-4 w-4 text-gold-700" /> Accesorios de preparación incluidos</div>
            </article>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <article className="grid min-h-[250px] grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">Incluido con tu compra</span>
                  <h3 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">Molino eléctrico</h3>
                  <p className="mt-3 text-sm leading-6 text-coffee-200">Muele justo antes de preparar para conservar mejor el aroma del café.</p>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gold-400 px-3 py-1.5 text-xs font-bold text-coffee-950"><Gift className="h-3.5 w-3.5" /> Incluido</span>
                </div>
                <div className="relative bg-[#eee7de]">
                  <Image src="/product/molino_cafe_electrico_raf.jpg" alt="Molino eléctrico incluido" fill sizes="(max-width: 640px) 45vw, 22vw" className="object-contain p-3 mix-blend-multiply" />
                </div>
              </article>

              <article className="grid min-h-[250px] grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[2rem] border border-white/10 bg-[#5f3b31]">
                <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">Aprende a tu ritmo</span>
                  <h3 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">Guía de preparación</h3>
                  <p className="mt-3 text-sm leading-6 text-coffee-100">Una referencia práctica para ajustar molienda, dosis y leche desde tus primeras tazas.</p>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"><BookOpen className="h-3.5 w-3.5" /> Formato digital</span>
                </div>
                <div className="relative m-4 overflow-hidden rounded-2xl">
                  <Image src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop" alt="Guía digital de preparación de café" fill sizes="(max-width: 640px) 40vw, 20vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/60 to-transparent" />
                </div>
              </article>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 sm:flex-row md:px-8">
            <div><p className="font-serif text-xl font-semibold">Máquina + molino + guía + accesorios</p><p className="mt-1 text-sm text-coffee-300">Un solo kit, listo para comenzar.</p></div>
            <button onClick={openCheckout} className="flex shrink-0 items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-coffee-950 transition-colors hover:bg-gold-300">Ver el kit por {PRICE} <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section id={SectionId.PRICING} className="scroll-mt-20 bg-[#e9dfd3] py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">Tu kit de inicio</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-coffee-950 md:text-6xl">Todo lo necesario para tu primera taza.</h2>
            <div className="mt-8 space-y-4">
              {[...PRODUCT.includes, PRODUCT.shipping, PRODUCT.warranty].map((item) => <div key={item} className="flex items-center gap-3 font-medium text-coffee-800"><CheckCircle2 className="h-5 w-5 text-gold-700" /> {item}</div>)}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_30px_80px_rgba(47,27,23,0.16)] md:p-10">
            <div className="flex items-start justify-between gap-4 border-b border-coffee-100 pb-6"><div><p className="text-sm font-bold uppercase tracking-wider text-coffee-500">Coffee Maker Pro</p><p className="mt-1 font-serif text-2xl font-semibold text-coffee-950">Kit completo</p></div><Sparkles className="h-7 w-7 text-gold-600" /></div>
            <div className="py-8 text-center"><p className="text-sm font-semibold uppercase tracking-wider text-coffee-500">Precio final del kit</p><p className="mt-1 text-5xl font-extrabold tracking-tight text-coffee-950 sm:text-6xl">{PRICE}</p><p className="mt-2 text-sm font-semibold text-green-700">Envío incluido · Paga al recibir</p></div>
            <button onClick={openCheckout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coffee-950 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-coffee-800">Quiero mi Coffee Maker Pro <ArrowRight className="h-5 w-5 text-gold-400" /></button>
            <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-coffee-500"><ShieldCheck className="h-4 w-4 text-green-700" /> Tus datos se usan únicamente para gestionar el pedido.</div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28"><FAQ /></section>
      <StickyMobileCTA />
    </>
  );
}
