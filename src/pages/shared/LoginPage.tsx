import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, Divider, Link,
} from '@mui/material'
import { Visibility, VisibilityOff, PlayCircle, Google } from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

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
        navigate('/viewer')
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
      setError(e?.message || 'Google sign-in failed')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlayCircle sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary">DramaStream</Typography>
              <Typography variant="caption" color="text.secondary">Dashboard Portal</Typography>
            </Box>
          </Box>

          <Typography variant="h6" mb={0.5}>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter your credentials to access the dashboard
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 1, py: 1.25 }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              sx={{ py: 1.1 }}
            >
              Continue with Google
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">Demo credentials</Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => onSubmit({ email: 'admin@drama.com', password: 'admin123' })}
              sx={{ fontSize: '0.75rem' }}
            >
              Admin demo
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              color="secondary"
              onClick={() => onSubmit({ email: 'creator@drama.com', password: 'creator123' })}
              sx={{ fontSize: '0.75rem' }}
            >
              Creator demo
            </Button>
          </Box>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" fontWeight={600}>
                Create one
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
