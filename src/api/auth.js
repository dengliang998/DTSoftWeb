import http from './http'
import { getData, getMessage, getPayload, isSuccessPayload } from '@/core/response'

const LOGIN_DECRYPTION_FAILED_MESSAGE = '登录参数解密失败，请刷新页面后重试'

let loginEncryptionKey = null
let loginEncryptionKeyRequest = null

const getCrypto = () => {
  const cryptoApi = typeof window !== 'undefined' ? window.crypto : null

  if (!cryptoApi?.subtle) {
    throw new Error('当前浏览器环境不支持登录加密，请使用 HTTPS 或现代浏览器后重试')
  }

  return cryptoApi
}

const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer
}

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }

  return window.btoa(binary)
}

const isLoginDecryptionFailed = (response) => getMessage(response) === LOGIN_DECRYPTION_FAILED_MESSAGE

export const loadLoginEncryptionKey = ({ force = false } = {}) => {
  if (loginEncryptionKey && !force) {
    return Promise.resolve(loginEncryptionKey)
  }

  if (loginEncryptionKeyRequest && !force) {
    return loginEncryptionKeyRequest
  }

  loginEncryptionKeyRequest = http
    .get('/api/Auth/login-encryption-key')
    .then(async (response) => {
      const data = getData(response)
      const publicKey = data.PublicKey || data.publicKey
      const keyId = data.KeyId || data.keyId

      if (!publicKey || !keyId) {
        throw new Error('登录加密公钥数据不完整，请刷新页面后重试')
      }

      const key = await getCrypto().subtle.importKey(
        'spki',
        base64ToArrayBuffer(publicKey),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        false,
        ['encrypt']
      )

      loginEncryptionKey = { keyId, key }

      return loginEncryptionKey
    })
    .finally(() => {
      loginEncryptionKeyRequest = null
    })

  return loginEncryptionKeyRequest
}

export const encryptLoginText = async (text) => {
  const encryptionKey = await loadLoginEncryptionKey()
  const plainBytes = new TextEncoder().encode(String(text || ''))
  const cipherBuffer = await getCrypto().subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    encryptionKey.key,
    plainBytes
  )

  return arrayBufferToBase64(cipherBuffer)
}

export const getLoginEncryptionKeyId = () => loginEncryptionKey?.keyId || ''

export const getCaptcha = () => {
  return http.get('/api/Auth/captcha')
}

const postEncryptedLogin = async ({ username, password, captchaId, captchaCode }, forceKey = false) => {
  if (forceKey) {
    loginEncryptionKey = null
  }

  await loadLoginEncryptionKey({ force: forceKey })

  const [encryptedUsername, encryptedPassword] = await Promise.all([
    encryptLoginText(username),
    encryptLoginText(password)
  ])

  return http.post('/api/Auth/login', {
    Username: encryptedUsername,
    Password: encryptedPassword,
    EncryptionKeyId: getLoginEncryptionKeyId(),
    CaptchaId: captchaId,
    CaptchaCode: captchaCode
  })
}

export const login = async (loginForm) => {
  const response = await postEncryptedLogin(loginForm)

  if (!isSuccessPayload(response) && isLoginDecryptionFailed(response)) {
    return postEncryptedLogin(loginForm, true)
  }

  return response
}

export const getLoginToken = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  const data = getData(payload)

  return data?.Token || data?.token || payload.token || ''
}
