/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sampled from the Jeewanasaviya emblem.
        navy: {
          50: '#f3f6fc', 100: '#e4eaf6', 200: '#c7d2ec', 300: '#9aaedb', 400: '#6682c2', 500: '#4262a8',
          600: '#2f4b8d', 700: '#263d74', 800: '#1c2f5c', 900: '#13224a', 950: '#0b1631',
        },
        gold: {
          50: '#fdf8ea', 100: '#faedc6', 200: '#f4d98a', 300: '#ecc155', 400: '#e0aa36', 500: '#c99227',
          600: '#a8741e', 700: '#86571c', 800: '#6f461d', 900: '#5e3b1c',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Sinhala"', '"Noto Sans Tamil"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Sinhala"', '"Noto Sans Tamil"', 'sans-serif'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(4px) scale(.99)' }, to: { opacity: 1, transform: 'none' } },
        progress: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(400%)' } },
        'soft-pulse': { '0%, 100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(.94)', opacity: .85 } },
        'page-in': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'slide-in': 'slide-in .22s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .16s ease-out',
        progress: 'progress 1.1s cubic-bezier(.4,0,.2,1) infinite',
        'soft-pulse': 'soft-pulse 1.6s ease-in-out infinite',
        'page-in': 'page-in .28s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};
