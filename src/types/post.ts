export type Visibility = 'PUBLIC' | 'PRIVATE'
export type PostStatus = 'PUBLISHED' | 'HIDDEN'

export type PostSummary = {
  id: number
  authorId: number
  happenedAt: string
  title: string
  excerpt: string
  mood: string | null
  weather: string | null
  visibility: Visibility
  displayName: string
  coverUrl: string | null
  authorAvatarUrl: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  pinned: boolean
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
  title: string
  content: string
  happenedAt: string
  mood: string | null
  weather: string | null
  location: string | null
  visibility: Visibility
  status: PostStatus
  commentsOpen: boolean
  media: Media[]
  authorAvatarUrl: string | null
  latitude: number | null
  longitude: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  pinned: boolean
}

export type PostInput = {
  title: string
  content: string
  happenedAt: string
  mood: string
  weather: string
  location: string
  visibility: Visibility
  latitude: number | null
  longitude: number | null
}
