import { create } from 'zustand'
import { subscriptionApi } from '@/app/api/subscription.service'
import { UserSubscription } from '@/app/types'

interface SubscriptionState {
  subscription: UserSubscription | null
  isLoading: boolean
  hasFetched: boolean

  // actions
  fetchSubscription: () => Promise<void>
  setSubscription: (sub: UserSubscription | null) => void
  clearSubscription: () => void
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  isLoading: false,
  hasFetched: false,

  setSubscription: (sub) => set({ subscription: sub }),

  fetchSubscription: async () => {
    set({ isLoading: true })
    try {
      const sub = await subscriptionApi.getMySubscription()
      set({ subscription: sub, hasFetched: true, isLoading: false })
    } catch (error) {
      set({ subscription: null, hasFetched: true, isLoading: false })
      // We don't necessarily want to throw here, as not having a subscription is a valid state (404/empty)
      console.error('Failed to fetch subscription:', error)
    }
  },

  clearSubscription: () => set({ subscription: null, hasFetched: false })
}))
