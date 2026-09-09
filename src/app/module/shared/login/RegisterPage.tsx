import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, PlayCircle } from 'lucide-react'
import { useAuthStore } from '@/app/stores/authStore'
import toast from '@/app/utils/toast'
import { Button, Card, CardContent, TextField, IconButton } from '@/_ocean/ui'

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
      navigate('/')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed')
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
              <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Create your account</p>
            </div>
          </div>

          <p className="mb-1 text-lg font-semibold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">Create account</p>
          <p className="mb-6 text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
            Join the creator dashboard to manage your content
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField label="Full Name" fullWidth {...register('name')} error={errors.name?.message} />
            <TextField label="Email address" type="email" fullWidth {...register('email')} error={errors.email?.message} />
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
            <TextField
              label="Confirm Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" fullWidth size="lg" disabled={isLoading} className="mt-1">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              Already have an account?{' '}
              <RouterLink to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </RouterLink>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
