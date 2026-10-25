import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'

import '@/assets/styles/tokens.scss'
import '@/assets/styles/base.scss'
import '@/assets/styles/controls.scss'
import '@/assets/styles/page.scss'

const pinia = createPinia()
const session = useSessionStore(pinia)
const site = useSiteStore(pinia)
await session.refresh()
try {
  await site.load()
} catch {
  // 站点接口失败时仍打开页面，页头使用默认文案。
}

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
