import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
    adjustFontFallback: true,
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    title: "Coffee Maker Pro - La Máquina Definitiva",
    description: "El café perfecto exige molienda fresca. Llévate hoy el Kit Barista Completo y deja de tomar café oxidado.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://www.transparenttextures.com" />
                <link rel="preconnect" href="https://cdn.shopify.com" />
            </head>
            <body className="font-sans antialiased text-coffee-900 bg-coffee-50" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
