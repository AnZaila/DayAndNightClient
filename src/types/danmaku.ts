export type Danmaku = {
  id: number
  postId: number | null
  nickname: string
  content: string
  status: 'VISIBLE' | 'HIDDEN'
  createdAt: string
  parentId: number | null
  replyToNickname: string | null
  likeCount: number
  liked: boolean
  avatarUrl: string | null
  userId: number | null
}
