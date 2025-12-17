import React from 'react';
import { HotspotSection } from './components/HotspotSection';
import { ShoppingBag, Menu, Search } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* Simple Navigation Mockup */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Menu className="h-6 w-6 text-gray-500 cursor-pointer hover:text-black transition-colors" />
            </div>
            
            <div className="serif text-2xl font-bold tracking-tight text-center flex-1 cursor-pointer">
              ATELIER
            </div>

            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-gray-500 cursor-pointer hover:text-black transition-colors" />
              <div className="relative cursor-pointer group">
                <ShoppingBag className="h-5 w-5 text-gray-500 group-hover:text-black transition-colors" />
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full">
                  2
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <HotspotSection />
        
        {/* Placeholder for Next.js Integration Context */}
        <section className="bg-neutral-50 py-16 px-4 text-center border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <h3 className="serif text-2xl font-medium mb-4">Complete the Look</h3>
            <p className="text-gray-500 mb-8">
              Seamlessly integrate this React component into your Next.js commerce stack using standard props and modular styling.
            </p>
            <button className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
              Shop Collection
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>© 2024 Atelier Interactive. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-black cursor-pointer">Privacy</span>
            <span className="hover:text-black cursor-pointer">Terms</span>
            <span className="hover:text-black cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
