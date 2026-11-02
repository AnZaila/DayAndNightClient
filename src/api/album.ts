import type { AlbumPhoto } from '@/types/album'
import type { Page } from '@/types/page'
import { request } from '@/utils/request'

export async function fetchAlbum(page = 1, size = 24) {
  const { data } = await request.get<Page<AlbumPhoto>>('/album', {
    params: { page, size },
  })
  return data
}

export async function uploadAlbumPhoto(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<AlbumPhoto>('/album', form)
  return data
}

export async function deleteAlbumPhoto(id: number) {
  await request.delete(`/album/${id}`)
}
