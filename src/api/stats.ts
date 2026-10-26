import type { SiteStats } from '@/types/stats'
import { request } from '@/utils/request'

export async function fetchStats() {
  const { data } = await request.get<SiteStats>('/stats')
  return data
}
