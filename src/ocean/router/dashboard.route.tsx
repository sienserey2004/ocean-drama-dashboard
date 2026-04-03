import { lazy } from 'react'
import { Navigate, RouteObject } from 'react-router-dom'
import { useAuthStore } from '@/ocean/stores/authStore'
import DashboardLayout from '@/app/layout/DashboardLayout'
import { AuthGuard } from './guards/AuthGuard'
import { AdminGuard } from './guards/AdminGuard'
import { CreatorGuard } from './guards/CreatorGuard'

// Shared pages
const AnalyticsPage    = lazy(() => import('@/ocean/pages/shared/AnalyticsPage'))
const BrowseVideosPage = lazy(() => import('@/ocean/pages/shared/BrowseVideosPage'))
const VideoDetailPage  = lazy(() => import('@/ocean/pages/shared/VideoDetailPage'))
const MyVideosPage     = lazy(() => import('@/ocean/pages/shared/MyVideosPage'))
const EpisodesPage     = lazy(() => import('@/ocean/pages/shared/EpisodesPage'))
const EarningsPage     = lazy(() => import('@/ocean/pages/shared/EarningsPage'))
const ProfilePage      = lazy(() => import('@/ocean/pages/shared/ProfilePage'))
const CreateVideoPage  = lazy(() => import('@/ocean/pages/shared/CreateVideoPage'))

// Admin pages
const AdminUsersPage      = lazy(() => import('@/ocean/pages/admin/AdminUsersPage'))
const AdminReviewPage     = lazy(() => import('@/ocean/pages/admin/AdminReviewPage'))
const AdminReportsPage    = lazy(() => import('@/ocean/pages/admin/AdminReportsPage'))
const AdminCategoriesPage = lazy(() => import('@/ocean/pages/admin/AdminCategoriesPage'))
const AdminRevenuePage    = lazy(() => import('@/ocean/pages/admin/AdminRevenuePage'))
const AdminNotifPage      = lazy(() => import('@/ocean/pages/admin/AdminNotifPage'))
const AdminDashboard      = lazy(() => import('@/ocean/pages/admin/AdminDashboard'))

function DashboardHome() {
  // const { isAdmin } = useAuthStore()
  // if (isAdmin) return <Navigate to="/dashboard/admin/stats" replace />
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
