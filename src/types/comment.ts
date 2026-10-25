export type CommentStatus = 'VISIBLE' | 'HIDDEN'

export type Comment = {
  id: number
  postId: number
  nickname: string
  content: string
  status: CommentStatus
  createdAt: string
}
