
import { Recipe, Policy, SectionId } from '../types';
import { Coffee, Droplets, Shield, Wind } from 'lucide-react';
import React from 'react';

// --- CONSTANTS ---
export const CHECKOUT_URL = "#checkout-form";
export const PRICE = "$490.000";
export const OLD_PRICE = "$1.190.000";

// --- DATA: Testimonials ---
export const TESTIMONIALS = [
    {
        id: 1,
        name: "Carlos M.",
        location: "Bogotá, DC",
        role: "Ahorrador Inteligente",
        text: "Hice cuentas y gastaba $300mil al mes en tintos de la calle. Con esta máquina me preparo algo mil veces mejor y me sale a $500 pesos la taza. El molino gratis es un detallazo.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop", 
        highlight: "Ahorro Real"
    },
    {
        id: 2,
        name: "Andrea R.",
        location: "Medellín, ANT",
        role: "Principiante",
        text: "Tenía miedo de no saber usarla porque nunca he sido barista. El E-book que regalan explica todo súper fácil. Ya hago corazones en la leche (bueno, intentos jaja).",
        stars: 5,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop", 
        highlight: "Fácil de Usar"
    },
    {
        id: 3,
        name: "Felipe G.",
        location: "Cali, VAL",
        role: "Exigente",
        text: "He tenido máquinas de marcas italianas caras. Esta Coffee Maker Pro no tiene nada que envidiarles. Los 20 bares son reales, la crema es espesa y consistente. Recomendada.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop", 
        highlight: "Calidad Pro"
    }
];

// --- DATA: UGC Grid ---
export const UGC_IMAGES = [
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop"
];

// --- DATA: Product Gallery ---
export const PRODUCT_IMAGES = [
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-2.webp?v=1757995172",
        title: "Acero Inoxidable Premium",
        desc: "Cuerpo robusto de grado quirúrgico. No se oxida, no se mancha.",
        span: "md:col-span-2 md:row-span-2" 
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-3.webp?v=1757995172",
        title: "Vaporizador Pro",
        desc: "Varilla de acero con rotación 360° para texturizar leche.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-4.webp?v=1757995172",
        title: "Portafiltro Sólido",
        desc: "Peso balanceado y doble salida para extracción uniforme.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-6.webp?v=1757995173",
        title: "Pantalla Táctil",
        desc: "Control intuitivo y preciso para cada preparación.",
        span: "md:col-span-2 md:row-span-1"
    }
];

// --- DATA: Recipes ---
export const RECIPES: Recipe[] = [
    {
        id: 'tinto',
        title: 'Tinto Perfecto',
        subtitle: 'El clásico colombiano',
        time: '1 min',
        image: '/images/tinto.png',
        ingredients: ['18g de café en grano (Molienda Fina)', '60ml de agua (92°C)', 'Sin azúcar'],
        steps: ['Muele tus granos frescos con el molino de regalo.', 'Compacta con fuerza media usando el tamper.', 'Extrae por 25 segundos para obtener la crema perfecta.'],
        proSecret: 'El secreto no es el azúcar, es la molienda fresca. El café pre-molido pierde el 60% de sus aromas en 15 minutos.'
    },
    {
        id: 'cappuccino',
        title: 'Cappuccino de Autor',
        subtitle: 'Textura de terciopelo',
        time: '5 min',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=600&auto=format&fit=crop', 
        ingredients: ['1 Espresso simple', '150ml de leche entera fría', 'Cacao en polvo'],
        steps: ['Extrae el espresso en taza ancha.', 'Purga el vaporizador.', 'Texturiza la leche inclinando la jarra 45 grados hasta que brille.', 'Vierte creando un círculo blanco en el centro.'],
        proSecret: 'Para latte art, la leche no debe hervir. Debe estar a unos 65°C, justo cuando ya no puedes sostener la jarra metálica.'
    },
    {
        id: 'affogato',
        title: 'Affogato Italiano',
        subtitle: 'Postre y café en uno',
        time: '2 min',
        image: '/images/affogato.png',
        ingredients: ['2 bolas de helado de vainilla', '1 Espresso doble (60ml) intenso', 'Nueces trituradas'],
        steps: ['Sirve el helado en copa congelada.', 'Prepara el espresso doble directamente sobre el helado.', 'Decora con nueces.'],
        proSecret: 'Usa una molienda un poco más fina para este espresso, buscando una extracción "Ristretto" (más corta y dulce) que contraste con el helado.'
    },
    {
        id: 'iced',
        title: 'Cold Brew Express',
        subtitle: 'Refrescante y energizante',
        time: '3 min',
        image: '/images/coldbrew.png',
        ingredients: ['1 Espresso doble', 'Hielo grande', '100ml agua tónica', 'Rodaja de limón'],
        steps: ['Llena el vaso con hielo.', 'Agrega la tónica y el limón.', 'Vierte el espresso suavemente para que flote.'],
        proSecret: 'El gas de la tónica resalta las notas cítricas de los cafés colombianos de altura. Una experiencia sensorial única.'
    }
];

// --- DATA: Gallery Items ---
// Note: We need to return an object structure compatible with what page.tsx expects, 
// but since icons are React Components, we might need to handle them carefully if this is a .ts file.
// We will export a function or simple object. Since .tsx is allowed for data files with components:

export const GALLERY_ITEMS = [
    {
        id: 1,
        title: "La Crema Perfecta",
        desc: "Densa, color avellana y capaz de sostener el azúcar. El sello de calidad de un espresso real.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-2.webp?v=1757995172",
        // Storing icon name or key if we want to avoid importing React here, 
        // but for simplicity let's keep it if we rename to .tsx or handled in component.
        // Better: Instantiate icons in the component mapping.
        iconType: 'Droplets' 
    },
    {
        id: 2,
        title: "Micro-espuma de Seda",
        desc: "Potencia de vapor seco para texturizar leche brillante y elástica. Tu Latte Art empieza aquí.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/imagen-3.webp?v=1757995172",
        iconType: 'Wind'
    },
    {
        id: 3,
        title: "Frescura Instantánea",
        desc: "Rompe el grano segundos antes. Los aceites esenciales van a tu taza, no al aire.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/molino_cafe_electrico_raf.webp?v=1758255802",
        iconType: 'Coffee'
    },
    {
        id: 4,
        title: "Acero Inoxidable Premium",
        desc: "Robusta, pesada y elegante. No es plástico, es maquinaria comercial para tu cocina.",
        image: "https://cdn.shopify.com/s/files/1/0608/6433/1831/files/scuare.jpg?v=1757995325",
        iconType: 'Shield'
    }
];

export const POLICIES: Record<string, Policy> = {
    privacy: {
        id: 'privacy',
        title: 'Política de Privacidad',
        content: [
            'Tus datos están protegidos con encriptación SSL de 256 bits.',
            'Solo usamos tu información para procesar el envío y la garantía.',
            'Nunca vendemos tus datos a terceros.'
        ]
    },
    terms: {
        id: 'terms',
        title: 'Términos y Condiciones',
        content: [
            'Oferta del Molino Gratis válida hasta agotar inventario (50 unidades).',
            'Precios en COP con IVA incluido.',
            'El despacho se realiza al día siguiente hábil de la compra.'
        ]
    },
    shipping: {
        id: 'shipping',
        title: 'Información de Envíos',
        content: [
            'Envío GRATIS asegurado a todo el país.',
            'Aliados logísticos: Servientrega, Interrapidisimo, Envía.',
            'Tiempo de entrega: 2-4 días hábiles en ciudades principales.'
        ]
    },
    returns: {
        id: 'returns',
        title: 'Garantía Todopolis',
        content: [
            '1 Año de Garantía Directa por defectos de fábrica.',
            '30 Días de Garantía de Satisfacción Total.',
            'Soporte técnico prioritario para clientes.'
        ]
    }
};

export const NAV_LINKS = [
    { name: 'Experiencia', id: SectionId.FEATURES },
    { name: 'Resultados', id: 'recipes' },
    { name: 'Kit Regalo', id: SectionId.BONUS },
    { name: 'Ahorro', id: 'roi' },
];
