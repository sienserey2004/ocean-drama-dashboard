import { lazy, Suspense } from 'react'
import { Navigate, RouteObject, Outlet, useLocation } from 'react-router-dom'
import { RouteLoader as Loader } from '@/_ocean/ui'
import { useAuthStore } from '@/app/stores/authStore'
import { ViewerGuard } from './guards/ViewerGuard'
import EpisodeListPage from '../module/client/episode-list/EpisodeListPage'
import SeriesDetail from '../module/client/library/components/SeriesDetail'
import Explore from '../module/client/explore/Explore'
import LibraryPage from '../module/client/library/LibraryPage'
import ProfileScreen from '../module/client/profile/ProfileScreen'
import SearchVideo from '../module/client/search-video/SearchVideo'

const TikTokLanding     = lazy(() => import('../module/client/reel/ReelMain'))
const ViewerLayout      = lazy(() => import('@/_ocean/layout/ViewerLayout'))
const ClientProfilePage = lazy(() => import('../module/client/profile/ClientProfilePage'))
const ViewerSeriesDetail = lazy(() => import('../module/client/library/components/SeriesDetail'))
const SeriesPlayerPage = lazy(() => import('../module/client/library/components/SeriesPlayerPage'))
const SubscriptionPlan = lazy(() => import('../module/client/app-studio/module/subscription-plan/SubscriptionPlan'))
const CoinsPage = lazy(() => import('../module/client/Coins/CoinsPage'))
const FavoritesPage = lazy(() => import('../module/client/favorites/FavoritesPage'))
const FollowingPage = lazy(() => import('../module/client/following/FollowingPage'))
const WatchHistoryPage = lazy(() => import('../module/client/watch-history/WatchHistoryPage'))
const CreatorProfilePage = lazy(() => import('../module/client/creator-profile/CreatorProfilePage'))
const NotificationsPage = lazy(() => import('../module/client/notifications/NotificationsPage'))

/**
 * Layout for the root / path.
 * Redirects viewer role to /viewer; otherwise renders children.
 */
function RootHomeLayout() {
  const { role } = useAuthStore()
  const location = useLocation()
  if (role === 'viewer' && location.pathname === '/') return <Navigate to="/viewer" replace />
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
          { path: 'explore', element: <Explore /> },
          { path: 'profile-screen', element: <ProfileScreen /> },
          { path: 'search', element: <SearchVideo /> },
          { path: 'subscription-plan', element: <SubscriptionPlan /> },
          { path: 'coins', element: <CoinsPage /> },
          { path: 'favorites', element: <FavoritesPage /> },
          { path: 'following', element: <FollowingPage /> },
          { path: 'watch-history', element: <WatchHistoryPage /> },
          { path: 'creator/:creatorId', element: <CreatorProfilePage /> },
          { path: 'notifications', element: <NotificationsPage /> },
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
          { path: 'play/:videoId/:episodeId?', element: <SeriesPlayerPage /> },
          { path: 'search', element: <SearchVideo /> },
        ],
      },
    ],
  },
]
