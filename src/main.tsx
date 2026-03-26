import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import { router } from '@/router'
import { lightTheme, darkTheme } from '@/utils/theme'
import { useAppStore } from '@/stores/appStore'
import './index.css'

function AppRoot() {
  const themeMode = useAppStore((s) => s.themeMode)
  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '13px', borderRadius: '8px' },
        }}
      />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
)
