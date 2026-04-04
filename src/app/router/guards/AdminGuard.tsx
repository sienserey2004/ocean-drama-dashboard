import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'

/**
 * Guard for admin-only routes.
 * Redirects to /dashboard/videos if user is not an admin.
 */
export function AdminGuard() {
  const { isAdmin } = useAuthStore()
  if (!isAdmin) return <Navigate to="/dashboard/videos" replace />
  return <Outlet />
}
