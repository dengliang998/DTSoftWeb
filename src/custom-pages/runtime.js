const scriptPromises = new Map()
const stylePromises = new Map()
const sfcPromises = new Map()

const appendVersion = (url, version) => {
  if (!url) return ''
  if (!version) return url
  const joiner = url.includes('?') ? '&' : '?'
  return `${url}${joiner}v=${encodeURIComponent(version)}`
}

export const ensureCustomPageRegistry = () => {
  const registry = window.DTSoftCustomPages || {}
  const records = registry.__records || {}

  registry.__records = records
  registry.register = (name, definition) => {
    const pageName = typeof name === 'object' ? name.name : name
    const pageDefinition = typeof name === 'object' ? name : definition
    if (!pageName || !pageDefinition) return

    records[pageName] = pageDefinition
    registry[pageName] = pageDefinition
  }
  registry.get = (name) => records[name] || registry[name]
  registry.unregister = (name) => {
    delete records[name]
    delete registry[name]
  }

  window.DTSoftCustomPages = registry
  return registry
}

const loadScript = (url) => {
  if (!url) return Promise.resolve()
  if (scriptPromises.has(url)) return scriptPromises.get(url)

  const promise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-dtsoft-custom-page="${url}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', () => reject(new Error(`自定义页面脚本加载失败：${url}`)), {
        once: true
      })
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.dtsoftCustomPage = url
    script.onload = resolve
    script.onerror = () => {
      script.remove()
      scriptPromises.delete(url)
      reject(new Error(`自定义页面脚本加载失败：${url}`))
    }
    document.head.appendChild(script)
  })

  scriptPromises.set(url, promise)
  return promise
}

const loadStyle = (url) => {
  if (!url) return Promise.resolve()
  if (stylePromises.has(url)) return stylePromises.get(url)

  const promise = new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[data-dtsoft-custom-page-style="${url}"]`)
    if (existingLink) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.dataset.dtsoftCustomPageStyle = url
    link.onload = resolve
    link.onerror = () => {
      link.remove()
      stylePromises.delete(url)
      reject(new Error(`自定义页面样式加载失败：${url}`))
    }
    document.head.appendChild(link)
  })

  stylePromises.set(url, promise)
  return promise
}

const loadHtml = async (url) => {
  if (!url) return ''
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`自定义页面 HTML 加载失败：${response.status}`)
  }
  return response.text()
}

const extractSfcBlock = (source, tagName) => {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = source.match(pattern)
  return match ? match[1].trim() : ''
}

const evaluateSfcScript = ({ script, url, pageConfig }) => {
  if (!script) return {}

  const normalizedScript = script
    .replace(/^\s*export\s+default\s+/, 'return ')
    .replace(/^\s*module\.exports\s*=\s*/, 'return ')

  try {
    return new Function('pageConfig', normalizedScript)(pageConfig) || {}
  } catch (error) {
    throw new Error(`自定义 Vue 页面脚本解析失败：${url}，${error.message}`)
  }
}

const injectSfcStyle = ({ style, url, version }) => {
  if (!style) return

  const styleKey = appendVersion(url, version)
  if (document.querySelector(`style[data-dtsoft-custom-page-sfc="${styleKey}"]`)) {
    return
  }

  const styleElement = document.createElement('style')
  styleElement.dataset.dtsoftCustomPageSfc = styleKey
  styleElement.textContent = style
  document.head.appendChild(styleElement)
}

const loadSfc = async (pageConfig) => {
  const url = pageConfig.sfc
  if (!url) return null

  const versionedUrl = appendVersion(url, pageConfig.raw?.version)
  if (sfcPromises.has(versionedUrl)) return sfcPromises.get(versionedUrl)

  const promise = fetch(versionedUrl, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`自定义 Vue 页面加载失败：${response.status}`)
    }

    const source = await response.text()
    const template = extractSfcBlock(source, 'template')
    const script = extractSfcBlock(source, 'script')
    const style = extractSfcBlock(source, 'style')

    const component = evaluateSfcScript({ script, url, pageConfig })
    component.template = component.template || template
    injectSfcStyle({ style, url, version: pageConfig.raw?.version })

    return {
      component
    }
  })

  sfcPromises.set(versionedUrl, promise)
  return promise
}

export const loadCustomPageAssets = async (pageConfig) => {
  const registry = ensureCustomPageRegistry()
  const version = pageConfig.raw?.version

  await Promise.all(pageConfig.styles.map((styleUrl) => loadStyle(appendVersion(styleUrl, version))))

  const [html, sfcDefinition] = await Promise.all([
    loadHtml(appendVersion(pageConfig.html, version)),
    loadSfc(pageConfig),
    loadScript(appendVersion(pageConfig.entry, version))
  ])

  const definition =
    sfcDefinition || registry.get(pageConfig.name) || (pageConfig.raw?.globalName && window[pageConfig.raw.globalName])

  return {
    html,
    definition
  }
}
