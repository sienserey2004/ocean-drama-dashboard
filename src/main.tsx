import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { router } from '@/app/router/index.route'
import { lightTheme, darkTheme } from '@/app/utils/theme'
import { useAppStore } from '@/app/stores/appStore'
import './index.css'

function AppRoot() {
  const themeMode = useAppStore((s) => s.themeMode)
  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
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
