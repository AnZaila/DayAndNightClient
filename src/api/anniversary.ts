import type { Anniversary } from '@/types/anniversary'
import type { Visibility } from '@/types/post'
import { request } from '@/utils/request'

export type AnniversaryInput = {
  title: string
  date: string
  repeatYearly: boolean
  note: string
  visibility: Visibility
}

export async function fetchAnniversaries() {
  const { data } = await request.get<Anniversary[]>('/anniversaries')
  return data
}

export async function createAnniversary(input: AnniversaryInput) {
  const { data } = await request.post<Anniversary>('/anniversaries', input)
  return data
}

export async function deleteAnniversary(id: number) {
  await request.delete(`/anniversaries/${id}`)
}
