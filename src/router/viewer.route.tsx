import { lazy, Suspense } from 'react'
import { Navigate, RouteObject, Outlet } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useAuthStore } from '@/stores/authStore'
import { ViewerGuard } from './guards/ViewerGuard'
import EpisodeListPage from '@/pages/client/EpisodeListPage'
import Series from '@/pages/client/Series'
import SeriesDetail from '@/pages/client/SeriesDetail'

const TikTokLanding     = lazy(() => import('@/pages/client/TikTokLanding'))
const ViewerLayout      = lazy(() => import('@/components/layout/ViewerLayout'))
const ClientProfilePage = lazy(() => import('@/pages/client/ClientProfilePage'))
const ViewerSeries      = lazy(() => import('@/pages/client/Series'))
const ViewerSeriesDetail = lazy(() => import('@/pages/client/SeriesDetail'))

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

/**
 * Layout for the root / path.
 * Redirects viewer role to /viewer; otherwise renders children.
 */
function RootHomeLayout() {
  const { role } = useAuthStore()
  if (role === 'viewer') return <Navigate to="/viewer" replace />
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  )
}


export const viewerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RootHomeLayout />,
    children: [
      {
        element: (
          <Suspense fallback={<Loader />}>
            <ViewerLayout />
          </Suspense>
        ),
        // new component add here
        children: [
          { index: true, element: <TikTokLanding /> },
          { path: 'profile', element: <ClientProfilePage /> },
          { path: 'episodes/:videoId', element: <EpisodeListPage /> },
          { path: 'series', element: <Series /> },
          { path: 'series/:videoId', element: <SeriesDetail /> }
        ],
      },
    ],
  },
  {
    path: '/viewer',
    element: <ViewerGuard />,
    children: [
      {
        element: (
          <Suspense fallback={<Loader />}>
            <ViewerLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <TikTokLanding /> },
          { path: 'profile', element: <ClientProfilePage /> },
          { path: 'episodes/:videoId', element: <EpisodeListPage /> },
          { path: 'series', element: <Series /> },
          { path: 'series/:videoId', element: <SeriesDetail /> }
        ],
      },
    ],
  },
]
