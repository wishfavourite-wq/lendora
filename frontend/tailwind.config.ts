import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        copper: {
          DEFAULT: '#C87941',
          light: '#E09B6A',
          dark: '#9A5C2E',
          50: 'rgba(200,121,65,0.05)',
          100: 'rgba(200,121,65,0.10)',
          200: 'rgba(200,121,65,0.20)',
        },
        forest: {
          DEFAULT: '#0A3D2E',
          light: '#1A6B50',
          dark: '#062518',
        },
        gold: {
          DEFAULT: '#D4A843',
          light: '#E8C670',
          dark: '#A8832A',
        },
        ink: {
          900: '#1C1410',
          800: '#2D2420',
          700: '#3E3430',
          600: '#5D4F49',
          500: '#7A6E6A',
          400: '#9E9490',
          300: '#C5BCB8',
          200: '#E1D9D4',
          100: '#F0EBE6',
          50:  '#F9F6F2',
        },
        surface: {
          bg:      '#0E0B09',
          base:    '#1A1410',
          raised:  '#252018',
          overlay: '#302820',
        },
      },
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
        jakarta:  ['var(--font-jakarta)',  'system-ui', 'sans-serif'],
        mono:     ['var(--font-mono)',     'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(28,20,16,.10)',
        'warm-md': '0 4px 12px rgba(28,20,16,.14)',
        'warm-lg': '0 8px 24px rgba(28,20,16,.18)',
        'warm-xl': '0 16px 48px rgba(28,20,16,.22)',
        'copper':    '0 0 0 2px rgba(200,121,65,.28), 0 4px 16px rgba(200,121,65,.18)',
        'copper-lg': '0 0 0 2px rgba(200,121,65,.35), 0 8px 32px rgba(200,121,65,.25)',
        'dark-md':   '0 4px 12px rgba(0,0,0,.35)',
        'dark-lg':   '0 8px 24px rgba(0,0,0,.45)',
      },
      animation: {
        float:      'float 6s ease-in-out infinite',
        shimmer:    'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'fade-up':  'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
        'shimmer-dark':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}

export default config
