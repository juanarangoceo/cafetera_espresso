import Script from 'next/script'
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
            </head>
            <body className="font-sans antialiased text-coffee-900 bg-coffee-50" suppressHydrationWarning>
                {children}
                <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '562585775680913');
            fbq('track', 'PageView');
          `}
        </Script>
            </body>
        </html>
    );
}
