import { lazy, Suspense } from 'react'
import { Navigate, RouteObject, Outlet } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useAuthStore } from '@/ocean/stores/authStore'
import { ViewerGuard } from './guards/ViewerGuard'
import EpisodeListPage from '@/ocean/pages/client/EpisodeListPage'
import SeriesDetail from '@/ocean/pages/client/SeriesDetail'
import Explore from '../pages/client/Explore'
import LibraryPage from '../pages/client/LibraryPage'

const TikTokLanding     = lazy(() => import('@/ocean/pages/client/TikTokLanding'))
const ViewerLayout      = lazy(() => import('@/app/layout/ViewerLayout'))
const ClientProfilePage = lazy(() => import('@/ocean/pages/client/ClientProfilePage'))
const ViewerSeriesDetail = lazy(() => import('@/ocean/pages/client/SeriesDetail'))
const SeriesPlayerPage = lazy(() => import('@/ocean/pages/client/SeriesPlayerPage'))

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
          { path: 'library', element: <LibraryPage /> },
          { path: 'library/:videoId', element: <SeriesDetail /> },
          { path: 'play/:videoId/:episodeId?', element: <SeriesPlayerPage /> },
          { path: 'explore', element: <Explore /> }
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
          { path: 'library', element: <LibraryPage /> },
          { path: 'library/:videoId', element: <SeriesDetail /> },
          { path: 'play/:videoId/:episodeId?', element: <SeriesPlayerPage /> }
        ],
      },
    ],
  },
]
