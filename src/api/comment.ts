import type { Comment, CommentStatus } from '@/types/comment'
import { request } from '@/utils/request'

export async function fetchComments(postId: number) {
  const { data } = await request.get<Comment[]>(`/posts/${postId}/comments`)
  return data
}

export async function createComment(postId: number, nickname: string | null, content: string) {
  const { data } = await request.post<Comment>(`/posts/${postId}/comments`, { nickname, content })
  return data
}

export async function fetchRecentComments() {
  const { data } = await request.get<Comment[]>('/comments')
  return data
}

export async function updateCommentStatus(id: number, status: CommentStatus) {
  const { data } = await request.patch<Comment>(`/comments/${id}`, { status })
  return data
}

export async function deleteComment(id: number) {
  await request.delete(`/comments/${id}`)
}
