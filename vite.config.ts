import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/Stack',
      '@mui/material/Button',
      '@mui/material/IconButton',
      '@mui/material/Avatar',
      '@mui/material/Container',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  server: { port: 3000 },
})
