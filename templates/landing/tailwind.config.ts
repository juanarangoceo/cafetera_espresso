import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                coffee: {
                    50: '#fcf9f6',
                    100: '#f5efe9',
                    200: '#eadcd3',
                    300: '#dbc3b4',
                    400: '#c5a08d',
                    500: '#b07d62',
                    600: '#9d634b',
                    700: '#834d3b',
                    800: '#6d4035',
                    900: '#58362e',
                    950: '#2f1b17',
                },
                gold: {
                    50: '#fbf9eb',
                    100: '#f5f0c8',
                    200: '#eee392',
                    300: '#e5d054',
                    400: '#debf26',
                    500: '#cc9710', // Base gold
                    600: '#a8720b',
                    700: '#86540d',
                    800: '#714412',
                    900: '#613915',
                    950: '#381e08',
                },
                // Paleta del panel de operación (Nitro Landing). Deliberadamente
                // separada de coffee/gold: el panel gestiona varias tiendas, así
                // que no puede vestir la marca de una de ellas.
                nitro: {
                    50: '#e8fff1',
                    100: '#c2ffdc',
                    200: '#85ffba',
                    300: '#48f994',
                    400: '#22ea74',
                    500: '#10cf5e', // base, contraste suficiente sobre negro
                    600: '#08a94b',
                    700: '#07843c',
                    800: '#096832',
                    900: '#0a552c',
                    950: '#013016',
                    // Verde neón puro. Solo para acentos y brillos: como texto
                    // sobre claro no alcanza contraste accesible.
                    glow: '#39ff14',
                },
                ink: {
                    50: '#f6f7f7',
                    100: '#e2e5e4',
                    200: '#c5cbc9',
                    300: '#a0a9a6',
                    400: '#7b8481',
                    500: '#616a67',
                    600: '#4b5350',
                    700: '#3c4340',
                    800: '#232827',
                    900: '#141817',
                    950: '#0a0d0c',
                },
            },
            fontFamily: {
                serif: ['var(--font-fraunces)', 'serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            boxShadow: {
                'gold-glow': '0 0 20px rgba(204, 151, 16, 0.6)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                'spin-slow': 'spin 8s linear infinite',
                'shimmer': 'shimmer 3s linear infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(0)' }, /* DISABLED FLOAT */
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },
        },
    },
    plugins: [],
};
export default config;
