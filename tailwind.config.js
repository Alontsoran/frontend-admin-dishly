/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        brand: {
          rose:  '#f43f5e',
          pink:  '#ec4899',
          light: '#fff1f2',
        },
      },
      fontFamily: {
        assistant: ['Assistant', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 24px -4px rgba(244,63,94,0.25)',
        'brand-lg': '0 8px 40px -8px rgba(244,63,94,0.35)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
