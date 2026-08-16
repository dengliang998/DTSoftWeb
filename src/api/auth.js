import http from './http'
import { getData, getMessage, getPayload, isSuccessPayload } from '@/core/response'
import { translate } from '@/i18n'

const LOGIN_DECRYPTION_FAILED_MESSAGE =
  '\u767b\u5f55\u53c2\u6570\u89e3\u5bc6\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5'

let loginEncryptionKey = null
let loginEncryptionKeyRequest = null
let forgeRequest = null

const getCrypto = () => {
  return typeof window !== 'undefined' ? window.crypto : null
}

const getForge = async () => {
  if (!forgeRequest) {
    forgeRequest = import('node-forge').then((module) => module.default || module)
  }

  return forgeRequest
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

const formatPublicKeyPem = (publicKey) => {
  const lines = String(publicKey || '').match(/.{1,64}/g) || []
  return ['-----BEGIN PUBLIC KEY-----', ...lines, '-----END PUBLIC KEY-----'].join('\n')
}

const importLoginEncryptionKey = async ({ publicKey, publicKeyPem }) => {
  const cryptoApi = getCrypto()

  if (cryptoApi?.subtle) {
    const key = await cryptoApi.subtle.importKey(
      'spki',
      base64ToArrayBuffer(publicKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    )

    return {
      type: 'webCrypto',
      key
    }
  }

  const forge = await getForge().catch(() => null)

  if (!forge) {
    throw new Error(translate('auth.cryptoUnsupported'))
  }

  return {
    type: 'forge',
    key: forge.pki.publicKeyFromPem(publicKeyPem || formatPublicKeyPem(publicKey)),
    forge
  }
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
      const publicKeyPem = data.PublicKeyPem || data.publicKeyPem
      const keyId = data.KeyId || data.keyId

      if (!publicKey || !keyId) {
        throw new Error(translate('auth.publicKeyIncomplete'))
      }

      const key = await importLoginEncryptionKey({ publicKey, publicKeyPem })

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
  const plainText = String(text || '')

  if (encryptionKey.key.type === 'forge') {
    const { forge, key } = encryptionKey.key
    const cipherText = key.encrypt(forge.util.encodeUtf8(plainText), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    })

    return window.btoa(cipherText)
  }

  const plainBytes = new TextEncoder().encode(plainText)
  const cipherBuffer = getCrypto().subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    encryptionKey.key.key,
    plainBytes
  )

  return arrayBufferToBase64(await cipherBuffer)
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
