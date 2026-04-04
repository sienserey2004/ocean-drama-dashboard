import { lazy } from 'react'
import { Navigate, RouteObject } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import DashboardLayout from '@/_ocean/layout/DashboardLayout'
import { AuthGuard } from './guards/AuthGuard'
import { AdminGuard } from './guards/AdminGuard'
import { CreatorGuard } from './guards/CreatorGuard'

// Shared pages
const AnalyticsPage    = lazy(() => import('@/app/module/shared/analytics/AnalyticsPage'))
const BrowseVideosPage = lazy(() => import('@/app/module/shared/browse/BrowseVideosPage'))
const VideoDetailPage  = lazy(() => import('@/app/module/shared/my-videos/VideoDetailPage'))
const MyVideosPage     = lazy(() => import('@/app/module/shared/my-videos/MyVideosPage'))
const EpisodesPage     = lazy(() => import('@/app/module/shared/episodes/EpisodesPage'))
const EarningsPage     = lazy(() => import('@/app/module/shared/earnings/EarningsPage'))
const ProfilePage      = lazy(() => import('@/app/module/shared/profile/ProfilePage'))
const CreateVideoPage  = lazy(() => import('@/app/module/shared/video/CreateVideoPage'))

// Admin pages
const AdminUsersPage      = lazy(() => import('@/app/module/admin/users/AdminUsersPage'))
const AdminReviewPage     = lazy(() => import('@/app/module/admin/review/AdminReviewPage'))
const AdminReportsPage    = lazy(() => import('@/app/module/admin/report/AdminReportsPage'))
const AdminCategoriesPage = lazy(() => import('@/app/module/admin/category/AdminCategoriesPage'))
const AdminRevenuePage    = lazy(() => import('@/app/module/admin/Revenue/AdminRevenuePage'))
const AdminNotifPage      = lazy(() => import('@/app/module/admin/notification/AdminNotifPage'))
const AdminDashboard      = lazy(() => import('@/app/module/admin/dashboard/AdminDashboard'))

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
