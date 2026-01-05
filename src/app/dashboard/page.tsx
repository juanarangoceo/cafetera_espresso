import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'
import { Coffee, Package, LogOut, User } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders_cod')
    .select('*')
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-coffee-50">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-coffee-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-coffee-900 rounded-2xl flex items-center justify-center text-gold-500 shadow-lg shadow-coffee-900/20">
                <User size={40} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-coffee-900 mb-2">
                  Hola, Barista
                </h1>
                <p className="text-coffee-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {user.email}
                </p>
              </div>
            </div>
            
            <form action={signOut}>
              <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-coffee-100 text-coffee-700 font-bold hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Orders */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-coffee-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-coffee-900 flex items-center gap-3">
                  <Package className="text-gold-500" />
                  Mis Pedidos
                </h2>
              </div>

              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border border-coffee-100 hover:border-gold-200 hover:shadow-md transition-all bg-coffee-50/30"
                    >
                      <div className="space-y-1 mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-coffee-400">
                            #{order.id.slice(0, 8)}...
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status === 'pending' ? 'Pendiente' : order.status}
                          </span>
                        </div>
                        <p className="font-bold text-coffee-900">{order.full_name}</p>
                        <p className="text-sm text-coffee-500">
                          {new Date(order.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-coffee-900">
                          ${order.total_price?.toLocaleString('es-CO')}
                        </p>
                        <p className="text-sm text-coffee-500">Contraentrega</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 bg-coffee-50 rounded-full flex items-center justify-center mb-6 text-coffee-300">
                    <Coffee size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-coffee-800 mb-2">
                    Aún no tienes pedidos
                  </h3>
                  <p className="text-coffee-500 max-w-sm mb-8">
                    Cuando realices tu primera compra de café de especialidad, podrás ver el estado de tu envío aquí.
                  </p>
                  <a 
                    href="/#pricing" 
                    className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-gold-500/20 transition-all transform hover:scale-105"
                  >
                    Explorar Café
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Quick Actions / Info */}
          <div className="space-y-8">
            <div className="bg-coffee-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
              <div className="relative z-10">
                <h3 className="text-xl font-serif font-bold mb-4 text-gold-400">
                  Membresía Pro
                </h3>
                <p className="text-coffee-100 mb-6 text-sm leading-relaxed">
                  Tienes acceso a precios especiales y envíos prioritarios en todas tus compras de café.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium backdrop-blur-sm border border-white/10">
                  <span className="text-gold-400">★</span> Miembro Activo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
