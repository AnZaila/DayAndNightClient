export type MonthStat = {
  month: string
  posts: number
  views: number
}

export type NamedCount = {
  name: string
  count: number
}

export type SiteStats = {
  posts: number
  views: number
  likes: number
  comments: number
  months: MonthStat[]
  moods: NamedCount[]
}

export type Activity = {
  kind: 'POST_LIKE' | 'COMMENT_LIKE' | 'COMMENT'
  createdAt: string
  actorName: string
  actorAvatarUrl: string | null
  actorUserId: number | null
  postId: number
  excerpt: string
  commentContent: string | null
}
