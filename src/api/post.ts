import type { Page } from '@/types/page'
import type {
  Media,
  PostDetail,
  PostInput,
  PostStatus,
  PostSummary,
  Visibility,
} from '@/types/post'
import type { PlacePin } from '@/types/place'
import { request } from '@/utils/request'

export async function fetchPosts(page = 1, size = 10, mine = false) {
  const { data } = await request.get<Page<PostSummary>>('/posts', { params: { page, size, mine } })
  return data
}

export async function fetchPlaces() {
  const { data } = await request.get<PlacePin[]>('/places')
  return data
}

export async function fetchPost(id: number) {
  const { data } = await request.get<PostDetail>(`/posts/${id}`)
  return data
}

export async function createPost(input: PostInput) {
  const { data } = await request.post<PostDetail>('/posts', input)
  return data
}

export async function updatePost(
  id: number,
  input: PostInput & { status: PostStatus; commentsOpen: boolean },
) {
  const { data } = await request.patch<PostDetail>(`/posts/${id}`, input)
  return data
}

export async function deletePost(id: number) {
  await request.delete(`/posts/${id}`)
}

export async function uploadPostCover(id: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<Media>(`/posts/${id}/media`, form)
  return data
}

export async function uploadContentImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<{ url: string }>('/media', form)
  return data
}

export async function deletePostMedia(id: number, mediaId: number) {
  await request.delete(`/posts/${id}/media/${mediaId}`)
}

export type { Visibility }
