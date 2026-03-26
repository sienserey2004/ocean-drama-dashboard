/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#185FA5', dark: '#0C447C', light: '#E6F1FB' },
        creator: { DEFAULT: '#534AB7', light: '#EEEDFE' },
        success: { DEFAULT: '#0F6E56', light: '#E1F5EE' },
        warning: { DEFAULT: '#854F0B', light: '#FAEEDA' },
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
  corePlugins: { preflight: false },
}
