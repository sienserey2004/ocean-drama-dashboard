import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'

/**
 * Guard for creator-only routes.
 * Allows access if the user is an admin OR a creator.
 */
export function CreatorGuard() {
  const { isAdmin, isCreator } = useAuthStore()
  if (!isAdmin && !isCreator) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
