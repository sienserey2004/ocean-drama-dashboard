import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

/**
 * Guard for /viewer route.
 * Only role === 'viewer' can access.
 */
export function ViewerGuard() {
  const { role } = useAuthStore()
  if (role !== 'viewer') return <Navigate to="/" replace />
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  )
}
