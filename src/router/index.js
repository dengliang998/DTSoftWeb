import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from '@/core/session'
import { routes } from './routes'

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)
  if (!requiresAuth) return next()

  if (!isAuthenticated()) {
    return next({
      path: '/login',
      query: to.fullPath && to.fullPath !== '/login' ? { redirect: to.fullPath } : undefined
    })
  }

  next()
})

export default router
