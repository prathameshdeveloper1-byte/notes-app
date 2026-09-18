/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        paper: {
          50:  '#fdfbf7',
          100: '#faf6ee',
          200: '#f4ead8',
          300: '#ebd9bc',
          400: '#dfc49a',
          500: '#cfaa74',
        },
        ink: {
          50:  '#f7f7f7',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b4b4b4',
          400: '#888888',
          500: '#5c5c5c',
          600: '#3f3f3f',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0d0d0d',
        },
      },
      boxShadow: {
        page: '2px 4px 12px rgba(0,0,0,0.10), 4px 8px 24px rgba(0,0,0,0.06)',
        book: '4px 0 16px rgba(0,0,0,0.15), 8px 0 32px rgba(0,0,0,0.08)',
        card: '0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
