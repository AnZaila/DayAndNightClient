import type { Comment, CommentStatus } from '@/types/comment'
import type { Page } from '@/types/page'
import { request } from '@/utils/request'

export async function fetchComments(postId: number, page = 1, size = 10) {
  const { data } = await request.get<Page<Comment>>(`/posts/${postId}/comments`, {
    params: { page, size },
  })
  return data
}

export async function createComment(
  postId: number,
  nickname: string | null,
  content: string,
  parentId?: number | null,
) {
  const { data } = await request.post<Comment>(`/posts/${postId}/comments`, {
    nickname,
    content,
    parentId,
  })
  return data
}

export async function likeComment(id: number) {
  const { data } = await request.post<Comment>(`/comments/${id}/like`)
  return data
}

export async function fetchRecentComments(scope: 'mine' | 'manage', page = 1, size = 20) {
  const { data } = await request.get<Page<Comment>>('/comments', { params: { scope, page, size } })
  return data
}

export async function updateCommentStatus(id: number, status: CommentStatus) {
  const { data } = await request.patch<Comment>(`/comments/${id}`, { status })
  return data
}

export async function deleteComment(id: number) {
  await request.delete(`/comments/${id}`)
}
