import type { Config } from 'tailwindcss';

// Tokens de marca. Rojo #D2103E confirmado del logo; tipografías de la familia "DM"
// confirmadas por el cliente en la ronda 2 del prototipo (DM Sans / DM Serif Display /
// DM Mono, inyectadas como variables por next/font). El degradado premium queda listo.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D2103E',
          hover: '#A80D32',
          soft: '#FFF0F2',
        },
        navy: {
          DEFAULT: '#0F1B2D',
          soft: '#1A2B47',
        },
        canvas: '#FAFAF8',
        ink: '#374151',
        muted: '#6B7280',
        line: '#E5E5E4',
        premium: {
          from: '#E4C66A',
          to: '#BE8C3C',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
