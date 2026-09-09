import { lazy, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import { RouteLoader as Loader } from '@/_ocean/ui'

const LoginPage    = lazy(() => import('@/app/module/shared/login/LoginPage'))
const RegisterPage = lazy(() => import('@/app/module/shared/login/RegisterPage'))

export const authRoutes: RouteObject[] = [
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
]
