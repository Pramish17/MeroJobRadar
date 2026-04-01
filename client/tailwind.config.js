/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        sand: {
          50: '#F7F6F3',
          100: '#F0EDE8',
          200: '#E8E4DC',
          300: '#D9D3C7',
          400: '#B8B0A0',
          500: '#8F8578',
          600: '#6B6258',
          700: '#4A4340',
          800: '#2D2926',
          900: '#1A1A1A',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '2000px', opacity: '1' },
        },
        slideUp: {
          '0%': { maxHeight: '2000px', opacity: '1' },
          '100%': { maxHeight: '0', opacity: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
