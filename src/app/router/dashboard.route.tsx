import { lazy } from 'react'
import { Navigate, RouteObject } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import DashboardLayout from '@/_ocean/layout/DashboardLayout'
import { AuthGuard } from './guards/AuthGuard'
import { CreatorGuard } from './guards/CreatorGuard'
// Shared pages
const AnalyticsPage = lazy(() => import('@/app/module/shared/analytics/AnalyticsPage'))
const BrowseVideosPage = lazy(() => import('@/app/module/shared/browse/BrowseVideosPage'))
const VideoDetailPage = lazy(() => import('@/app/module/shared/my-videos/VideoDetailPage'))
const MyVideosPage = lazy(() => import('@/app/module/shared/my-videos/MyVideosPage'))
const EpisodesPage = lazy(() => import('@/app/module/shared/episodes/EpisodesPage'))
const EarningsPage = lazy(() => import('@/app/module/shared/earnings/EarningsPage'))
const ProfilePage = lazy(() => import('@/app/module/shared/profile/ProfilePage'))
const CreateVideoPage = lazy(() => import('@/app/module/shared/video/CreateVideoPage'))
const AppStudioDashboard = lazy(() => import('@/app/module/client/app-studio/module/dasboard/Dashboard'))

function DashboardHome() {
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
          { index: true, element: <DashboardHome /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'browse', element: <BrowseVideosPage /> },
          { path: 'browse/:videoId', element: <VideoDetailPage /> },
          { path: 'videos', element: <MyVideosPage /> },
          { path: 'videos/:videoId/episodes', element: <EpisodesPage /> },
          { path: 'earnings', element: <EarningsPage /> },
          { path: 'profile', element: <ProfilePage /> },

          // Creator + Admin only
          {
            element: <CreatorGuard />,
            children: [
              { path: 'app-studio', element: <AppStudioDashboard /> },
              { path: 'videos/create', element: <CreateVideoPage /> },
            ],
          },
        ],
      },
    ],
  },
]
