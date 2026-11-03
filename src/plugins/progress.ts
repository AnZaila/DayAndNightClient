import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import type { Router } from 'vue-router'

NProgress.configure({
  minimum: 0.12,
  showSpinner: false,
  trickleSpeed: 160,
  speed: 320,
})

export function setupProgress(router: Router) {
  router.beforeEach((to, from) => {
    if (from.matched.length && to.fullPath !== from.fullPath) {
      NProgress.start()
    }
  })
  router.afterEach(() => {
    NProgress.done()
  })
  router.onError(() => {
    NProgress.done()
  })
}
