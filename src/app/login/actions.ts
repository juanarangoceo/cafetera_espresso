'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Debugging logs
  console.log('Attempting login for:', email)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return { error: 'Credenciales inválidas. Por favor intenta de nuevo.' }
  }

  console.log('Login successful, redirecting...')
  
  // Important: revalidate layout to update Navbar
  revalidatePath('/', 'layout')
  
  // Redirect MUST fail (throw) to work, so do NOT wrap in try/catch in the UI if possible,
  // or handle the specific NEXT_REDIRECT error.
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('Attempting signup for:', email)

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Signup error:', error.message)
    return { error: 'Hubo un error al registrarse. Intenta con otro correo.' }
  }

  console.log('Signup successful, redirecting...')
  
  revalidatePath('/', 'layout')
  redirect('/')
}
