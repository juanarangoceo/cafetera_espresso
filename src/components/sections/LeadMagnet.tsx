'use client';

import React from 'react'; // Fixed import
import { useFormState, useFormStatus } from 'react-dom'; // Fixed hook import
import { Mail, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { subscribeToMasterclass } from '@/app/actions/leads'; // Fixed import path

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
    >
      {pending ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Enviando...
        </>
      ) : (
        <>
          <BookOpen size={20} />
          ¡Quiero la Guía!
        </>
      )}
    </button>
  );
}

export default function LeadMagnet() {
  const [state, formAction] = useFormState(subscribeToMasterclass, initialState);

  return (
    <section className="bg-coffee-900 text-white py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-coffee-800/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        
        {/* Content Side */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 bg-coffee-800/50 px-3 py-1 rounded-full text-gold-400 text-sm font-semibold border border-coffee-700">
            <Lock size={14} />
            <span>Contenido Exclusivo</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Descarga nuestra Masterclass <span className="text-gold-500">'Barista en Casa'</span> gratis
          </h2>
          
          <p className="text-coffee-200 text-lg">
            Aprende los 3 secretos para calibrar tu molino y extraer el espresso perfecto. Oferta válida solo por hoy.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-coffee-300 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Cero Spam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-500" />
              <span>Acceso Inmediato</span>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-auto md:min-w-[400px]">
          <div className="bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl">
            {state.success ? (
              <div className="text-center py-6 animate-fade-in">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">¡Enviado con Éxito!</h3>
                <p className="text-coffee-200">{state.message}</p>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="sr-only">Tu correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400" size={20} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Tu mejor correo electrónico"
                      required
                      className="w-full bg-white/90 text-coffee-900 placeholder:text-coffee-500 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <SubmitButton />

                {state.message && !state.success && (
                  <p className="text-red-400 text-sm text-center mt-2 bg-red-900/20 py-1 rounded px-2">
                    {state.message}
                  </p>
                )}
                
                <p className="text-xs text-center text-coffee-400 mt-2">
                  Nosotros tampoco soportamos el spam. Dáte de baja cuando quieras.
                </p>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
