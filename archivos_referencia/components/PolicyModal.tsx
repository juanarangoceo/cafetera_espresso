import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Policy } from '../types';

interface PolicyModalProps {
  policy: Policy | null;
  onClose: () => void;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  if (!policy) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-coffee-950/60 backdrop-blur-sm transition-opacity animate-fade-in-up" 
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="bg-coffee-900 p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <ShieldCheck className="text-gold-500" size={24} />
                <h3 className="text-xl font-serif font-bold text-white">{policy.title}</h3>
            </div>
            <button 
                onClick={onClose}
                className="text-coffee-200 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-coffee-50">
            <div className="space-y-4 text-coffee-800 leading-relaxed text-sm md:text-base">
                {policy.content.map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-coffee-200 text-center">
                <button 
                    onClick={onClose}
                    className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm"
                >
                    Entendido
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;