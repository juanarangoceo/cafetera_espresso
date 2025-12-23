import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Mail, BookOpen, CheckCircle2, Lock, Gift, FileText, Coffee } from 'lucide-react';
import { subscribeToMasterclass } from '@/app/actions/leads';
import Image from 'next/image';

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
      className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Enviando...
        </>
      ) : (
        <>
          <BookOpen size={18} />
          ENVIARME EL E-BOOK GRATIS
        </>
      )}
    </button>
  );
}

export default function LeadMagnet() {
  const [state, formAction] = useFormState(subscribeToMasterclass, initialState);

  return (
    <div className="group relative h-full">
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gold-500/5 rounded-[3rem] transform -rotate-2 scale-105 transition-transform group-hover:-rotate-4"></div>
      
      {/* Card Container */}
      <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-6 md:p-10 overflow-hidden hover:bg-white/10 transition-colors duration-500 hover:shadow-gold-500/10 hover:border-gold-500/20 flex flex-col">
        
        {/* FREE Tag */}
        <div className="absolute top-0 right-0 z-20">
            <span className="bg-gold-500 text-coffee-950 font-bold px-6 py-2 rounded-bl-3xl shadow-lg block">GRATIS</span>
        </div>

        {/* Image */}
        <div className="h-48 md:h-56 relative mb-6 transform group-hover:scale-105 transition-transform duration-700 shrink-0">
             <Image 
                src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop"
                alt="Guía Barista E-book"
                fill
                className="object-cover rounded-2xl drop-shadow-2xl grayscale-[30%] group-hover:grayscale-0 transition-all"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/80 to-transparent rounded-2xl flex items-end p-4">
                <span className="text-white font-bold flex items-center gap-2"><FileText size={16} className="text-gold-400"/> Formato PDF</span>
             </div>
        </div>

        {/* Title & Price */}
        <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight">No tomes más café quemado. Aprende el secreto.</h3>
        <div className="flex items-baseline gap-3 mb-4">
            <span className="text-xl font-bold text-gold-400">Regalo #2</span>
            <span className="text-gray-400 line-through text-base">Antes $47.000</span>
        </div>

        {/* Content or Success State */}
        {state.success ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in bg-green-500/10 rounded-2xl p-6 border border-green-500/20">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">¡Listo! 📘</h4>
                <p className="text-gray-300 text-sm">Tu guía va en camino a tu correo. Disfruta la lectura.</p>
                 <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold">
                    <CheckCircle2 size={12} /> Enviado a {state.message.includes('@') ? 'tu correo' : 'ti'}
                </div>
             </div>
        ) : (
            <div className="flex-1 flex flex-col">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Descarga GRATIS nuestra guía práctica <strong>'Barista en 5 Minutos'</strong>. Deja de arruinar tus granos y empieza a extraer como un profesional hoy mismo.
                </p>
                
                <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-gray-300 text-xs md:text-sm">
                        <Coffee size={16} className="text-gold-500 shrink-0 mt-0.5" />
                        <span>La regla de oro de la molienda (que el 90% ignora).</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300 text-xs md:text-sm">
                        <Gift size={16} className="text-gold-500 shrink-0 mt-0.5" />
                        <span>Temperatura exacta para evitar el sabor amargo.</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300 text-xs md:text-sm">
                        <CheckCircle2 size={16} className="text-gold-500 shrink-0 mt-0.5" />
                        <span>Cómo texturizar leche sin que parezca jabón.</span>
                    </li>
                </ul>

                <form action={formAction} className="mt-auto space-y-3">
                    <div>
                        <label htmlFor="email" className="sr-only">Correo electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400" size={18} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Tu mejor correo..."
                                required
                                className="w-full bg-white/90 text-coffee-900 placeholder:text-coffee-500 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all font-medium text-sm"
                            />
                        </div>
                    </div>

                    <SubmitButton />

                    {state.message && !state.success && (
                         <p className="text-red-400 text-xs text-center bg-red-900/20 py-1 rounded">
                            {state.message}
                        </p>
                    )}

                    <p className="text-[10px] text-center text-gray-500 leading-tight">
                        Al suscribirme acepto recibir consejos de café. Dáte de baja cuando quieras. 🔒 Libre de Spam.
                    </p>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}
