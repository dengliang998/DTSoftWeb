import axios from 'axios'
import router from '@/router'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import { clearAuthSession, getToken } from '@/core/session'
import { getMessage, isUnauthorizedPayload } from '@/core/response'

const http = axios.create({
  timeout: 20000
})

const publicEndpoints = ['/api/Auth/login', '/api/Auth/login-encryption-key', '/api/Auth/captcha']

const isPublicEndpoint = (url = '') => publicEndpoints.some((endpoint) => url.includes(endpoint))

const redirectToLogin = () => {
  const currentRoute = router.currentRoute.value
  if (currentRoute.path !== '/login') {
    router.push({
      path: '/login',
      query:
        currentRoute.fullPath && currentRoute.fullPath !== '/login' ? { redirect: currentRoute.fullPath } : undefined
    })
  }
}

const handleUnauthorized = (message) => {
  ElMessage.warning(message || '登录已过期，请重新登录')
  clearAuthSession()
  redirectToLogin()
}

http.interceptors.request.use(
  (config) => {
    NProgress.start()
    if (!isPublicEndpoint(config.url)) {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    NProgress.done()
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response) => {
    NProgress.done()
    if (!isPublicEndpoint(response.config?.url) && isUnauthorizedPayload(response)) {
      handleUnauthorized(getMessage(response, '登录已过期，请重新登录'))
    }
    return response
  },
  (error) => {
    NProgress.done()
    if (!isPublicEndpoint(error.config?.url) && error.response?.status === 401) {
      handleUnauthorized(getMessage(error.response, '登录已过期，请重新登录'))
    }
    return Promise.reject(error)
  }
)

export default http
