import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark'

interface AppState {
  sidebarOpen: boolean
  themeMode: ThemeMode
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      themeMode: 'light',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (v) => set({ sidebarOpen: v }),
      toggleTheme: () => set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setTheme: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'app-storage',
      partialize: (s) => ({ themeMode: s.themeMode }),
    }
  )
)
