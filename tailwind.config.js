/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          50: '#f4f6f8',
          100: '#e5e9ee',
          200: '#cbd4e0',
          500: '#64748b',
          800: '#1e293b',
          900: '#0f172a',
          accent: '#10b981',
          primary: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}
