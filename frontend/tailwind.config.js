/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // Supabase actual colors
                background: {
                    DEFAULT: '#09090b', // zinc-950
                    light: '#18181b',    // zinc-900
                    lighter: '#27272a',  // zinc-800
                },
                // Surface colors
                surface: {
                    DEFAULT: '#18181b',   // zinc-900
                    hover: '#27272a',     // zinc-800
                    active: '#3f3f46',    // zinc-700
                },
                // Primary - Supabase green
                primary: {
                    DEFAULT: '#3ecf8e',
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#3ecf8e',
                    500: '#3ecf8e',
                    600: '#10b981',
                    700: '#059669',
                    800: '#047857',
                    900: '#065f46',
                    950: '#064e3b',
                },
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
}
