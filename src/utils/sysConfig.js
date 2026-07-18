import { getSystemInfo } from '@/api/sysconfig'
import { STORAGE_KEYS } from '@/constants/storage'

export const THEME_PRESETS = Object.freeze([
  {
    key: 'ocean',
    name: '深海蓝',
    colors: {
      primary: '#1890ff',
      primaryLight: '#40a9ff',
      primaryDark: '#096dd9',
      topBg: '#1f2937',
      topBorder: '#374151',
      topText: '#d1d5db',
      topHoverBg: '#f0f9ff',
      topHoverText: '#1890ff',
      topActiveBg: '#1890ff',
      topActiveText: '#ffffff',
      sideBg: '#1f2937',
      sideBorder: '#374151',
      sideText: '#d1d5db',
      sideHoverBg: '#223449',
      sideHoverText: '#40a9ff',
      sideActiveBg: '#1890ff',
      sideActiveText: '#ffffff',
      pageBg: '#f5f7fa'
    }
  },
  {
    key: 'emerald',
    name: '松石绿',
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      primaryDark: '#047857',
      topBg: '#12332d',
      topBorder: '#1f5a4f',
      topText: '#d1fae5',
      topHoverBg: '#ecfdf5',
      topHoverText: '#047857',
      topActiveBg: '#10b981',
      topActiveText: '#ffffff',
      sideBg: '#12332d',
      sideBorder: '#1f5a4f',
      sideText: '#d1fae5',
      sideHoverBg: '#17483f',
      sideHoverText: '#34d399',
      sideActiveBg: '#10b981',
      sideActiveText: '#ffffff',
      pageBg: '#f3faf7'
    }
  },
  {
    key: 'graphite',
    name: '石墨金',
    colors: {
      primary: '#d97706',
      primaryLight: '#f59e0b',
      primaryDark: '#92400e',
      topBg: '#27272a',
      topBorder: '#3f3f46',
      topText: '#e4e4e7',
      topHoverBg: '#fffbeb',
      topHoverText: '#b45309',
      topActiveBg: '#d97706',
      topActiveText: '#ffffff',
      sideBg: '#27272a',
      sideBorder: '#3f3f46',
      sideText: '#e4e4e7',
      sideHoverBg: '#3f3f46',
      sideHoverText: '#f59e0b',
      sideActiveBg: '#d97706',
      sideActiveText: '#ffffff',
      pageBg: '#f7f7f4'
    }
  },
  {
    key: 'rose',
    name: '蔷薇红',
    colors: {
      primary: '#e11d48',
      primaryLight: '#fb7185',
      primaryDark: '#be123c',
      topBg: '#31212a',
      topBorder: '#5c2d3d',
      topText: '#ffe4e6',
      topHoverBg: '#fff1f2',
      topHoverText: '#be123c',
      topActiveBg: '#e11d48',
      topActiveText: '#ffffff',
      sideBg: '#31212a',
      sideBorder: '#5c2d3d',
      sideText: '#ffe4e6',
      sideHoverBg: '#4a2535',
      sideHoverText: '#fb7185',
      sideActiveBg: '#e11d48',
      sideActiveText: '#ffffff',
      pageBg: '#fff5f7'
    }
  }
])

export const DEFAULT_THEME_CONFIG = Object.freeze({
  mode: 'preset',
  preset: 'ocean',
  colors: THEME_PRESETS[0].colors
})

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const THEME_COLOR_KEYS = [
  'primary',
  'primaryLight',
  'primaryDark',
  'topBg',
  'topBorder',
  'topText',
  'topHoverBg',
  'topHoverText',
  'topActiveBg',
  'topActiveText',
  'sideBg',
  'sideBorder',
  'sideText',
  'sideHoverBg',
  'sideHoverText',
  'sideActiveBg',
  'sideActiveText',
  'pageBg'
]

const normalizeBase64Image = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:')) return trimmed

  // 简单识别 png/jpg，否则回退到 png
  const mime = trimmed.startsWith('iVBOR') ? 'image/png' : trimmed.startsWith('/9j/') ? 'image/jpeg' : 'image/png'

  return `data:${mime};base64,${trimmed}`
}

export const getCachedSystemName = () => localStorage.getItem(STORAGE_KEYS.systemName) || ''
export const getCachedLoginImg = () => localStorage.getItem(STORAGE_KEYS.loginImg) || ''
export const getCachedLoginImgDataUrl = () => normalizeBase64Image(getCachedLoginImg())
export const getCachedBrowserLogo = () => localStorage.getItem(STORAGE_KEYS.browserLogo) || ''
export const getCachedBrowserLogoDataUrl = () => normalizeBase64Image(getCachedBrowserLogo())

const cloneColors = (colors = DEFAULT_THEME_CONFIG.colors) => ({ ...DEFAULT_THEME_CONFIG.colors, ...colors })

const normalizeLegacyThemeColors = (colors = {}) => {
  const normalized = { ...colors }
  if (colors.navBg) {
    normalized.topBg = normalized.topBg || colors.navBg
    normalized.sideBg = normalized.sideBg || colors.navBg
  }
  if (colors.navBorder) {
    normalized.topBorder = normalized.topBorder || colors.navBorder
    normalized.sideBorder = normalized.sideBorder || colors.navBorder
  }
  if (colors.navText) {
    normalized.topText = normalized.topText || colors.navText
    normalized.sideText = normalized.sideText || colors.navText
  }
  normalized.topActiveBg = normalized.topActiveBg || colors.primary
  normalized.sideActiveBg = normalized.sideActiveBg || colors.primary
  normalized.topHoverText = normalized.topHoverText || colors.primary
  normalized.sideHoverText = normalized.sideHoverText || colors.primaryLight || colors.primary
  return normalized
}

export const getThemePreset = (presetKey) => THEME_PRESETS.find((item) => item.key === presetKey) || THEME_PRESETS[0]

export const normalizeThemeConfig = (value) => {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = null
    }
  }

  const preset = getThemePreset(parsed?.preset)
  const mode = parsed?.mode === 'custom' ? 'custom' : 'preset'
  const baseColors = mode === 'custom' ? cloneColors(preset.colors) : cloneColors(preset.colors)
  const rawColors = parsed?.colors && typeof parsed.colors === 'object' ? normalizeLegacyThemeColors(parsed.colors) : {}
  const colors = { ...baseColors }

  THEME_COLOR_KEYS.forEach((key) => {
    if (HEX_COLOR_RE.test(rawColors[key])) {
      colors[key] = rawColors[key]
    }
  })

  return {
    mode,
    preset: preset.key,
    colors
  }
}

export const serializeThemeConfig = (themeConfig) => JSON.stringify(normalizeThemeConfig(themeConfig))

export const getCachedThemeConfig = () => normalizeThemeConfig(localStorage.getItem(STORAGE_KEYS.themeConfig))

export const cacheThemeConfig = (themeConfig) => {
  localStorage.setItem(STORAGE_KEYS.themeConfig, serializeThemeConfig(themeConfig))
}

const setDocumentFavicon = (href) => {
  if (typeof document === 'undefined') return
  const normalizedHref = normalizeBase64Image(href) || '/favicon.ico'
  let icon = document.querySelector("link[rel='icon']")
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.appendChild(icon)
  }
  icon.href = normalizedHref

  let shortcutIcon = document.querySelector("link[rel='shortcut icon']")
  if (!shortcutIcon) {
    shortcutIcon = document.createElement('link')
    shortcutIcon.rel = 'shortcut icon'
    document.head.appendChild(shortcutIcon)
  }
  shortcutIcon.href = normalizedHref
}

export const applyBrowserLogo = (browserLogo = getCachedBrowserLogo()) => {
  setDocumentFavicon(browserLogo)
}

export const applyThemeConfig = (themeConfig = getCachedThemeConfig()) => {
  if (typeof document === 'undefined') return
  const normalized = normalizeThemeConfig(themeConfig)
  const rootStyle = document.documentElement.style
  rootStyle.setProperty('--dt-primary', normalized.colors.primary)
  rootStyle.setProperty('--dt-primary-light', normalized.colors.primaryLight)
  rootStyle.setProperty('--dt-primary-dark', normalized.colors.primaryDark)
  rootStyle.setProperty('--dt-top-bg', normalized.colors.topBg)
  rootStyle.setProperty('--dt-top-border', normalized.colors.topBorder)
  rootStyle.setProperty('--dt-top-text', normalized.colors.topText)
  rootStyle.setProperty('--dt-top-hover-bg', normalized.colors.topHoverBg)
  rootStyle.setProperty('--dt-top-hover-text', normalized.colors.topHoverText)
  rootStyle.setProperty('--dt-top-active-bg', normalized.colors.topActiveBg)
  rootStyle.setProperty('--dt-top-active-text', normalized.colors.topActiveText)
  rootStyle.setProperty('--dt-side-bg', normalized.colors.sideBg)
  rootStyle.setProperty('--dt-side-border', normalized.colors.sideBorder)
  rootStyle.setProperty('--dt-side-text', normalized.colors.sideText)
  rootStyle.setProperty('--dt-side-hover-bg', normalized.colors.sideHoverBg)
  rootStyle.setProperty('--dt-side-hover-text', normalized.colors.sideHoverText)
  rootStyle.setProperty('--dt-side-active-bg', normalized.colors.sideActiveBg)
  rootStyle.setProperty('--dt-side-active-text', normalized.colors.sideActiveText)
  rootStyle.setProperty('--dt-nav-bg', normalized.colors.sideBg)
  rootStyle.setProperty('--dt-nav-border', normalized.colors.sideBorder)
  rootStyle.setProperty('--dt-nav-text', normalized.colors.sideText)
  rootStyle.setProperty('--dt-page-bg', normalized.colors.pageBg)
  rootStyle.setProperty('--el-color-primary', normalized.colors.primary)
  rootStyle.setProperty('--el-color-primary-light-3', normalized.colors.primaryLight)
  rootStyle.setProperty('--el-color-primary-dark-2', normalized.colors.primaryDark)
  rootStyle.setProperty('--el-menu-active-color', normalized.colors.primary)
  rootStyle.setProperty('--el-menu-hover-text-color', normalized.colors.primary)
}

export const applyCachedSystemAppearance = () => {
  applyBrowserLogo()
  applyThemeConfig()
}

export const cacheSystemInfo = ({ systemName, loginImg, browserLogo, themeConfig }) => {
  if (typeof systemName === 'string') localStorage.setItem(STORAGE_KEYS.systemName, systemName)
  if (typeof loginImg === 'string') localStorage.setItem(STORAGE_KEYS.loginImg, loginImg)
  if (typeof browserLogo === 'string') localStorage.setItem(STORAGE_KEYS.browserLogo, browserLogo)
  if (themeConfig !== undefined && themeConfig !== null) cacheThemeConfig(themeConfig)
  applyCachedSystemAppearance()
}

export const fetchAndCacheSystemInfo = async () => {
  const { data: res } = await getSystemInfo()
  if (res?.success && res?.data) {
    const systemInfo = {
      systemName: res.data.systemName || '',
      loginImg: res.data.loginImg || '',
      browserLogo: res.data.browserLogo || ''
    }
    if (Object.prototype.hasOwnProperty.call(res.data, 'themeConfig')) {
      systemInfo.themeConfig = res.data.themeConfig || DEFAULT_THEME_CONFIG
    }
    cacheSystemInfo(systemInfo)
  }
  return res
}
