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
            },
            fontFamily: {
                serif: ['var(--font-fraunces)', 'serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                'spin-slow': 'spin 8s linear infinite',
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
            },
        },
    },
    plugins: [],
};
export default config;
