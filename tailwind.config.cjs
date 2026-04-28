/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        material: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          primaryContainer: '#EADDFF',
          onPrimaryContainer: '#21005D',
          secondary: '#625B71',
          onSecondary: '#FFFFFF',
          secondaryContainer: '#E8DEF8',
          onSecondaryContainer: '#1D192B',
          surface: '#FEF7FF',
          onSurface: '#1D1B20',
          surfaceVariant: '#E7E0EC',
          onSurfaceVariant: '#49454F',
          outline: '#79747E',
          player1: '#6750A4',
          player2: '#006A6A',
          player3: '#FFB300',
          player4: '#D81B60',
        }
      },
      boxShadow: {
        'm3-1': '0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)',
        'm3-2': '0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)',
        'm3-3': '0 1px 3px 0 rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '28px',
      }
    },
  },
  plugins: [],
};