import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "¿Qué diferencia hay entre 15 y 20 bares?",
      answer: "La gran diferencia está en la extracción. Coffee Maker Pro utiliza 20 bares (5 más que el estándar del mercado), lo que garantiza una presión superior para extraer todos los aceites esenciales del grano. El resultado es un espresso con más cuerpo, un aroma más intenso y esa crema dorada y espesa que caracteriza al café de especialidad."
    },
    {
      question: "¿Qué viene incluido en la caja?",
      answer: "Tu experiencia barista está completa desde el día uno. Recibirás: 1x Máquina Coffee Maker Pro 850W, 1x Mango portafiltro profesional, 1x Filtro sencillo (1 taza), 1x Filtro doble (2 tazas), 1x Cuchara medidora con compactador (tamper) y el manual de uso."
    },
    {
      question: "¿Cómo funciona la garantía y devoluciones?",
      answer: "Comprando en Todopolis tienes doble respaldo: 30 días de Garantía de Satisfacción (si no te enamora, la devuelves) y 3 meses de Garantía Técnica directa por cualquier defecto de fabricación. Tu inversión está 100% protegida."
    },
    {
      question: "¿Cuánto tarda el envío y cómo pago?",
      answer: "El envío es GRATIS a todo el país y tarda entre 2 a 5 días hábiles con transportadoras certificadas (Servientrega, Envia, Interrapidisimo). Lo mejor es que manejamos Pago Contraentrega: no pagas nada hasta que recibes el producto en la puerta de tu casa."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h2 className="text-3xl font-serif font-bold text-coffee-900 text-center mb-10">
        Preguntas Frecuentes
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-xl bg-white overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-gold-500 shadow-md ring-1 ring-gold-500/20' : 'border-coffee-100 hover:border-gold-200'}`}
          >
            <button
              className="w-full flex justify-between items-center p-5 text-left bg-white transition-colors focus:outline-none"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className={`font-bold text-lg pr-4 font-serif transition-colors ${openIndex === index ? 'text-coffee-900' : 'text-coffee-700'}`}>{faq.question}</span>
              <div className={`p-1 rounded-full transition-colors ${openIndex === index ? 'bg-gold-100 text-gold-600' : 'bg-coffee-50 text-coffee-400'}`}>
                 {openIndex === index ? <Minus size={18} /> : <Plus size={18} />}
              </div>
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                openIndex === index ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-5 pt-0 text-coffee-600 leading-relaxed text-sm md:text-base border-t border-transparent">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;