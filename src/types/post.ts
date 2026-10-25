export type Visibility = 'PUBLIC' | 'PRIVATE'
export type PostStatus = 'PUBLISHED' | 'HIDDEN'

export type PostSummary = {
  id: number
  authorId: number
  happenedAt: string
  excerpt: string
  mood: string | null
  visibility: Visibility
  displayName: string
  coverUrl: string | null
}

export type Media = {
  id: number
  url: string
  width: number | null
  height: number | null
}

export type PostDetail = {
  id: number
  authorId: number
  displayName: string
  content: string
  happenedAt: string
  mood: string | null
  location: string | null
  visibility: Visibility
  status: PostStatus
  commentsOpen: boolean
  media: Media[]
}

export type PostInput = {
  content: string
  happenedAt: string
  mood: string
  location: string
  visibility: Visibility
}
