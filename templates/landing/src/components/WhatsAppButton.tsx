"use client";

import { useState } from 'react';

type Props = {
  /** Número en formato internacional, solo dígitos. La base ya lo restringe. */
  phone: string;
  message: string;
  /**
   * Si el chat está encendido ocupa la esquina inferior derecha, así que el
   * botón se apila encima. Si está apagado, baja a esa posición en vez de
   * dejar un hueco.
   */
  stacked: boolean;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export default function WhatsAppButton({ phone, message, stacked }: Props) {
  const [showLabel, setShowLabel] = useState(false);

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const position = stacked
    ? 'bottom-40 right-4 md:bottom-28 md:right-8'
    : 'bottom-24 right-4 md:bottom-8 md:right-8';

  // El clic es la conversión de este canal: sin registrarlo no hay forma de
  // saber qué pauta lo genera. Ambas herramientas ya están declaradas en la
  // política de privacidad; las comprobaciones evitan romper si no cargaron.
  const trackContact = () => {
    try {
      window.fbq?.('track', 'Contact', { content_name: 'whatsapp_boton_flotante' });
      window.gtag?.('event', 'contacto_whatsapp', { method: 'boton_flotante' });
    } catch {
      // Que falle la analítica no puede impedir que se abra la conversación.
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackContact}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onFocus={() => setShowLabel(true)}
      onBlur={() => setShowLabel(false)}
      aria-label="Escribir por WhatsApp"
      className={`fixed ${position} z-50 flex items-center gap-3 rounded-full bg-[#25D366] p-3 text-white shadow-2xl shadow-[#25D366]/30 transition-all duration-300 hover:scale-105 hover:bg-[#1ebe5b] active:scale-95 md:p-4`}
    >
      {/* lucide-react ya no incluye marcas, así que el glifo va en línea. */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
      </svg>

      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 ${
          showLabel ? 'max-w-[10rem] pr-1 opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        Escríbenos
      </span>
    </a>
  );
}
