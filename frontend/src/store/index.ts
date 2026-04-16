import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  full_name: string
  company_name?: string
  currency: string
  hourly_rate: number
  avatar_url?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  bio?: string
  website?: string
  tax_number?: string
  invoice_prefix?: string
  invoice_notes?: string
  payment_terms?: number
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: localStorage.getItem('flos_token'),
      user: null,
      isAuthenticated: !!localStorage.getItem('flos_token'),
      login: (token, user) => {
        localStorage.setItem('flos_token', token)
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('flos_token')
        set({ token: null, user: null, isAuthenticated: false })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'freelanceos-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

// ─── UI State ─────────────────────────────────────────────────────────────
interface UIState {
  sidebarCollapsed: boolean
  activeTimer: {
    running: boolean
    startTime: number | null
    projectId: number | null
    projectName: string
    description: string
  }
  toggleSidebar: () => void
  startTimer: (projectId: number | null, projectName: string, description: string) => void
  stopTimer: () => { durationMinutes: number; projectId: number | null } | null
  updateTimerDescription: (description: string) => void
}

export const useUIStore = create<UIState>()((set, get) => ({
  sidebarCollapsed: false,
  activeTimer: {
    running: false,
    startTime: null,
    projectId: null,
    projectName: '',
    description: '',
  },
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  startTimer: (projectId, projectName, description) =>
    set({
      activeTimer: {
        running: true,
        startTime: Date.now(),
        projectId,
        projectName,
        description,
      },
    }),

  stopTimer: () => {
    const { activeTimer } = get()
    if (!activeTimer.running || !activeTimer.startTime) return null
    const durationMs = Date.now() - activeTimer.startTime
    const durationMinutes = Math.round(durationMs / 60000)
    const result = {
      durationMinutes,
      projectId: activeTimer.projectId,
    }
    set({
      activeTimer: {
        running: false,
        startTime: null,
        projectId: null,
        projectName: '',
        description: '',
      },
    })
    return result
  },

  updateTimerDescription: (description) =>
    set((s) => ({
      activeTimer: { ...s.activeTimer, description },
    })),
}))
