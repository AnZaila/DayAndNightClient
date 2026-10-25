export type CommentStatus = 'VISIBLE' | 'HIDDEN'

export type Comment = {
  id: number
  postId: number
  nickname: string
  content: string
  status: CommentStatus
  createdAt: string
  avatarUrl: string | null
  parentId: number | null
  replyToNickname: string | null
  likeCount: number
  liked: boolean
}
