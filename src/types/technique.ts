import type { LucideIcon } from 'lucide-react'

export type Technique = {
  id: string
  label: string
  prompt_keyword: string
  description: string
}

export type TechniqueCategory = {
  id: string
  label: string
  icon: LucideIcon
  techniques: Technique[]
}
