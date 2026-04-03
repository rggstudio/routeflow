/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#bce2ff',
          300: '#8bcfff',
          400: '#52b3ff',
          500: '#2691ff',
          600: '#0f73f3',
          700: '#105ddf',
          800: '#154cb4',
          900: '#18428d',
        },
      },
    },
  },
  plugins: [],
};
