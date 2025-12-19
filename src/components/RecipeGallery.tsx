"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ChefHat, ChevronRight } from 'lucide-react';
import { Recipe } from '../types';
import { RECIPES } from '../data/content';
import RecipeModal from './RecipeModal';

export default function RecipeGallery() {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    return (
        <section id="recipes" className="py-16 md:py-24 bg-coffee-50 bg-noise relative text-coffee-900 border-t border-coffee-200">
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-16 reveal fade-bottom">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-4 border border-coffee-200 shadow-sm">
                        <ChefHat className="text-gold-500" size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mb-4">Lo que vas a lograr</h2>
                    <p className="text-coffee-600 font-light text-lg md:text-xl">
                        Estas bebidas NO salen con una máquina barata.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {RECIPES.map((recipe, index) => (
                        <div key={recipe.id} className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group border border-coffee-100 hover:border-gold-300 flex flex-col cursor-pointer reveal fade-bottom`} style={{ transitionDelay: `${index * 100}ms` }} onClick={() => setSelectedRecipe(recipe)}>
                            <div className="h-56 overflow-hidden relative">
                                <Image src={recipe.image} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 bg-coffee-100" alt={recipe.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80"></div>
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded text-sm font-bold text-gold-600 shadow-sm">{recipe.time}</div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-serif font-bold text-2xl text-coffee-900 mb-1 group-hover:text-gold-600 transition-colors">{recipe.title}</h3>
                                <p className="text-sm text-coffee-500 mb-5 uppercase tracking-wider font-medium">{recipe.subtitle}</p>
                                <button className="mt-auto flex items-center gap-2 text-base text-coffee-600 hover:text-gold-600 transition-colors font-bold border-t border-coffee-100 pt-4">
                                    Ver Receta <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        </section>
    );
}
