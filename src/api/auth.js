import http from './http'
import { getData, getPayload } from '@/core/response'

export const login = ({ username, password }) => {
  return http.post('/api/Auth/login', { username, password })
}

export const getLoginToken = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  const data = getData(payload)

  return data?.Token || data?.token || payload.token || ''
}
