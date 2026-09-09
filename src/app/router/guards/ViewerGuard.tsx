import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { Suspense } from 'react'
import { RouteLoader as Loader } from '@/_ocean/ui'

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
