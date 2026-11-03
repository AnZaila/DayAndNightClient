import { createRouter, createWebHistory } from 'vue-router'
import { forgetPostBackground, rememberPostBackground } from '@/composables/usePostOverlay'
import { setupProgress } from '@/plugins/progress'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'timeline',
      component: () => import('@/views/TimelineView.vue'),
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/MapView.vue'),
    },
    {
      path: '/album',
      name: 'album',
      component: () => import('@/views/AlbumView.vue'),
    },
    {
      path: '/posts/:id',
      name: 'post',
      component: () => import('@/views/PostDetailView.vue'),
    },
    {
      path: '/write/:id?',
      name: 'write',
      component: () => import('@/views/WriteView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
    },
    {
      path: '/anniversaries',
      name: 'anniversaries',
      component: () => import('@/views/AnniversaryView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/comments',
      name: 'comments',
      component: () => import('@/views/CommentsManageView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/me',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:id',
      name: 'user',
      component: () => import('@/views/UserHomeView.vue'),
    },
  ],
  scrollBehavior(to, from, saved) {
    if (to.name === 'post' || from.name === 'post') return false
    if (saved) return saved
    return { top: 0 }
  },
})

router.beforeEach(async (to, from) => {
  rememberPostBackground(to, from)
  const session = useSessionStore()
  if (!session.ready) {
    await session.refresh()
  }
  if (to.meta.requiresAuth && !session.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && session.user) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : { name: 'timeline' }
  }
  if (to.name === 'user' && session.user) {
    const id = Number(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id)
    if (id === session.user.id) return { name: 'profile' }
  }
  return true
})

router.afterEach((to) => {
  forgetPostBackground(to)
})

setupProgress(router)

export default router
