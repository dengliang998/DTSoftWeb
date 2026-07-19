import * as Vue from 'vue'
import ElementPlus, { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import http from '@/api/http'
import { clearAuthSession, getToken, getUserAccount, isAuthenticated } from '@/core/session'

const SDK_VERSION = '1.0.0'

const createNamespacedStorage = (namespace, storage) => ({
  get(key) {
    return storage.getItem(`${namespace}:${key}`)
  },
  set(key, value) {
    storage.setItem(`${namespace}:${key}`, value)
  },
  remove(key) {
    storage.removeItem(`${namespace}:${key}`)
  }
})

export const createCustomPageSdk = ({ router, route, pageConfig, container }) => {
  const namespace = `dtsoft:custom:${pageConfig?.name || 'unknown'}`

  const sdk = {
    version: SDK_VERSION,
    page: pageConfig,
    props: pageConfig?.props || {},
    container,
    http,
    auth: {
      getToken,
      getUserAccount,
      isAuthenticated,
      clearAuthSession
    },
    router: {
      push: (...args) => router.push(...args),
      replace: (...args) => router.replace(...args),
      back: () => router.back(),
      current: () => router.currentRoute.value
    },
    route: () => route,
    ui: {
      message: ElMessage,
      confirm: ElMessageBox.confirm,
      alert: ElMessageBox.alert,
      notify: ElNotification
    },
    storage: {
      local: createNamespacedStorage(namespace, window.localStorage),
      session: createNamespacedStorage(namespace, window.sessionStorage)
    },
    libs: {
      Vue,
      ElementPlus,
      ElementPlusIconsVue
    },
    mountVue(component, props = {}) {
      const app = Vue.createApp(component, {
        dtsoftSdk: sdk,
        pageConfig,
        pageProps: pageConfig?.props || {},
        ...props
      })
      Object.values(ElementPlusIconsVue).forEach((icon) => {
        if (icon?.name) app.component(icon.name, icon)
      })
      app.use(ElementPlus)
      app.provide('dtsoftSdk', sdk)
      app.config.globalProperties.axios = http
      app.config.globalProperties.$http = http
      app.config.globalProperties.$dtsoft = sdk
      app.mount(container)
      return () => app.unmount()
    }
  }

  return Object.freeze(sdk)
}
