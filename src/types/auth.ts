export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'SELF'

export type CurrentUser = {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
  coverUrl: string | null
  signature: string | null
  profileVisibility: ProfileVisibility
  showSignature: boolean
  showCover: boolean
  showEmail: boolean
  showComments: boolean
  showLikes: boolean
}

export type PublicProfile = {
  id: number
  displayName: string
  avatarUrl: string | null
  coverUrl: string | null
  signature: string | null
  email: string | null
  open: boolean
  self: boolean
  showComments: boolean
  showLikes: boolean
  profileVisibility: ProfileVisibility | null
}
