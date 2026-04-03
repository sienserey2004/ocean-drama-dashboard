import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, Link,
} from '@mui/material'
import { Visibility, VisibilityOff, PlayCircle } from '@mui/icons-material'
import { useAuthStore } from '@/ocean/stores/authStore'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(6, 'Min 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await registerUser(data.name, data.email, data.password)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed')
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

          <Typography variant="h6" mb={0.5}>Create account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Join the creator dashboard to manage your content
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
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
            <TextField
              label="Confirm Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 1, py: 1.25 }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
