'use client'

import React, { useState } from 'react'
import { login, signup } from './actions'
import { Coffee, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(event.currentTarget)
    
    try {
      if (isLogin) {
        const result = await login(formData)
        if (result?.error) setError(result.error)
      } else {
        const result = await signup(formData)
        if (result?.error) setError(result.error)
      }
    } catch (e) {
      setError('Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-coffee-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-coffee-900 rounded-full flex items-center justify-center mb-4 text-gold-500">
            <Coffee size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-coffee-900">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="text-coffee-600 mt-2 text-center">
            {isLogin 
              ? 'Ingresa a tu cuenta para gestionar tus pedidos' 
              : 'Únete a la comunidad de amantes del café'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-coffee-800 mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all bg-coffee-50/50"
              placeholder="nombre@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-coffee-800 mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all bg-coffee-50/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-coffee-100 text-center">
          <p className="text-coffee-600 text-sm">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-gold-600 hover:text-gold-700 underline decoration-2 underline-offset-2 transition-colors"
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
