import { getSystemInfo } from '@/api/sysconfig'

const STORAGE_KEYS = {
  systemName: 'sysconfig.systemName',
  loginImg: 'sysconfig.loginImg'
}

const normalizeBase64Image = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:')) return trimmed

  // 简单识别 png/jpg，否则回退到 png
  const mime =
    trimmed.startsWith('iVBOR') ? 'image/png' :
    trimmed.startsWith('/9j/') ? 'image/jpeg' :
    'image/png'

  return `data:${mime};base64,${trimmed}`
}

export const getCachedSystemName = () => localStorage.getItem(STORAGE_KEYS.systemName) || ''
export const getCachedLoginImg = () => localStorage.getItem(STORAGE_KEYS.loginImg) || ''
export const getCachedLoginImgDataUrl = () => normalizeBase64Image(getCachedLoginImg())

export const cacheSystemInfo = ({ systemName, loginImg }) => {
  if (typeof systemName === 'string') localStorage.setItem(STORAGE_KEYS.systemName, systemName)
  if (typeof loginImg === 'string') localStorage.setItem(STORAGE_KEYS.loginImg, loginImg)
}

export const fetchAndCacheSystemInfo = async () => {
  const { data: res } = await getSystemInfo()
  if (res?.success && res?.data) {
    cacheSystemInfo({
      systemName: res.data.systemName || '',
      loginImg: res.data.loginImg || ''
    })
  }
  return res
}

