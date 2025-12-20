'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, MapPin, CheckCircle, Loader2, Navigation, Home, ShieldCheck, Lock } from 'lucide-react';
import { createOrder } from '@/app/actions/order';

const formSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
});

type FormData = z.infer<typeof formSchema>;

export default function CODForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await createOrder(data);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(result.message || 'Ocurrió un error inesperado');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      setErrorMessage('Error de conexión con el servidor. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h3>
        <p className="text-gray-600 mb-6 text-lg">
          Gracias por tu compra. Tu pedido ha sido registrado exitosamente.
        </p>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 w-full mb-6">
          <p className="text-blue-800 font-medium">
            Te escribiremos por WhatsApp para coordinar el envío.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-coffee-50 border border-coffee-100 p-4 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-green-600" size={20} />
            <h3 className="font-bold text-coffee-900">Compra 100% Segura</h3>
        </div>
        <p className="text-sm text-coffee-600">No necesitas tarjeta. Llena tus datos y paga en efectivo solo cuando recibas la máquina.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Nombre Completo
          </label>
          <input
            {...register('fullName')}
            type="text"
            placeholder="Ej: Juan Pérez"
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs font-medium ml-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Celular / WhatsApp
          </label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="Ej: 300 123 4567"
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs font-medium ml-1">{errors.phone.message}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Departamento / Ciudad
          </label>
          <input
            {...register('city')}
            type="text"
            placeholder="Ej: Antioquia, Medellín"
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {errors.city && (
            <p className="text-red-500 text-xs font-medium ml-1">{errors.city.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Home className="w-4 h-4" /> Dirección Exacta
          </label>
          <input
            {...register('address')}
            type="text"
            placeholder="Ej: Calle 10 # 20-30, Apto 501"
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {errors.address && (
            <p className="text-red-500 text-xs font-medium ml-1">{errors.address.message}</p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Cargando...
            </>
          ) : (
            'CONFIRMAR ENVÍO A MI CASA 🚚'
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock size={12} /> Tus datos están encriptados SSL
      </div>
    </div>
  );
}
