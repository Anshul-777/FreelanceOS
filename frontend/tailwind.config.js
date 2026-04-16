/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in':  'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'bounce-sm': 'bounceSm 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
        'card-md':  '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg':  '0 8px 24px rgba(0,0,0,0.10), 0 3px 8px rgba(0,0,0,0.06)',
        'brand':    '0 4px 14px rgba(79,70,229,0.30)',
        'brand-lg': '0 8px 28px rgba(79,70,229,0.35)',
      },
    },
  },
  plugins: [],
}
