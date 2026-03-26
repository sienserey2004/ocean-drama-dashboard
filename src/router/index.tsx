import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { lazy, Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Lazy pages
const LoginPage         = lazy(() => import('@/pages/shared/LoginPage'))
const AnalyticsPage     = lazy(() => import('@/pages/shared/AnalyticsPage'))
const BrowseVideosPage  = lazy(() => import('@/pages/shared/BrowseVideosPage'))
const VideoDetailPage   = lazy(() => import('@/pages/shared/VideoDetailPage'))
const MyVideosPage      = lazy(() => import('@/pages/shared/MyVideosPage'))
const EpisodesPage      = lazy(() => import('@/pages/shared/EpisodesPage'))
const EarningsPage      = lazy(() => import('@/pages/shared/EarningsPage'))
const ProfilePage       = lazy(() => import('@/pages/shared/ProfilePage'))
const RegisterPage      = lazy(() => import('@/pages/shared/RegisterPage'))
const CreateVideoPage   = lazy(() => import('@/pages/shared/CreateVideoPage'))

// Admin-only
const AdminUsersPage    = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminReviewPage   = lazy(() => import('@/pages/admin/AdminReviewPage'))
const AdminReportsPage  = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminRevenuePage  = lazy(() => import('@/pages/admin/AdminRevenuePage'))
const AdminNotifPage    = lazy(() => import('@/pages/admin/AdminNotifPage'))
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

// ─── Guards ──────────────────────────────────────────────────────────────────

function AuthGuard() {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  )
}

function AdminGuard() {
  const { isAdmin } = useAuthStore()
  if (!isAdmin) return <Navigate to="/dashboard/videos" replace />
  return <Outlet />
}

function CreatorOrAdminGuard() {
  const { isAdmin, isCreator } = useAuthStore()
  if (!isAdmin && !isCreator) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function DashboardHome() {
  const { isAdmin } = useAuthStore()
  if (isAdmin) return <Navigate to="/dashboard/admin/stats" replace />
  return <Navigate to="/dashboard/analytics" replace />
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<Loader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<Loader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true,          element: <DashboardHome /> },
          { path: 'analytics',    element: <AnalyticsPage /> },
          { path: 'browse',       element: <BrowseVideosPage /> },
          { path: 'browse/:videoId', element: <VideoDetailPage /> },
          { path: 'videos',       element: <MyVideosPage /> },
          { path: 'videos/:videoId/episodes', element: <EpisodesPage /> },
          { path: 'earnings',     element: <EarningsPage /> },
          { path: 'profile',      element: <ProfilePage /> },

          // Creator + Admin
          {
            element: <CreatorOrAdminGuard />,
            children: [
              { path: 'videos/create', element: <CreateVideoPage /> },
            ],
          },

          // Admin only
          {
            element: <AdminGuard />,
            children: [
              { path: 'admin/users',        element: <AdminUsersPage /> },
              { path: 'admin/review',       element: <AdminReviewPage /> },
              { path: 'admin/reports',      element: <AdminReportsPage /> },
              { path: 'admin/categories',   element: <AdminCategoriesPage /> },
              { path: 'admin/revenue',      element: <AdminRevenuePage /> },
              { path: 'admin/notifications', element: <AdminNotifPage /> },
              { path: 'admin/stats',        element: <AdminDashboard /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
], {
  future: {
    // @ts-expect-error - React Router v6.x uses these flags but types might be missing in some versions
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})
