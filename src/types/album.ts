export type AlbumKind = 'COVER' | 'ALBUM'

export type AlbumPhoto = {
  id: number
  kind: AlbumKind
  url: string
  width: number | null
  height: number | null
  postId: number | null
  takenAt: string
}
