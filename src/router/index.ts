import { createRouter, createWebHistory } from 'vue-router'
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
      component: () => import('@/views/CommentsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/me',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
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
  return true
})

export default router
