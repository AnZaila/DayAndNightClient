import type { CurrentUser, ProfileVisibility } from '@/types/auth'
import { request } from '@/utils/request'

export async function login(email: string, password: string) {
  const { data } = await request.post<CurrentUser>('/auth/login', { email, password })
  return data
}

export async function logout() {
  await request.post('/auth/logout', null, { skipErrorToast: true })
}

export async function fetchMe() {
  const { data } = await request.get<CurrentUser>('/auth/me', { skipErrorToast: true })
  return data
}

export async function updateProfile(
  displayName: string,
  signature: string,
  profileVisibility: ProfileVisibility,
  showSignature: boolean,
  showCover: boolean,
  showEmail: boolean,
  showComments: boolean,
  showLikes: boolean,
) {
  const { data } = await request.patch<CurrentUser>('/auth/me', {
    displayName,
    signature,
    profileVisibility,
    showSignature,
    showCover,
    showEmail,
    showComments,
    showLikes,
  })
  return data
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<CurrentUser>('/auth/avatar', form)
  return data
}

export async function uploadCover(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<CurrentUser>('/auth/cover', form)
  return data
}
