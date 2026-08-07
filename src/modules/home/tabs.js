import { STORAGE_KEYS } from '@/constants/storage'
import { translate } from '@/i18n'

export const shouldSkipTab = (path) => path === '/login' || path === '/home'

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
  const pageTitle = translate('tabs.page')
  if ((existing.title === pageTitle || !existing.title) && title && title !== pageTitle) {
    existing.title = title
  }
}

export const refreshTabTitles = ({ tabs, getTitle, getCacheName }) =>
  tabs.map((tab) => {
    if (!tab || !tab.path) return tab

    const title = getTitle(tab.path)
    return {
      ...tab,
      title: title && title !== translate('tabs.page') ? title : tab.title,
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
