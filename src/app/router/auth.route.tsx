import { lazy, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const LoginPage    = lazy(() => import('@/app/module/shared/login/LoginPage'))
const RegisterPage = lazy(() => import('@/app/module/shared/login/RegisterPage'))

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

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
