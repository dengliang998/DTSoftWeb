import { STORAGE_KEYS } from '@/constants/storage'

export const HOME_TAB_PATH = '/welcome'

export const createDefaultTabs = () => [
  {
    path: HOME_TAB_PATH,
    title: '首页',
    cacheName: 'Welcome'
  }
]

export const shouldSkipTab = (path) => path === HOME_TAB_PATH || path === '/login'

export const getCacheNameByPath = (router, path) => {
  try {
    const resolved = router.resolve(path)
    const lastMatched = resolved?.matched?.[resolved.matched.length - 1]
    return lastMatched?.meta?.cacheName || resolved?.meta?.cacheName || resolved?.name || lastMatched?.name || ''
  } catch (e) {
    return ''
  }
}

export const buildCachedViews = (tabs = []) => {
  const unique = new Set()
  for (const tab of tabs) {
    if (tab && tab.cacheName) {
      unique.add(tab.cacheName)
    }
  }
  return Array.from(unique)
}

export const upsertTab = ({ tabs, path, title, cacheName }) => {
  const existing = tabs.find((tab) => tab.path === path)

  if (!existing) {
    tabs.push({
      path,
      title,
      cacheName
    })
    return
  }

  if (!existing.cacheName && cacheName) {
    existing.cacheName = cacheName
  }
  if ((existing.title === '页面' || !existing.title) && title && title !== '页面') {
    existing.title = title
  }
}

export const refreshTabTitles = ({ tabs, getTitle, getCacheName }) =>
  tabs.map((tab) => {
    if (!tab || !tab.path) return tab
    if (tab.path === HOME_TAB_PATH) {
      return { ...tab, title: tab.title || '首页', cacheName: tab.cacheName || 'Welcome' }
    }

    const title = getTitle(tab.path)
    return {
      ...tab,
      title: title && title !== '页面' ? title : tab.title,
      cacheName: tab.cacheName || getCacheName(tab.path)
    }
  })

export const getNextTabAfterRemove = (tabs, targetPath) => {
  const targetIndex = tabs.findIndex((tab) => tab.path === targetPath)
  if (targetIndex === -1) return null
  return tabs[targetIndex + 1] || tabs[targetIndex - 1] || null
}

export const saveActivePath = (activePath) => {
  window.sessionStorage.setItem(STORAGE_KEYS.activePath, activePath)
}
