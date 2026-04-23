import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach token ───────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 / errors ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status

    if (status === 401) {
      // Use the store instance to get current state
      const { refreshToken, setTokens, clearAuth } = (await import('@/app/stores/authStore')).useAuthStore.getState()
      const refresh = refreshToken || localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh-token`,
            { refresh_token: refresh }
          )
          
          // Use store's setTokens to keep store and localStorage in sync
          setTokens(data.access_token, data.refresh_token)

          if (error.config && error.config.headers) {
            error.config.headers.Authorization = `Bearer ${data.access_token}`
            return api.request(error.config)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          clearAuth()
          window.location.href = '/login'
        }
      } else {
        clearAuth()
        window.location.href = '/login'
      }
    }

    const msg = error.response?.data?.message || 'Something went wrong'
    if (status !== 401) toast.error(msg)
    return Promise.reject(error)
  }
)

export default api
