import React from 'react';
import { X, Clock, ChefHat, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Recipe, SectionId } from '../types';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  if (!recipe) return null;

  const handleBuyClick = () => {
    onClose();
    const element = document.getElementById(SectionId.PRICING);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-coffee-950/80 backdrop-blur-sm transition-opacity animate-fade-in-up" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-coffee-900 to-coffee-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fade-in-up border border-coffee-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-2/5 h-64 md:h-auto relative shrink-0">
          <img 
            src={recipe.image} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coffee-900 md:bg-gradient-to-r md:from-transparent md:to-coffee-900 opacity-90"></div>
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-white z-10">
             <div className="inline-flex items-center gap-2 bg-gold-500/20 backdrop-blur-md border border-gold-500/30 px-3 py-1 rounded-full text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock size={12} /> {recipe.time}
             </div>
             <h2 className="text-3xl font-serif font-bold leading-none text-coffee-50">{recipe.title}</h2>
             <p className="text-coffee-200 text-sm mt-1">{recipe.subtitle}</p>
          </div>
        </div>

        {/* Content Side */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto text-coffee-100 custom-scrollbar">
            
            {/* Ingredients */}
            <div className="mb-8">
                <h3 className="text-coffee-50 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-gold-500"></div> Ingredientes
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-coffee-200">
                            <span className="text-gold-500 mt-1">•</span> {ing}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Steps */}
            <div className="mb-8">
                <h3 className="text-coffee-50 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-gold-500"></div> Preparación
                </h3>
                <div className="space-y-4">
                    {recipe.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-coffee-800 flex items-center justify-center text-xs font-bold text-coffee-50 border border-coffee-700">
                                {idx + 1}
                            </div>
                            <p className="text-sm leading-relaxed text-coffee-200">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Persuasive Block (The "Why Buy") */}
            <div className="bg-gradient-to-br from-gold-900/30 to-transparent border border-gold-500/20 rounded-xl p-5 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <ChefHat size={80} />
                </div>
                <h4 className="text-gold-400 font-serif font-bold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} /> El Secreto Pro
                </h4>
                <p className="text-sm text-coffee-200 relative z-10 italic leading-relaxed">
                    "{recipe.proSecret}"
                </p>
            </div>

            {/* CTA - 10% Action Color */}
            <button 
                onClick={handleBuyClick}
                className="w-full bg-gold-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 transition-colors shadow-lg"
            >
                <ShoppingBag size={18} /> Quiero lograr esto en casa
            </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;