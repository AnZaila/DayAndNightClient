import axios, { type AxiosError } from 'axios'

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

request.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Problem>) => {
    const status = error.response?.status ?? 0
    const detail = error.response?.data?.detail || error.response?.data?.title || '请求失败'
    return Promise.reject(new ApiError(detail, status))
  },
)
