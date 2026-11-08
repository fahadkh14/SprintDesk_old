/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#f4f3ff', 100: '#ebe9fe', 200: '#d9d6fe', 300: '#bdb4fe', 400: '#9b8afb',
          500: '#7a5af8', 600: '#6938ef', 700: '#5925dc', 800: '#4a1fb8', 900: '#3e1c96',
        },
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)' },
    },
  },
  plugins: [],
};
