import axios from 'axios'
import router from '@/router'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'

const http = axios.create({
  timeout: 20000
})

http.interceptors.request.use(
  (config) => {
    NProgress.start()
    if (config.url !== '/api/Auth/login') {
      const token = localStorage.getItem('token')
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
    // 检查响应数据中的 statusCode 或 StateCode 是否为 401
    const statusCode = response.data?.statusCode || response.data?.StateCode;
    if (statusCode === 401) {
      const message = response.data?.message || response.data?.Message || '登录已过期，请重新登录';
      ElMessage.warning(message);
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login')
    }
    return response
  },
  (error) => {
    NProgress.done()
    if (error.response && error.response.status === 401) {
      const message = error.response.data?.message || error.response.data?.Message || '登录已过期，请重新登录';
      ElMessage.warning(message);
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default http
