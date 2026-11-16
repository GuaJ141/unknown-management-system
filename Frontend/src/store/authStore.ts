import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession } from '../api/auth'

interface AuthState {
  session: AuthSession | null
  signIn: (session: AuthSession) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }),
    { name: 'auth-session' },
  ),
)
