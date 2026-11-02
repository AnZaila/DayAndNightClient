import type { PublicProfile } from '@/types/auth'
import type { Comment } from '@/types/comment'
import type { Page } from '@/types/page'
import type { PostSummary } from '@/types/post'
import type { Activity } from '@/types/stats'
import { request } from '@/utils/request'

export async function fetchUser(id: number) {
  const { data } = await request.get<PublicProfile>(`/users/${id}`, { skipErrorToast: true })
  return data
}

export async function fetchUserComments(id: number, page = 1, size = 10) {
  const { data } = await request.get<Page<Comment>>(`/users/${id}/comments`, {
    params: { page, size },
    skipErrorToast: true,
  })
  return data
}

export async function fetchUserPosts(id: number, page = 1, size = 10) {
  const { data } = await request.get<Page<PostSummary>>(`/users/${id}/posts`, {
    params: { page, size },
    skipErrorToast: true,
  })
  return data
}

export async function fetchLikedPosts(id: number, page = 1, size = 10) {
  const { data } = await request.get<Page<PostSummary>>(`/users/${id}/liked-posts`, {
    params: { page, size },
    skipErrorToast: true,
  })
  return data
}

export async function fetchReceived(id: number, page = 1, size = 10) {
  const { data } = await request.get<Page<Activity>>(`/users/${id}/received`, {
    params: { page, size },
  })
  return data
}
