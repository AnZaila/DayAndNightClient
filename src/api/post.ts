import type { PostDetail, PostInput, PostStatus, PostSummary, Visibility } from '@/types/post'
import { request } from '@/utils/request'

export async function fetchPosts() {
  const { data } = await request.get<PostSummary[]>('/posts')
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

export async function uploadPostMedia(id: number, files: File[]) {
  const form = new FormData()
  files.forEach((file) => form.append('files', file))
  const { data } = await request.post(`/posts/${id}/media`, form)
  return data
}

export async function deletePostMedia(id: number, mediaId: number) {
  await request.delete(`/posts/${id}/media/${mediaId}`)
}

export type { Visibility }
