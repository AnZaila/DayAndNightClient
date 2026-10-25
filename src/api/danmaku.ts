import type { Danmaku } from '@/types/danmaku'
import { request } from '@/utils/request'

export async function fetchPostDanmaku(postId: number) {
  const { data } = await request.get<Danmaku[]>(`/posts/${postId}/danmaku`)
  return data
}

export async function createPostDanmaku(
  postId: number,
  nickname: string | null,
  content: string,
  parentId?: number | null,
) {
  const { data } = await request.post<Danmaku>(`/posts/${postId}/danmaku`, { nickname, content, parentId })
  return data
}

export async function fetchMapDanmaku() {
  const { data } = await request.get<Danmaku[]>('/danmaku/map')
  return data
}

export async function createMapDanmaku(nickname: string | null, content: string, parentId?: number | null) {
  const { data } = await request.post<Danmaku>('/danmaku', { nickname, content, parentId })
  return data
}

export async function likeDanmaku(id: number) {
  const { data } = await request.post<Danmaku>(`/danmaku/${id}/like`)
  return data
}

export async function fetchRecentDanmaku() {
  const { data } = await request.get<Danmaku[]>('/danmaku')
  return data
}

export async function updateDanmakuStatus(id: number, status: Danmaku['status']) {
  const { data } = await request.patch<Danmaku>(`/danmaku/${id}`, { status })
  return data
}

export async function deleteDanmaku(id: number) {
  await request.delete(`/danmaku/${id}`)
}
