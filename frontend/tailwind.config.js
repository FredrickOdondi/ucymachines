/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a", // Dark slate mock
                surface: "#1e293b",
                primary: "#06b6d4", // Cyan
            }
        },
    },
    plugins: [],
}
