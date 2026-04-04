/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: '#FF2D2D', 
          dark: '#CC1F1F', 
          light: '#FF5C5C' 
        },
        ocean: {
          background: { dark: '#0B0B0F', light: '#F9FAFB' },
          surface: { dark: '#14141A', light: '#FFFFFF' },
          card: { dark: '#1A1A22', light: '#FFFFFF' },
          border: { dark: '#2A2A35', light: '#E5E7EB' },
          text: { 
            primary: { dark: '#FFFFFF', light: '#111827' },
            secondary: { dark: '#A1A1AA', light: '#6B7280' }
          },
          glow: 'rgba(255, 45, 45, 0.4)'
        },
        creator: { DEFAULT: '#534AB7', light: '#EEEDFE' },
        success: { DEFAULT: '#0F6E56', light: '#E1F5EE' },
        warning: { DEFAULT: '#854F0B', light: '#FAEEDA' },
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB' },
      },
      fontFamily: { 
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        bebas: ['Bebas Neue', 'cursive']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0,0,0,0.2)',
        'glow': '0 0 20px rgba(255,45,45,0.4)',
      },
      backgroundImage: {
        'ocean-radial': 'radial-gradient(circle at top, rgba(255,45,45,0.25), transparent 70%)',
      }
    },
  },
  plugins: [],
  corePlugins: { preflight: false },
}
