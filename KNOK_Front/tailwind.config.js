/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8447e9',
        secondary: '#e1dbf6',
        'gray': {
          100: '#f5f5f5',
          300: '#d9d9d9',
          500: '#808080',
          700: '#3f3f3f',
          900: '#0f0f0f',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Zona Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 