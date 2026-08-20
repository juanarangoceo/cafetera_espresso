export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
}

export enum SectionId {
  HERO = 'inicio',
  FEATURES = 'caracteristicas',
  ABOUT = 'nosotros',
  BONUS = 'regalo',
  TESTIMONIALS = 'testimonios',
  PRICING = 'oferta',
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  image: string;
  ingredients: string[];
  steps: string[];
  proSecret: string;
}

export interface Policy {
  id: string;
  title: string;
  content: string[];
}

export interface ProductFeature {
  id: string;
  title: string;
  description: string;
  price?: string;
  // Percentage coordinates (0-100)
  x: number;
  y: number;
}

export interface HotspotProps {
  feature: ProductFeature;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onClose: () => void;
}