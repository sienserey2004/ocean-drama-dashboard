import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, PlayCircle } from 'lucide-react'
import { useAuthStore } from '@/app/stores/authStore'
import toast from '@/app/utils/toast'
import { Button, Card, CardContent, TextField, IconButton, Divider } from '@/_ocean/ui'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.56-5.17 3.56-8.65z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1C3.26 21.3 7.28 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.3a7.2 7.2 0 010-4.6v-3.1H1.28a11.98 11.98 0 000 10.8l3.99-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.28 0 3.26 2.7 1.28 6.6l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, loginWithGoogle, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')

      const role = useAuthStore.getState().role
      if (role === 'viewer') {
        navigate('/')
      } else {
        navigate('/dashboard')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Invalid credentials')
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      await loginWithGoogle()
      toast.success('Welcome back!')

      const role = useAuthStore.getState().role
      if (role === 'viewer') {
        navigate('/viewer')
      } else {
        navigate('/dashboard')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Google sign-in failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ocean-background-light dark:bg-ocean-background-dark p-4">
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <PlayCircle size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">Ocean Drama</p>
              <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Sign in to your account</p>
            </div>
          </div>

          <p className="mb-1 text-lg font-semibold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">Sign in</p>
          <p className="mb-6 text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
            Enter your credentials to access the dashboard
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField
              label="Email address"
              type="email"
              fullWidth
              {...register('email')}
              error={errors.email?.message}
            />
            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              {...register('password')}
              error={errors.password?.message}
              endAdornment={
                <IconButton size="sm" plain onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
            />
            <Button type="submit" fullWidth size="lg" disabled={isLoading} className="mt-1">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-2">
            <Button
              variant="outlined"
              color="default"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <Divider className="flex-1" />
            <span className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Demo credentials</span>
            <Divider className="flex-1" />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="default"
              size="sm"
              fullWidth
              onClick={() => onSubmit({ email: 'admin@drama.com', password: 'admin123' })}
            >
              Admin demo
            </Button>
            <Button
              variant="outlined"
              color="default"
              size="sm"
              fullWidth
              onClick={() => onSubmit({ email: 'creator@drama.com', password: 'creator123' })}
            >
              Creator demo
            </Button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              Don't have an account?{' '}
              <RouterLink to="/register" className="font-semibold text-primary hover:underline">
                Create one
              </RouterLink>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
