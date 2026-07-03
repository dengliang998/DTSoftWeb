import { STORAGE_KEYS } from '@/constants/storage'

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export const getToken = () => getStorage()?.getItem(STORAGE_KEYS.token) || ''

export const setToken = (token) => {
  if (!token) return
  getStorage()?.setItem(STORAGE_KEYS.token, token)
}

export const getUserAccount = () => getStorage()?.getItem(STORAGE_KEYS.userAccount) || ''

export const setUserAccount = (account) => {
  if (!account) return
  getStorage()?.setItem(STORAGE_KEYS.userAccount, account)
  if (typeof document !== 'undefined') {
    document.cookie = `${STORAGE_KEYS.userAccount}=${encodeURIComponent(account)}; path=/`
  }
}

export const setAuthSession = ({ token, account }) => {
  setToken(token)
  setUserAccount(account)
}

export const clearAuthSession = () => {
  const storage = getStorage()
  storage?.removeItem(STORAGE_KEYS.token)
  storage?.removeItem(STORAGE_KEYS.userAccount)
  storage?.removeItem(STORAGE_KEYS.userInfo)

  if (typeof document !== 'undefined') {
    document.cookie = `${STORAGE_KEYS.userAccount}=; Max-Age=0; path=/`
  }
}

export const isAuthenticated = () => Boolean(getToken())
