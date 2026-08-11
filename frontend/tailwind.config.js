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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        slate: {
          150: '#e9eef5',
          250: '#d8e0ea',
          350: '#a8b4c5',
          750: '#334155',
          850: '#172033',
        },
        rose: {
          105: '#ffe9ee',
        },
      }
    },
  },
  plugins: [],
}
