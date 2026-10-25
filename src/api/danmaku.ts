import type { Danmaku } from '@/types/danmaku'
import type { Page } from '@/types/page'
import { request } from '@/utils/request'

export async function fetchPostDanmaku(postId: number, page = 1, size = 20) {
  const { data } = await request.get<Page<Danmaku>>(`/posts/${postId}/danmaku`, {
    params: { page, size },
  })
  return data
}

export async function createPostDanmaku(postId: number, nickname: string | null, content: string) {
  const { data } = await request.post<Danmaku>(`/posts/${postId}/danmaku`, { nickname, content })
  return data
}

export async function fetchMapDanmaku(page = 1, size = 20) {
  const { data } = await request.get<Page<Danmaku>>('/danmaku/map', { params: { page, size } })
  return data
}

export async function createMapDanmaku(nickname: string | null, content: string) {
  const { data } = await request.post<Danmaku>('/danmaku', { nickname, content })
  return data
}

export async function likeDanmaku(id: number) {
  const { data } = await request.post<Danmaku>(`/danmaku/${id}/like`)
  return data
}

export async function fetchRecentDanmaku(page = 1, size = 20) {
  const { data } = await request.get<Page<Danmaku>>('/danmaku', { params: { page, size } })
  return data
}

export async function updateDanmakuStatus(id: number, status: Danmaku['status']) {
  const { data } = await request.patch<Danmaku>(`/danmaku/${id}`, { status })
  return data
}

export async function deleteDanmaku(id: number) {
  await request.delete(`/danmaku/${id}`)
}
