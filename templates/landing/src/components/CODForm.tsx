'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, MapPin, CheckCircle, Loader2, Navigation, Home, ShieldCheck, Lock } from 'lucide-react';
import { createOrder } from '@/app/actions/order';
import { PRODUCT } from '@/lib/product';

const formSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  dataConsent: z.literal(true, {
    message: 'Debes autorizar el tratamiento de tus datos para continuar',
  }),
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

  const onSubmit = async ({ dataConsent: _consent, ...data }: FormData) => {
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
            <h3 className="font-bold text-coffee-900">Solicitar envío de mi Coffee Maker Pro</h3>
        </div>
        <p className="text-sm text-coffee-600">Perfecta para transformar tus mañanas en casa o elevar el nivel de tu oficina. Paga al recibir.</p>
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

        {/* Email - NEW */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="text-gray-500">@</span> Correo Electrónico
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="Ej: juan@ejemplo.com"
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {errors.email && (
            <p className="text-red-500 text-xs font-medium ml-1">{errors.email.message}</p>
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

        <div className="rounded-xl border border-coffee-100 bg-coffee-50/40 p-3">
          <label htmlFor="dataConsent" className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-coffee-700">
            <input
              id="dataConsent"
              type="checkbox"
              {...register('dataConsent')}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-coffee-900"
            />
            <span>
              Autorizo a {PRODUCT.name} a tratar mis datos personales para gestionar
              este pedido, coordinar la entrega y brindar soporte posventa. Puedo
              consultar, actualizar o solicitar la eliminación de mis datos
              escribiendo a {PRODUCT.supportEmail}.
            </span>
          </label>
          {errors.dataConsent && (
            <p className="ml-7 mt-1.5 text-xs font-medium text-red-500">{errors.dataConsent.message}</p>
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-coffee-950 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-coffee-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Cargando...
            </>
          ) : (
            'FINALIZAR PEDIDO CONTRAENTREGA'
          )}
        </button>
        <p className="text-xs text-center text-gray-500 mt-2 px-4">
            {PRODUCT.warranty} · Pago al recibir
        </p>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock size={12} /> Conexión cifrada. Usamos tus datos solo para gestionar el pedido
      </div>
    </div>
  );
}
