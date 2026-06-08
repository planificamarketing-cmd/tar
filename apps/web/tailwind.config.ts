import type { Config } from 'tailwindcss';

// Tokens base de marca (la guía del proyecto → Diseño). El rojo #D2103E está confirmado del
// logo. El resto de tokens definitivos (tipografías Fraunces/Inter/DM Mono y el
// degradado premium) se portan tras la firma del diseño v3 en la Fase 1.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D2103E',
          hover: '#A80D32',
        },
        navy: '#0F1B2D',
        canvas: '#FAFAF8',
        premium: {
          from: '#E4C66A',
          to: '#BE8C3C',
        },
      },
    },
  },
  plugins: [],
};

export default config;
