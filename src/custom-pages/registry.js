const CUSTOM_PAGE_MANIFEST_URL = process.env.VUE_APP_CUSTOM_PAGE_MANIFEST || './custom-pages/manifest.json'

let manifestPromise = null
let entriesPromise = null

const trimSlash = (value = '') => String(value).replace(/^\/+|\/+$/g, '')

const normalizePageKey = (value = '') => trimSlash(value || 'index') || 'index'

const normalizePageName = (value = '') => trimSlash(value).replace(/[^\w-]/g, '_')

const getDocumentDirectoryUrl = () => {
  const currentUrl = new URL(window.location.href)
  currentUrl.hash = ''
  currentUrl.search = ''

  if (!currentUrl.pathname.endsWith('/')) {
    currentUrl.pathname = currentUrl.pathname.slice(0, currentUrl.pathname.lastIndexOf('/') + 1)
  }

  return currentUrl.href
}

const resolveUrl = (url, baseUrl) => {
  if (!url) return ''
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url
  }
  return new URL(url, baseUrl).href
}

const getAppBaseUrl = () => resolveUrl(process.env.BASE_URL || './', getDocumentDirectoryUrl())

const resolveManifestUrl = () => {
  return resolveUrl(CUSTOM_PAGE_MANIFEST_URL, getAppBaseUrl())
}

const getManifestBaseUrl = () => {
  const cleanUrl = resolveManifestUrl().split('?')[0]
  const slashIndex = cleanUrl.lastIndexOf('/')
  return slashIndex >= 0 ? cleanUrl.slice(0, slashIndex + 1) : './'
}

export const resolveCustomPageAssetUrl = (assetUrl = '') => {
  if (!assetUrl) return ''
  return resolveUrl(assetUrl, getManifestBaseUrl())
}

const normalizeManifestPages = (manifest) => {
  if (Array.isArray(manifest)) return manifest
  if (Array.isArray(manifest?.pages)) return manifest.pages
  return []
}

const buildPageEntry = (page, index) => {
  const name = normalizePageName(page.name || page.path || `custom_page_${index + 1}`)
  const pageKey = normalizePageKey(page.path || 'index')

  return {
    name,
    pageKey,
    title: page.title || name,
    icon: page.icon || 'Document',
    routePath: `custom/${encodeURIComponent(name)}/${pageKey}`,
    sfc: resolveCustomPageAssetUrl(page.sfc || page.component),
    entry: resolveCustomPageAssetUrl(page.entry),
    html: resolveCustomPageAssetUrl(page.html),
    styles: []
      .concat(page.styles || page.style || [])
      .filter(Boolean)
      .map((styleUrl) => resolveCustomPageAssetUrl(styleUrl)),
    props: page.props || {},
    raw: page
  }
}

export const loadCustomPageManifest = async ({ force = false } = {}) => {
  if (!force && manifestPromise) {
    return manifestPromise
  }

  const manifestUrl = resolveManifestUrl()
  const joiner = manifestUrl.includes('?') ? '&' : '?'

  manifestPromise = fetch(`${manifestUrl}${joiner}t=${Date.now()}`, {
    cache: 'no-store'
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`自定义页面清单读取失败：${response.status}`)
      }
      return response.json()
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(error.message || error)
      }
      return { pages: [] }
    })

  return manifestPromise
}

export const getCustomPageEntries = async ({ force = false } = {}) => {
  if (!force && entriesPromise) {
    return entriesPromise
  }

  entriesPromise = loadCustomPageManifest({ force }).then((manifest) =>
    normalizeManifestPages(manifest)
      .filter((page) => page && page.enabled !== false)
      .map((page, index) => buildPageEntry(page, index))
      .filter((page) => page.name && (page.sfc || page.entry || page.html))
  )

  return entriesPromise
}

export const findCustomPageByRoute = async ({ pageName, pagePath }) => {
  const name = normalizePageName(pageName)
  const pageKey = normalizePageKey(Array.isArray(pagePath) ? pagePath.join('/') : pagePath)
  const entries = await getCustomPageEntries()

  return entries.find((entry) => entry.name === name && entry.pageKey === pageKey)
}
