import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/ocean/stores/authStore'
import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

export function AuthGuard() {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  )
}
