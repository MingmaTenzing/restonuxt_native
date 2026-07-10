/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // App theme source of truth, translated from the provided OKLCH CSS
        // variables into RN-friendly hex values for NativeWind.
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#09090B',
        },
        foreground: {
          DEFAULT: '#09090B',
          dark: '#FAFAFA',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#18181B',
        },
        'card-foreground': {
          DEFAULT: '#09090B',
          dark: '#FAFAFA',
        },
        primary: {
          DEFAULT: '#18181B',
          dark: '#E4E4E7',
        },
        'primary-foreground': {
          DEFAULT: '#FAFAFA',
          dark: '#18181B',
        },
        secondary: {
          DEFAULT: '#F4F4F5',
          dark: '#27272A',
        },
        'secondary-foreground': {
          DEFAULT: '#18181B',
          dark: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#F4F4F5',
          dark: '#27272A',
        },
        'muted-foreground': {
          DEFAULT: '#71717A',
          dark: '#A1A1AA',
        },
        accent: {
          DEFAULT: '#F4F4F5',
          dark: '#3F3F46',
        },
        'accent-foreground': {
          DEFAULT: '#18181B',
          dark: '#FAFAFA',
        },
        destructive: {
          DEFAULT: '#E11D48',
          dark: '#FB7185',
        },
        'destructive-foreground': {
          DEFAULT: '#FFFFFF',
          dark: '#FAFAFA',
        },
        border: {
          DEFAULT: '#E4E4E7',
          dark: '#3F3F46',
        },
        input: {
          DEFAULT: '#E4E4E7',
          dark: '#52525B',
        },
        ring: {
          DEFAULT: '#A1A1AA',
          dark: '#71717A',
        },
        chart: {
          1: '#93C5FD',
          2: '#2563EB',
          3: '#1D4ED8',
          4: '#1E40AF',
          5: '#1E3A8A',
          '1-dark': '#BFDBFE',
          '2-dark': '#60A5FA',
          '3-dark': '#3B82F6',
          '4-dark': '#2563EB',
          '5-dark': '#1D4ED8',
        },
        // Keep neutral aligned with the same zinc/graphite family so existing
        // utility classes continue to inherit the supplied theme.
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
      },
    },
  },
  plugins: [],
};
