import type { Site } from '@/types/site'
import { request } from '@/utils/request'

export async function fetchSite() {
  const { data } = await request.get<Site>('/site')
  return data
}

export async function updateSite(site: Omit<Site, 'daysTogether'>) {
  const { data } = await request.patch<Site>('/site', site)
  return data
}
