import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
    adjustFontFallback: true,
});

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    display: "swap",
    adjustFontFallback: true,
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    title: "Coffee Maker Pro | Café con calidad de cafetería en casa",
    description: "Prepara espresso, cappuccino y latte en casa con Coffee Maker Pro. Kit con molino incluido, envío gratis y pago contraentrega en Colombia.",
};


import ClientLayout from '@/components/layout/ClientLayout';
import SiteAnalytics from '@/components/SiteAnalytics';
import { activeSiteSlug, getSiteChannels } from '@/lib/site-config';

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Qué asistentes se muestran es configuración, no despliegue. La lectura va
    // cacheada por etiqueta, así que el panel la invalida al guardar y la
    // landing no paga una consulta por visita.
    const channels = await getSiteChannels(activeSiteSlug());

    return (
        <html lang="es" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`} suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://www.transparenttextures.com" />
            </head>
            <body className="font-sans antialiased text-coffee-900 bg-coffee-50" suppressHydrationWarning>
                <ClientLayout channels={channels}>
                    {children}
                </ClientLayout>
                <SiteAnalytics />
            </body>
        </html>
    );
}
