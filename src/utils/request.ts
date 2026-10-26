import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { pushToast } from '@/composables/useToast'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Problem = {
  detail?: string
  title?: string
}

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

request.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Problem>) => {
    const status = error.response?.status ?? 0
    const detail = error.response?.data?.detail || error.response?.data?.title || '请求失败'
    const config = error.config as AxiosRequestConfig | undefined
    const loggingIn = (config?.url ?? '').includes('/auth/login')
    if (status === 401 && !loggingIn) onUnauthorized?.()
    if (!config?.skipErrorToast) pushToast(detail, 'error')
    return Promise.reject(new ApiError(detail, status))
  },
)
