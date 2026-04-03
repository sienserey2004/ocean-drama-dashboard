import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '@/ocean/types'
import { auth } from '@/ocean/lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { authApi } from '@/ocean/api/authApi.service'
import { userApi } from '@/ocean/api/user.service'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  sessionId: number | null
  isLoading: boolean

  // computed
  isAuthenticated: boolean
  isAdmin: boolean
  isCreator: boolean
  role: Role | null

  // actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isCreator: false,
      role: null,

      setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ accessToken: access, refreshToken: refresh })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({
            email, password,
            device_type: 'web',
            device_name: navigator.userAgent.slice(0, 80),
            ip_address: '0.0.0.0',
          })
          if (res.user.status === 'deleted') {
            set({ isLoading: false })
            throw new Error('Your account has been deleted. Please contact the administrator.')
          }
          localStorage.setItem('access_token', res.access_token)
          localStorage.setItem('refresh_token', res.refresh_token)
          set({
            user: res.user,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            sessionId: res.session_id,
            isAuthenticated: true,
            isAdmin: res.user.role === 'admin',
            isCreator: res.user.role === 'creator',
            role: res.user.role,
            isLoading: false,
          })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          await authApi.register({
            name, email, password,
            login_provider: 'email',
            device_type: 'web',
            device_name: navigator.userAgent.slice(0, 80),
            ip_address: '0.0.0.0',
          })
          // Auto login after registration
          await get().login(email, password)
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true })
        try {
          const provider = new GoogleAuthProvider()
          const result = await signInWithPopup(auth, provider)
          const idToken = await result.user.getIdToken()
          
          const res = await authApi.loginGoogle(idToken)
          
          if (res.user.status === 'deleted') {
            set({ isLoading: false })
            throw new Error('Your account has been deleted. Please contact the administrator.')
          }
          localStorage.setItem('access_token', res.access_token)
          localStorage.setItem('refresh_token', res.refresh_token)
          set({
            user: res.user,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            sessionId: res.session_id,
            isAuthenticated: true,
            isAdmin: res.user.role === 'admin',
            isCreator: res.user.role === 'creator',
            role: res.user.role,
            isLoading: false,
          })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      logout: async () => {
        const refresh = get().refreshToken
        if (refresh) {
          try { await authApi.logout(refresh) } catch {}
        }
        get().clearAuth()
      },

      refreshUser: async () => {
        try {
          const user = await userApi.getMe()
          if (!user) {
            get().clearAuth()
            return
          }
          if (user.status === 'deleted') {
            get().clearAuth()
            return
          }
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isCreator: user.role === 'creator',
            role: user.role,
          })
        } catch {
          get().clearAuth()
        }
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionId: null,
          isAuthenticated: false,
          isAdmin: false,
          isCreator: false,
          role: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        sessionId: s.sessionId,
        isAuthenticated: s.isAuthenticated,
        isAdmin: s.isAdmin,
        isCreator: s.isCreator,
        role: s.role,
      }),
    }
  )
)
