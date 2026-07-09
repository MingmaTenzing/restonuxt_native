/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Stripe-style palette. `neutral` is remapped to Stripe's cool slate/navy
        // scale so every existing neutral-* class picks up the new theme.
        neutral: {
          50: '#F6F9FC', // canvas
          100: '#EDF2F8',
          200: '#E3E8EE', // borders
          300: '#C9D2DC',
          400: '#8898AA',
          500: '#697386', // muted text
          600: '#4F566B',
          700: '#3C4257',
          800: '#2A2F45',
          900: '#1A1F36', // dark surfaces
          950: '#0A2540', // Stripe ink
        },
        // Stripe blurple
        accent: {
          DEFAULT: '#635BFF',
          dark: '#7A73FF',
        },
      },
    },
  },
  plugins: [],
};
