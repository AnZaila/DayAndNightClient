import type { CurrentUser } from '@/types/auth'
import { request } from '@/utils/request'

export async function login(email: string, password: string) {
  const { data } = await request.post<CurrentUser>('/auth/login', { email, password })
  return data
}

export async function logout() {
  await request.post('/auth/logout')
}

export async function fetchMe() {
  const { data } = await request.get<CurrentUser>('/auth/me')
  return data
}

export async function updateProfile(displayName: string) {
  const { data } = await request.patch<CurrentUser>('/auth/me', { displayName })
  return data
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request.post<CurrentUser>('/auth/avatar', form)
  return data
}
