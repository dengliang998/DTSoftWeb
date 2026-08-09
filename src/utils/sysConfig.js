import { getSystemInfo } from '@/api/sysconfig'
import { STORAGE_KEYS } from '@/constants/storage'

export const THEME_PRESETS = Object.freeze([
  {
    key: 'ocean',
    nameKey: 'systemSettings.themePreset.ocean',
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
    key: 'workbenchGreen',
    nameKey: 'systemSettings.themePreset.workbenchGreen',
    colors: {
      primary: '#0f766e',
      primaryLight: '#0f9f8f',
      primaryDark: '#115e59',
      topBg: '#12332d',
      topBorder: '#1f5a4f',
      topText: '#d1fae5',
      topHoverBg: '#effbf8',
      topHoverText: '#0f766e',
      topActiveBg: '#0f766e',
      topActiveText: '#ffffff',
      sideBg: '#12332d',
      sideBorder: '#1f5a4f',
      sideText: '#d1fae5',
      sideHoverBg: '#17483f',
      sideHoverText: '#0f9f8f',
      sideActiveBg: '#0f766e',
      sideActiveText: '#ffffff',
      pageBg: '#f5fbfa'
    }
  },
  {
    key: 'emerald',
    nameKey: 'systemSettings.themePreset.emerald',
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
    nameKey: 'systemSettings.themePreset.graphite',
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
    nameKey: 'systemSettings.themePreset.rose',
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

export const DEFAULT_APPEARANCE = 'light'

const APPEARANCE_PALETTES = Object.freeze({
  light: {
    bg: '#f5f7fa',
    surface: '#ffffff',
    surfaceSoft: '#f8fafc',
    border: '#dde5ef',
    borderStrong: '#c9d5e4',
    text: '#182230',
    textMuted: '#667085',
    danger: '#e5484d',
    dangerSoft: '#feecec',
    shadow: '0 14px 36px rgba(18, 38, 63, 0.1)',
    shadowSoft: '0 8px 22px rgba(18, 38, 63, 0.06)'
  },
  dark: {
    bg: '#0b1220',
    surface: '#111827',
    surfaceSoft: '#172033',
    border: '#263244',
    borderStrong: '#3b4a60',
    text: '#e5eef8',
    textMuted: '#9aa8ba',
    danger: '#ff6b6f',
    dangerSoft: '#3a1f28',
    shadow: '0 18px 44px rgba(0, 0, 0, 0.34)',
    shadowSoft: '0 10px 28px rgba(0, 0, 0, 0.24)'
  }
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

export const normalizeBase64Image = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:')) return trimmed

  // 简单识别 png/jpg，否则回退到 png
  const mime = trimmed.startsWith('iVBOR') ? 'image/png' : trimmed.startsWith('/9j/') ? 'image/jpeg' : 'image/png'

  return `data:${mime};base64,${trimmed}`
}

const isStorageQuotaError = (error) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014)

const safeSetLocalStorage = (key, value, options = {}) => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (options.removeOnQuotaExceeded && isStorageQuotaError(error)) {
      try {
        localStorage.removeItem(key)
      } catch {}
    }
    return false
  }
}

export const getCachedSystemName = () => localStorage.getItem(STORAGE_KEYS.systemName) || ''
export const getCachedLoginImg = () => localStorage.getItem(STORAGE_KEYS.loginImg) || ''
export const getCachedLoginImgDataUrl = () => normalizeBase64Image(getCachedLoginImg())
export const getCachedLoginCaptchaEnabled = () => localStorage.getItem(STORAGE_KEYS.loginCaptchaEnabled) !== 'false'
export const getCachedBrowserLogo = () => localStorage.getItem(STORAGE_KEYS.browserLogo) || ''
export const getCachedBrowserLogoDataUrl = () => normalizeBase64Image(getCachedBrowserLogo())
export const normalizeAppearance = (appearance) => (appearance === 'dark' ? 'dark' : DEFAULT_APPEARANCE)
export const getCachedAppearance = () => normalizeAppearance(localStorage.getItem(STORAGE_KEYS.appearance))
export const cacheAppearance = (appearance) => {
  safeSetLocalStorage(STORAGE_KEYS.appearance, normalizeAppearance(appearance))
}

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
export const getAppearancePalette = (appearance) =>
  appearance === 'dark' ? APPEARANCE_PALETTES.dark : APPEARANCE_PALETTES.light

const getDarkShellColors = (colors) => ({
  topBg: '#0f172a',
  topBorder: '#233047',
  topText: '#dbe7f3',
  topHoverBg: `color-mix(in srgb, ${colors.primary} 18%, #111827)`,
  topHoverText: colors.primaryLight,
  topActiveBg: colors.primary,
  topActiveText: '#ffffff',
  sideBg: '#0b1220',
  sideBorder: '#233047',
  sideText: '#cbd5e1',
  sideHoverBg: `color-mix(in srgb, ${colors.primary} 16%, #111827)`,
  sideHoverText: colors.primaryLight,
  sideActiveBg: colors.primary,
  sideActiveText: '#ffffff'
})

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

export const resolveThemeRuntime = (themeConfig = getCachedThemeConfig(), appearance = getCachedAppearance()) => {
  const normalized = normalizeThemeConfig(themeConfig)
  const resolvedAppearance = normalizeAppearance(appearance)
  const palette = getAppearancePalette(resolvedAppearance)
  const shellColors = resolvedAppearance === 'dark' ? getDarkShellColors(normalized.colors) : normalized.colors
  const runtimeColors = {
    ...normalized.colors,
    ...shellColors,
    pageBg: resolvedAppearance === 'dark' ? palette.bg : normalized.colors.pageBg
  }

  return {
    normalized,
    appearance: resolvedAppearance,
    palette,
    runtimeColors
  }
}

export const serializeThemeConfig = (themeConfig) => JSON.stringify(normalizeThemeConfig(themeConfig))

export const getCachedThemeConfig = () => normalizeThemeConfig(localStorage.getItem(STORAGE_KEYS.themeConfig))

export const cacheThemeConfig = (themeConfig) => {
  safeSetLocalStorage(STORAGE_KEYS.themeConfig, serializeThemeConfig(themeConfig))
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

let themeTransitionTimer = null
let themeTransitionWarmed = false
const THEME_COVER_DURATION = 860
const THEME_COVER_FADE_DURATION = 260

const getThemeTransitionPoint = (options = {}) => {
  const sourceEvent = options.sourceEvent
  if (sourceEvent && Number.isFinite(sourceEvent.clientX) && Number.isFinite(sourceEvent.clientY)) {
    return {
      x: sourceEvent.clientX,
      y: sourceEvent.clientY
    }
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }
}

const getThemeTransitionRadius = ({ x, y }) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 96

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const finishThemeTransition = () => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('theme-switching')
  if (themeTransitionTimer) {
    window.clearTimeout(themeTransitionTimer)
    themeTransitionTimer = null
  }
}

const runFallbackThemeCover = (applyTheme, options = {}) => {
  const point = getThemeTransitionPoint(options)
  const radius = getThemeTransitionRadius(point)
  const overlay = document.createElement('div')

  document.querySelectorAll('.theme-cover-overlay').forEach((node) => node.remove())
  overlay.className = 'theme-cover-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.setProperty('--theme-cover-x', `${point.x}px`)
  overlay.style.setProperty('--theme-cover-y', `${point.y}px`)
  overlay.style.setProperty('--theme-cover-radius', `${radius}px`)
  overlay.style.setProperty('--theme-cover-bg', getAppearancePalette(options.appearance).bg)

  document.body.appendChild(overlay)

  window.requestAnimationFrame(() => {
    overlay.classList.add('is-expanding')
  })

  themeTransitionTimer = window.setTimeout(() => {
    applyTheme()
    themeTransitionWarmed = true
    window.requestAnimationFrame(() => {
      overlay.classList.add('is-fading')
      window.setTimeout(() => {
        overlay.remove()
        finishThemeTransition()
      }, THEME_COVER_FADE_DURATION)
    })
  }, THEME_COVER_DURATION)
}

const startThemeTransition = (applyTheme, options = {}) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (prefersReducedMotion()) {
    applyTheme()
    return
  }

  if (themeTransitionTimer) {
    window.clearTimeout(themeTransitionTimer)
  }

  if (typeof document.startViewTransition !== 'function' || !themeTransitionWarmed) {
    runFallbackThemeCover(applyTheme, options)
    return
  }

  const point = getThemeTransitionPoint(options)
  const radius = getThemeTransitionRadius(point)
  const transition = document.startViewTransition(() => {
    applyTheme()
  })

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${point.x}px ${point.y}px)`, `circle(${radius}px at ${point.x}px ${point.y}px)`]
        },
        {
          duration: THEME_COVER_DURATION,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    })
    .catch(() => {})

  transition.finished.finally(() => {
    themeTransitionWarmed = true
    finishThemeTransition()
  })
}

export const warmThemeTransition = () => {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    typeof document.startViewTransition !== 'function' ||
    prefersReducedMotion() ||
    themeTransitionWarmed
  ) {
    return
  }

  const runWarmup = () => {
    if (themeTransitionWarmed || themeTransitionTimer || document.querySelector('.theme-cover-overlay')) return
    try {
      const transition = document.startViewTransition(() => {})
      transition.finished.finally(() => {
        themeTransitionWarmed = true
      })
    } catch {
      themeTransitionWarmed = true
    }
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(runWarmup, { timeout: 1200 })
  } else {
    window.setTimeout(runWarmup, 300)
  }
}

export const applyThemeConfig = (themeConfig = getCachedThemeConfig(), appearance = getCachedAppearance()) => {
  if (typeof document === 'undefined') return
  const { appearance: resolvedAppearance, palette, runtimeColors } = resolveThemeRuntime(themeConfig, appearance)
  const rootStyle = document.documentElement.style
  const primaryMixBase = palette.surface

  document.documentElement.dataset.theme = resolvedAppearance
  document.documentElement.classList.toggle('dark', resolvedAppearance === 'dark')
  rootStyle.setProperty('color-scheme', resolvedAppearance)
  rootStyle.setProperty('--dt-primary', runtimeColors.primary)
  rootStyle.setProperty('--dt-primary-light', runtimeColors.primaryLight)
  rootStyle.setProperty('--dt-primary-dark', runtimeColors.primaryDark)
  rootStyle.setProperty('--dt-primary-hover', runtimeColors.primaryDark)
  rootStyle.setProperty('--dt-primary-soft', `color-mix(in srgb, ${runtimeColors.primary} 14%, ${primaryMixBase})`)
  rootStyle.setProperty('--dt-primary-subtle', `color-mix(in srgb, ${runtimeColors.primary} 8%, ${primaryMixBase})`)
  rootStyle.setProperty('--dt-primary-border', `color-mix(in srgb, ${runtimeColors.primary} 38%, ${palette.border})`)
  rootStyle.setProperty('--dt-primary-focus', `color-mix(in srgb, ${runtimeColors.primary} 18%, transparent)`)
  rootStyle.setProperty('--dt-accent', runtimeColors.primaryLight)
  rootStyle.setProperty('--dt-accent-soft', `color-mix(in srgb, ${runtimeColors.primaryLight} 14%, ${primaryMixBase})`)
  rootStyle.setProperty('--dt-top-bg', runtimeColors.topBg)
  rootStyle.setProperty('--dt-top-border', runtimeColors.topBorder)
  rootStyle.setProperty('--dt-top-text', runtimeColors.topText)
  rootStyle.setProperty('--dt-top-hover-bg', runtimeColors.topHoverBg)
  rootStyle.setProperty('--dt-top-hover-text', runtimeColors.topHoverText)
  rootStyle.setProperty('--dt-top-active-bg', runtimeColors.topActiveBg)
  rootStyle.setProperty('--dt-top-active-text', runtimeColors.topActiveText)
  rootStyle.setProperty('--dt-side-bg', runtimeColors.sideBg)
  rootStyle.setProperty('--dt-side-border', runtimeColors.sideBorder)
  rootStyle.setProperty('--dt-side-text', runtimeColors.sideText)
  rootStyle.setProperty('--dt-side-hover-bg', runtimeColors.sideHoverBg)
  rootStyle.setProperty('--dt-side-hover-text', runtimeColors.sideHoverText)
  rootStyle.setProperty('--dt-side-active-bg', runtimeColors.sideActiveBg)
  rootStyle.setProperty('--dt-side-active-text', runtimeColors.sideActiveText)
  rootStyle.setProperty('--dt-nav-bg', runtimeColors.sideBg)
  rootStyle.setProperty('--dt-nav-border', runtimeColors.sideBorder)
  rootStyle.setProperty('--dt-nav-text', runtimeColors.sideText)
  rootStyle.setProperty('--dt-page-bg', runtimeColors.pageBg)
  rootStyle.setProperty('--dt-bg', runtimeColors.pageBg)
  rootStyle.setProperty('--dt-surface', palette.surface)
  rootStyle.setProperty('--dt-surface-soft', palette.surfaceSoft)
  rootStyle.setProperty('--dt-border', palette.border)
  rootStyle.setProperty('--dt-border-strong', palette.borderStrong)
  rootStyle.setProperty('--dt-text', palette.text)
  rootStyle.setProperty('--dt-text-muted', palette.textMuted)
  rootStyle.setProperty('--dt-danger', palette.danger)
  rootStyle.setProperty('--dt-danger-soft', palette.dangerSoft)
  rootStyle.setProperty('--dt-shadow', palette.shadow)
  rootStyle.setProperty('--dt-shadow-soft', palette.shadowSoft)
  rootStyle.setProperty('--dt-shell-header-bg', resolvedAppearance === 'dark' ? runtimeColors.topBg : palette.surface)
  rootStyle.setProperty(
    '--dt-shell-header-border',
    resolvedAppearance === 'dark' ? runtimeColors.topBorder : palette.border
  )
  rootStyle.setProperty('--dt-shell-header-text', resolvedAppearance === 'dark' ? runtimeColors.topText : palette.text)
  rootStyle.setProperty(
    '--dt-shell-header-muted',
    resolvedAppearance === 'dark' ? runtimeColors.topText : palette.textMuted
  )
  rootStyle.setProperty(
    '--dt-shell-header-hover-bg',
    resolvedAppearance === 'dark' ? runtimeColors.topHoverBg : palette.surfaceSoft
  )
  rootStyle.setProperty(
    '--dt-shell-header-hover-text',
    resolvedAppearance === 'dark' ? runtimeColors.topHoverText : runtimeColors.primary
  )
  rootStyle.setProperty('--dt-shell-tabs-bg', resolvedAppearance === 'dark' ? palette.surfaceSoft : '#f7f9fc')
  rootStyle.setProperty('--dt-shell-content-bg', resolvedAppearance === 'dark' ? runtimeColors.pageBg : '#eef3f9')
  rootStyle.setProperty('--el-color-primary', runtimeColors.primary)
  rootStyle.setProperty('--el-color-primary-light-3', runtimeColors.primaryLight)
  rootStyle.setProperty(
    '--el-color-primary-light-5',
    `color-mix(in srgb, ${runtimeColors.primary} 50%, ${primaryMixBase})`
  )
  rootStyle.setProperty(
    '--el-color-primary-light-7',
    `color-mix(in srgb, ${runtimeColors.primary} 30%, ${primaryMixBase})`
  )
  rootStyle.setProperty(
    '--el-color-primary-light-8',
    `color-mix(in srgb, ${runtimeColors.primary} 20%, ${primaryMixBase})`
  )
  rootStyle.setProperty(
    '--el-color-primary-light-9',
    `color-mix(in srgb, ${runtimeColors.primary} 10%, ${primaryMixBase})`
  )
  rootStyle.setProperty('--el-color-primary-dark-2', runtimeColors.primaryDark)
  rootStyle.setProperty('--el-menu-active-color', runtimeColors.primary)
  rootStyle.setProperty('--el-menu-hover-text-color', runtimeColors.primary)
  rootStyle.setProperty('--el-bg-color', palette.surface)
  rootStyle.setProperty('--el-bg-color-page', runtimeColors.pageBg)
  rootStyle.setProperty('--el-bg-color-overlay', palette.surface)
  rootStyle.setProperty('--el-fill-color-blank', palette.surface)
  rootStyle.setProperty('--el-fill-color-extra-light', palette.surfaceSoft)
  rootStyle.setProperty('--el-fill-color-lighter', palette.surfaceSoft)
  rootStyle.setProperty('--el-fill-color-light', palette.surfaceSoft)
  rootStyle.setProperty('--el-border-color', palette.border)
  rootStyle.setProperty('--el-border-color-light', palette.border)
  rootStyle.setProperty('--el-border-color-lighter', palette.border)
  rootStyle.setProperty('--el-border-color-extra-light', palette.border)
  rootStyle.setProperty('--el-border-color-dark', palette.borderStrong)
  rootStyle.setProperty('--el-text-color-primary', palette.text)
  rootStyle.setProperty('--el-text-color-regular', palette.text)
  rootStyle.setProperty('--el-text-color-secondary', palette.textMuted)
  rootStyle.setProperty('--el-text-color-placeholder', palette.textMuted)
  rootStyle.setProperty('--el-disabled-bg-color', palette.surfaceSoft)
  rootStyle.setProperty('--el-disabled-border-color', palette.border)
  rootStyle.setProperty('--el-disabled-text-color', palette.textMuted)
  rootStyle.setProperty('--el-table-bg-color', palette.surface)
  rootStyle.setProperty('--el-table-tr-bg-color', palette.surface)
  rootStyle.setProperty('--el-table-expanded-cell-bg-color', palette.surface)
  rootStyle.setProperty('--el-table-header-bg-color', palette.surfaceSoft)
  rootStyle.setProperty(
    '--el-table-row-hover-bg-color',
    `color-mix(in srgb, ${runtimeColors.primary} 6%, ${palette.surface})`
  )
  rootStyle.setProperty(
    '--el-table-current-row-bg-color',
    `color-mix(in srgb, ${runtimeColors.primary} 8%, ${primaryMixBase})`
  )
  rootStyle.setProperty('--el-table-text-color', palette.text)
  rootStyle.setProperty('--el-table-header-text-color', palette.text)
  rootStyle.setProperty('--el-table-border-color', palette.border)
  rootStyle.setProperty(
    '--el-mask-color',
    resolvedAppearance === 'dark' ? 'rgba(0, 0, 0, 0.68)' : 'rgba(255, 255, 255, 0.8)'
  )
  rootStyle.setProperty('--el-box-shadow', palette.shadow)
  rootStyle.setProperty('--el-box-shadow-light', palette.shadowSoft)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dt-theme-applied', {
        detail: {
          appearance: resolvedAppearance
        }
      })
    )
  }
}

export const setUserAppearance = (appearance, options = {}) => {
  const resolvedAppearance = normalizeAppearance(appearance)
  const themeConfig = options.themeConfig || getCachedThemeConfig()
  const applyResolvedTheme = () => applyThemeConfig(themeConfig, resolvedAppearance)

  cacheAppearance(resolvedAppearance)
  if (options.animate) {
    startThemeTransition(applyResolvedTheme, { ...options, appearance: resolvedAppearance })
  } else {
    applyResolvedTheme()
  }
  return resolvedAppearance
}

export const toggleUserAppearance = (options = {}) => {
  const nextAppearance = getCachedAppearance() === 'dark' ? 'light' : 'dark'
  return setUserAppearance(nextAppearance, options)
}

export const applyCachedSystemAppearance = () => {
  applyBrowserLogo()
  applyThemeConfig(getCachedThemeConfig(), getCachedAppearance())
}

export const cacheSystemInfo = ({ systemName, loginImg, loginCaptchaEnabled, browserLogo, themeConfig }) => {
  if (typeof systemName === 'string') safeSetLocalStorage(STORAGE_KEYS.systemName, systemName)
  if (typeof loginImg === 'string') {
    safeSetLocalStorage(STORAGE_KEYS.loginImg, loginImg, { removeOnQuotaExceeded: true })
  }
  if (typeof loginCaptchaEnabled === 'boolean') {
    safeSetLocalStorage(STORAGE_KEYS.loginCaptchaEnabled, String(loginCaptchaEnabled))
  }
  if (typeof browserLogo === 'string') {
    safeSetLocalStorage(STORAGE_KEYS.browserLogo, browserLogo, { removeOnQuotaExceeded: true })
  }
  if (themeConfig !== undefined && themeConfig !== null) cacheThemeConfig(themeConfig)
  applyBrowserLogo(typeof browserLogo === 'string' ? browserLogo : getCachedBrowserLogo())
  applyThemeConfig(themeConfig || getCachedThemeConfig(), getCachedAppearance())
}

export const fetchAndCacheSystemInfo = async () => {
  const { data: res } = await getSystemInfo()
  if (res?.success && res?.data) {
    const systemInfo = {
      systemName: res.data.systemName || '',
      loginImg: res.data.loginImg || '',
      loginCaptchaEnabled: res.data.loginCaptchaEnabled !== false,
      browserLogo: res.data.browserLogo || ''
    }
    if (Object.prototype.hasOwnProperty.call(res.data, 'themeConfig')) {
      systemInfo.themeConfig = res.data.themeConfig || DEFAULT_THEME_CONFIG
    }
    cacheSystemInfo(systemInfo)
  }
  return res
}
