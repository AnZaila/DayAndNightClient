export type Visibility = 'PUBLIC' | 'PRIVATE'
export type PostStatus = 'PUBLISHED' | 'HIDDEN'

export type PostSummary = {
  id: number
  authorId: number
  happenedAt: string
  excerpt: string
  mood: string | null
  weather: string | null
  visibility: Visibility
  displayName: string
  coverUrl: string | null
  authorAvatarUrl: string | null
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
  weather: string | null
  location: string | null
  visibility: Visibility
  status: PostStatus
  commentsOpen: boolean
  media: Media[]
  authorAvatarUrl: string | null
  latitude: number | null
  longitude: number | null
}

export type PostInput = {
  content: string
  happenedAt: string
  mood: string
  weather: string
  location: string
  visibility: Visibility
  latitude: number | null
  longitude: number | null
}
