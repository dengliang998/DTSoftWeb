import http from './http'
import { getData, getMessage, getPayload, isSuccessPayload } from '@/core/response'
import { translate } from '@/i18n'

const LOGIN_DECRYPTION_FAILED_MESSAGE =
  '\u767b\u5f55\u53c2\u6570\u89e3\u5bc6\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5'

let loginEncryptionKey = null
let loginEncryptionKeyRequest = null

const getCrypto = () => {
  const cryptoApi = typeof window !== 'undefined' ? window.crypto : null

  if (!cryptoApi?.subtle) {
    throw new Error(translate('auth.cryptoUnsupported'))
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

const isLoginDecryptionFailed = (response) => {
  const message = getMessage(response)
  return message === translate('auth.loginDecryptionFailed') || message === LOGIN_DECRYPTION_FAILED_MESSAGE
}

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
        throw new Error(translate('auth.publicKeyIncomplete'))
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
