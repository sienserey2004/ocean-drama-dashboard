import { createBrowserRouter, Navigate } from 'react-router-dom'
import { authRoutes } from './auth.route'
import { viewerRoutes } from './viewer.route'
import { dashboardRoutes } from './dashboard.route'
import NotFoundPage from '@/app/module/shared/NotFoundPage'

export const router = createBrowserRouter(
  [
    ...authRoutes,
    ...viewerRoutes,
    ...dashboardRoutes,
    { path: '*', element: <NotFoundPage /> },
  ],
  {
    future: {
      // @ts-expect-error - React Router v6.x uses these flags but types might be missing in some versions
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)
