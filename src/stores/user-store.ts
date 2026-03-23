"use client"

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  user_metadata?: {
    nickname?: string
    avatar_url?: string
  }
}

interface UserStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
  signOut: () => Promise<void>
}

// Prevent concurrent auth requests
let fetchPromise: Promise<void> | null = null

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  fetchUser: async () => {
    // If already fetching, wait for it instead of starting another
    if (fetchPromise) {
      return fetchPromise
    }

    fetchPromise = (async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.warn('Auth getUser error:', error.message)
        }
        set({ user, loading: false })
      } catch (err) {
        console.warn('Auth fetch failed:', err)
        set({ user: null, loading: false })
      } finally {
        fetchPromise = null
      }
    })()

    return fetchPromise
  },
  signOut: async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out failed:', err)
    }
    set({ user: null })
  },
}))
