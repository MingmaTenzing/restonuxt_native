/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Uber-style accent (Uber green)
        accent: {
          DEFAULT: '#06C167',
          dark: '#3fdd85',
        },
      },
    },
  },
  plugins: [],
};
