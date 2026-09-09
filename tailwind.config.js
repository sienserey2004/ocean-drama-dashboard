/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Single brand accent (azure) — replaces the old red/blue/indigo split.
        // Kept as `primary` so every existing bg-primary/text-primary/border-primary
        // usage across the app repoints to azure without per-file edits.
        primary: {
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
          light: '#38BDF8',
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
          glow: 'rgba(14, 165, 233, 0.4)'
        },
        creator: { DEFAULT: '#534AB7', light: '#EEEDFE' },
        success: { DEFAULT: '#0F6E56', light: '#E1F5EE' },
        warning: { DEFAULT: '#854F0B', light: '#FAEEDA' },
        // Reserved for destructive/danger actions only (delete, reject) — never brand accent.
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB' },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        bebas: ['Bebas Neue', 'cursive']
      },
      // 4-step radius scale: sm=chips/pills, xl=buttons/inputs, 2xl=cards, 3xl(stock 24px)=modals/panels.
      borderRadius: {
        'sm': '6px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0,0,0,0.2)',
        'glow': '0 0 20px rgba(14,165,233,0.4)',
      },
      backgroundImage: {
        'ocean-radial': 'radial-gradient(circle at top, rgba(14,165,233,0.25), transparent 70%)',
      }
    },
  },
  plugins: [],
  // preflight/important scoping stay as-is until MUI is fully removed (Phase 4) —
  // flipping them early would break still-MUI-dependent pages mid-migration.
  corePlugins: { preflight: false },
}
