import http from './http'
import { getData, getPayload } from '@/core/response'

export const getCaptcha = () => {
  return http.get('/api/Auth/captcha')
}

export const login = ({ username, password, captchaId, captchaCode }) => {
  return http.post('/api/Auth/login', {
    Username: username,
    Password: password,
    CaptchaId: captchaId,
    CaptchaCode: captchaCode
  })
}

export const getLoginToken = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  const data = getData(payload)

  return data?.Token || data?.token || payload.token || ''
}
