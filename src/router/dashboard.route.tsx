import { lazy } from 'react'
import { Navigate, RouteObject } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { AuthGuard } from './guards/AuthGuard'
import { AdminGuard } from './guards/AdminGuard'
import { CreatorGuard } from './guards/CreatorGuard'

// Shared pages
const AnalyticsPage    = lazy(() => import('@/pages/shared/AnalyticsPage'))
const BrowseVideosPage = lazy(() => import('@/pages/shared/BrowseVideosPage'))
const VideoDetailPage  = lazy(() => import('@/pages/shared/VideoDetailPage'))
const MyVideosPage     = lazy(() => import('@/pages/shared/MyVideosPage'))
const EpisodesPage     = lazy(() => import('@/pages/shared/EpisodesPage'))
const EarningsPage     = lazy(() => import('@/pages/shared/EarningsPage'))
const ProfilePage      = lazy(() => import('@/pages/shared/ProfilePage'))
const CreateVideoPage  = lazy(() => import('@/pages/shared/CreateVideoPage'))

// Admin pages
const AdminUsersPage      = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminReviewPage     = lazy(() => import('@/pages/admin/AdminReviewPage'))
const AdminReportsPage    = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminRevenuePage    = lazy(() => import('@/pages/admin/AdminRevenuePage'))
const AdminNotifPage      = lazy(() => import('@/pages/admin/AdminNotifPage'))
const AdminDashboard      = lazy(() => import('@/pages/admin/AdminDashboard'))

function DashboardHome() {
  const { isAdmin } = useAuthStore()
  if (isAdmin) return <Navigate to="/dashboard/admin/stats" replace />
  return <Navigate to="/dashboard/analytics" replace />
}

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true,                                element: <DashboardHome /> },
          { path: 'analytics',                          element: <AnalyticsPage /> },
          { path: 'browse',                             element: <BrowseVideosPage /> },
          { path: 'browse/:videoId',                    element: <VideoDetailPage /> },
          { path: 'videos',                             element: <MyVideosPage /> },
          { path: 'videos/:videoId/episodes',           element: <EpisodesPage /> },
          { path: 'earnings',                           element: <EarningsPage /> },
          { path: 'profile',                            element: <ProfilePage /> },

          // Creator + Admin
          {
            element: <CreatorGuard />,
            children: [
              { path: 'videos/create', element: <CreateVideoPage /> },
            ],
          },

          // Admin only
          {
            element: <AdminGuard />,
            children: [
              { path: 'admin/users',         element: <AdminUsersPage /> },
              { path: 'admin/review',        element: <AdminReviewPage /> },
              { path: 'admin/reports',       element: <AdminReportsPage /> },
              { path: 'admin/categories',    element: <AdminCategoriesPage /> },
              { path: 'admin/revenue',       element: <AdminRevenuePage /> },
              { path: 'admin/notifications', element: <AdminNotifPage /> },
              { path: 'admin/stats',         element: <AdminDashboard /> },
            ],
          },
        ],
      },
    ],
  },
]
