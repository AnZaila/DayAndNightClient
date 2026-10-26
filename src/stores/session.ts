import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/api/auth'
import type { CurrentUser } from '@/types/auth'

export const useSessionStore = defineStore('session', () => {
  const user = ref<CurrentUser | null>(null)
  const ready = ref(false)

  async function refresh() {
    try {
      user.value = await fetchMe()
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  async function login(email: string, password: string) {
    user.value = await loginRequest(email, password)
  }

  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // 服务端会话已经不在时，本地仍然退出。
    }
    user.value = null
  }

  function expire() {
    user.value = null
  }

  return { user, ready, refresh, login, logout, expire }
})
