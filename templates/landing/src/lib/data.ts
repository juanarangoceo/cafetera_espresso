
import { Recipe, Policy, SectionId } from '../types';
import { Coffee, Droplets, Shield, Wind } from 'lucide-react';
import React from 'react';
import { PRODUCT } from './product';

// --- CONSTANTS ---
export const CHECKOUT_URL = "#checkout-form";
export const PRICE = PRODUCT.priceLabel;

// --- DATA: Testimonials ---
export const TESTIMONIALS = [
    {
        id: 1,
        name: "Carlos M.",
        location: "Bogotá, DC",
        role: "Ahorrador Inteligente",
        text: "Hice cuentas y gastaba cerca de $300 mil al mes comprando café. Ahora preparo mis bebidas en casa, elijo mis propios granos y el molino incluido me resulta muy práctico.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
        highlight: "Ahorro Real"
    },
    {
        id: 2,
        name: "Andrea R.",
        location: "Medellín, ANT",
        role: "Principiante",
        text: "Tenía miedo de no saber usarla porque nunca he sido barista. La guía digital explica todo de forma sencilla. Ya hago corazones en la leche —bueno, intentos—.",
        stars: 5,
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
        highlight: "Fácil de Usar"
    },
    {
        id: 3,
        name: "Felipe G.",
        location: "Cali, VAL",
        role: "Exigente",
        text: "He tenido otras máquinas de espresso y me gustó la consistencia de esta. Con una molienda bien ajustada logro una crema densa y un café con muy buen cuerpo.",
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
        src: "/product/imagen-2.jpg",
        title: "Acero Inoxidable Premium",
        desc: "Acabado metálico fácil de limpiar y pensado para integrarse a tu cocina.",
        span: "md:col-span-2 md:row-span-2"
    },
    {
        src: "/product/imagen-3.jpg",
        title: "Vaporizador Pro",
        desc: "Varilla de acero con rotación 360° para texturizar leche.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "/product/imagen-4.jpg",
        title: "Portafiltro Sólido",
        desc: "Peso balanceado y doble salida para extracción uniforme.",
        span: "md:col-span-1 md:row-span-1"
    },
    {
        src: "/product/imagen-6.jpg",
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
        proSecret: 'El secreto no es el azúcar, es la molienda fresca. El café pierde aroma rápidamente una vez molido, por eso conviene moler justo antes de preparar.'
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
        image: "/product/imagen-2.jpg",
        // Storing icon name or key if we want to avoid importing React here,
        // but for simplicity let's keep it if we rename to .tsx or handled in component.
        // Better: Instantiate icons in the component mapping.
        iconType: 'Droplets'
    },
    {
        id: 2,
        title: "Micro-espuma de Seda",
        desc: "Potencia de vapor seco para texturizar leche brillante y elástica. Tu Latte Art empieza aquí.",
        image: "/product/imagen-3.jpg",
        iconType: 'Wind'
    },
    {
        id: 3,
        title: "Frescura Instantánea",
        desc: "Rompe el grano segundos antes. Los aceites esenciales van a tu taza, no al aire.",
        image: "/product/molino_cafe_electrico_raf.jpg",
        iconType: 'Coffee'
    },
    {
        id: 4,
        title: "Acero Inoxidable Premium",
        desc: "Robusta, pesada y elegante. No es plástico, es maquinaria comercial para tu cocina.",
        image: "/product/scuare.jpg",
        iconType: 'Shield'
    }
];

export const POLICIES: Record<string, Policy> = {
    privacy: {
        id: 'privacy',
        title: 'Política de Privacidad',
        content: [
            `Responsable del tratamiento: ${PRODUCT.merchant.legalName}, ${PRODUCT.merchant.idLabel}, ${PRODUCT.merchant.location}. Canal de contacto: ${PRODUCT.supportEmail}.`,
            'Finalidades: gestionar tu pedido, coordinar la entrega, enviarte la confirmación de compra y brindar soporte posventa.',
            'Datos que recogemos: nombre, correo, celular, ciudad y dirección. Si usas el asistente de voz, procesamos el audio de la llamada únicamente durante la conversación para atenderte.',
            'Encargados: usamos proveedores externos para base de datos, envío de correos y asistentes conversacionales. Algunos operan fuera de Colombia, por lo que tus datos pueden ser tratados en el exterior bajo acuerdos de confidencialidad.',
            'Nunca vendemos tus datos a terceros ni los usamos para fines distintos a los aquí descritos.',
            'Analítica: el sitio usa herramientas de medición de tráfico que registran tu navegación de forma agregada para entender el uso de la página.',
            'Tus derechos: puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos, así como revocar la autorización, escribiendo a ' + PRODUCT.supportEmail + '. Responderemos tu solicitud dentro de los plazos previstos por la Ley 1581 de 2012.',
            'Conservación: mantenemos los datos del pedido mientras dure la relación comercial y el periodo de garantía.'
        ]
    },
    terms: {
        id: 'terms',
        title: 'Términos y Condiciones',
        content: [
            `Vendedor: ${PRODUCT.merchant.legalName}, ${PRODUCT.merchant.idLabel}, ${PRODUCT.merchant.taxRegime}, ${PRODUCT.merchant.location}. Contacto: ${PRODUCT.supportEmail}.`,
            `El molino y la guía digital forman parte del kit publicado por ${PRODUCT.priceLabel}.`,
            'Precios en COP con IVA incluido.',
            'El despacho se realiza al día siguiente hábil de la compra; el tiempo de entrega depende de la ciudad y la transportadora.',
            `El único medio de pago es ${PRODUCT.paymentMethod.toLowerCase()}: pagas al recibir el producto.`,
            'El pedido queda confirmado cuando recibes el correo de confirmación. Puedes cancelarlo sin costo escribiendo antes del despacho.',
            'Si no te encuentras en la dirección al momento de la entrega, la transportadora intentará contactarte para reprogramar.',
            'Estos términos se rigen por la legislación colombiana y por el Estatuto del Consumidor (Ley 1480 de 2011).'
        ]
    },
    shipping: {
        id: 'shipping',
        title: 'Información de Envíos',
        content: [
            'Envío gratis a todo el país, sujeto a la cobertura de nuestras transportadoras.',
            'Aliados logísticos: Servientrega, Interrapidisimo, Envía.',
            `Tiempo de entrega: ${PRODUCT.deliveryEstimate}.`
        ]
    },
    returns: {
        id: 'returns',
        title: 'Garantía y devoluciones',
        content: [
            `La compra cuenta con ${PRODUCT.warranty}.`,
            'La garantía cubre fallas de funcionamiento atribuibles al producto durante ese periodo.',
            `${PRODUCT.withdrawalRight}.`,
            'Para ejercer el retracto, el producto debe devolverse en las mismas condiciones en que se recibió. El reembolso se realiza dentro de los plazos previstos por la ley.',
            `Nuestro equipo brinda orientación posventa en ${PRODUCT.supportEmail}.`
        ]
    }
};

export const NAV_LINKS = [
    { name: 'Experiencia', id: SectionId.FEATURES },
    { name: 'Resultados', id: 'recipes' },
    { name: 'Kit Regalo', id: SectionId.BONUS },
    { name: 'Ahorro', id: 'roi' },

];
