import { create } from 'zustand'
import { TECHNIQUE_CATEGORIES } from '@/lib/constants'
import type { TechniqueCategory } from '@/types'

type TechniqueState = {
  categories: TechniqueCategory[]
}

export const useTechniqueStore = create<TechniqueState>(() => ({
  categories: TECHNIQUE_CATEGORIES,
}))
