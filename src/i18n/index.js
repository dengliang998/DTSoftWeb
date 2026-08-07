import { reactive } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export const SUPPORTED_LANGUAGE_OPTIONS = Object.freeze([
  {
    LanguageCode: 'zh-CN',
    LanguageName: '\u7b80\u4f53\u4e2d\u6587',
    NativeName: '\u7b80\u4f53\u4e2d\u6587',
    IsDefault: true,
    Sort: 10
  },
  { LanguageCode: 'en-US', LanguageName: 'English', NativeName: 'English', IsDefault: false, Sort: 20 }
])

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

const normalizeLanguageCode = (value) => {
  const code = String(value || '').trim()
  return Object.prototype.hasOwnProperty.call(messages, code) ? code : ''
}

const getBrowserLanguage = () => {
  const language = normalizeLanguageCode(navigator.language)
  if (language) return language
  return navigator.language?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN'
}

export const getCurrentLanguage = () =>
  normalizeLanguageCode(localStorage.getItem(STORAGE_KEYS.language)) || getBrowserLanguage() || 'zh-CN'

export const i18nState = reactive({
  language: getCurrentLanguage(),
  enabledLanguages: [...SUPPORTED_LANGUAGE_OPTIONS]
})

const readPath = (source, path) =>
  String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce(
      (current, key) => (current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined),
      source
    )

export const translate = (key, params = {}) => {
  const value = readPath(messages[i18nState.language], key) ?? readPath(messages['zh-CN'], key) ?? key
  return String(value).replace(/\{(\w+)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`
  )
}

export const setLanguage = (language) => {
  const normalized = normalizeLanguageCode(language) || 'zh-CN'
  i18nState.language = normalized
  localStorage.setItem(STORAGE_KEYS.language, normalized)
  document.documentElement.lang = normalized
  window.dispatchEvent(new CustomEvent('dt-language-changed', { detail: { language: normalized } }))
}

export const cacheEnabledLanguages = (languages) => {
  const normalized = Array.isArray(languages)
    ? languages
        .map((item) => ({
          LanguageCode: normalizeLanguageCode(item.LanguageCode || item.languageCode),
          LanguageName: item.LanguageName || item.languageName || '',
          NativeName: item.NativeName || item.nativeName || '',
          IsDefault: Boolean(item.IsDefault ?? item.isDefault),
          Sort: Number(item.Sort ?? item.sort ?? 0)
        }))
        .filter((item) => item.LanguageCode)
    : []

  i18nState.enabledLanguages = normalized.length > 0 ? normalized : [...SUPPORTED_LANGUAGE_OPTIONS]
  localStorage.setItem(STORAGE_KEYS.enabledLanguages, JSON.stringify(i18nState.enabledLanguages))
  if (!i18nState.enabledLanguages.some((item) => item.LanguageCode === i18nState.language)) {
    const defaultLanguage = i18nState.enabledLanguages.find((item) => item.IsDefault) || i18nState.enabledLanguages[0]
    setLanguage(defaultLanguage?.LanguageCode || 'zh-CN')
  }
}

export const loadCachedEnabledLanguages = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.enabledLanguages) || '[]')
    cacheEnabledLanguages(parsed)
  } catch {
    i18nState.enabledLanguages = [...SUPPORTED_LANGUAGE_OPTIONS]
  }
}

export const installI18n = (app) => {
  loadCachedEnabledLanguages()
  document.documentElement.lang = i18nState.language
  app.config.globalProperties.$t = translate
  app.provide('i18nState', i18nState)
  app.provide('setLanguage', setLanguage)
}
