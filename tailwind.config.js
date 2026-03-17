/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра КТПро
        accent: {
          DEFAULT: '#D4A853',
          hover:   '#E8C070',
          muted:   '#D4A85333',
        },
        page: {
          DEFAULT: '#0E0E0B',
          section: '#111110',
          dark:    '#0A0A08',
          card:    '#161612',
        },
        border: {
          DEFAULT: '#2A2A22',
          subtle:  '#1E1E18',
        },
        text: {
          primary: '#F0EEE4',
          body:    '#E8E6DC',
          muted:   '#8A8A7A',
          faint:   '#6A6A60',
          ghost:   '#4A4A42',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
