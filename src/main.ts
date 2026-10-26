import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VWave from 'v-wave'

import App from './App.vue'
import router from './router'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'
import { setUnauthorizedHandler } from '@/utils/request'

import '@/assets/styles/tokens.scss'
import '@/assets/styles/base.scss'
import '@/assets/styles/controls.scss'
import '@/assets/styles/page.scss'

const pinia = createPinia()
const session = useSessionStore(pinia)
const site = useSiteStore(pinia)

setUnauthorizedHandler(() => {
  if (!session.user) return
  session.expire()
  const current = router.currentRoute.value
  if (current.meta.requiresAuth) {
    void router.replace({ name: 'login', query: { redirect: current.fullPath } })
  }
})

await session.refresh()
try {
  await site.load()
} catch {
  // 站点接口失败时仍打开页面，页头使用默认文案。
}

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(VWave, {
  color: 'currentColor',
  initialOpacity: 0.22,
  finalOpacity: 0.08,
  duration: 0.45,
})
app.mount('#app')
