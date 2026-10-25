import type { Visibility } from '@/types/post'

export type Anniversary = {
  id: number
  title: string
  date: string
  repeatYearly: boolean
  note: string | null
  visibility: Visibility
}
