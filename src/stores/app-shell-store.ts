import { create } from 'zustand'

export type AppShellState = {
  leftOpen: boolean
  rightOpen: boolean
  knowledgeOpen: boolean
  toggleLeft: () => void
  toggleRight: () => void
  setLeftOpen: (v: boolean) => void
  setRightOpen: (v: boolean) => void
  setKnowledgeOpen: (v: boolean) => void
}

export const useAppShellStore = create<AppShellState>((set) => ({
  leftOpen: false,
  rightOpen: true,
  knowledgeOpen: false,
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  setLeftOpen: (v) => set({ leftOpen: v }),
  setRightOpen: (v) => set({ rightOpen: v }),
  setKnowledgeOpen: (v) => set({ knowledgeOpen: v }),
}))
