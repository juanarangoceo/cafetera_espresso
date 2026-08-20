import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { PRODUCT } from '@/lib/product';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "¿Necesito experiencia para usarla?",
      answer: "No. Puedes comenzar con la guía incluida y ajustar la molienda, la cantidad de café y el tiempo de extracción según tu gusto. Como cualquier método de espresso, los resultados mejoran con unas pocas preparaciones de práctica."
    },
    {
      question: "¿Qué viene incluido en la caja?",
      answer: `Recibirás: ${PRODUCT.boxContents.join(', ')}.`
    },
    {
      question: "¿Cómo funciona la garantía y devoluciones?",
      answer: `${PRODUCT.name} cuenta con ${PRODUCT.warranty}, que cubre fallas de funcionamiento. Además tienes ${PRODUCT.withdrawalRight.toLowerCase()}. En cualquiera de los dos casos escríbenos a ${PRODUCT.supportEmail} y te orientamos con el proceso.`
    },
    {
      question: "¿Cuánto tarda el envío y cómo pago?",
      answer: `${PRODUCT.shipping} y normalmente tarda entre ${PRODUCT.deliveryEstimate}. Puedes pagar contraentrega al recibir tu pedido.`
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
