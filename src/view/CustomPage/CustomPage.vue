<template>
  <div class="custom-page-shell">
    <div v-if="loading" class="custom-page-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ $t('customPage.loading') }}</span>
    </div>

    <el-empty v-else-if="error" :description="error">
      <el-button type="primary" @click="loadPage">{{ $t('customPage.retry') }}</el-button>
    </el-empty>

    <div v-show="!loading && !error" ref="mountPoint" class="custom-page-mount"></div>
  </div>
</template>

<script>
import { createCustomPageSdk } from '@/custom-pages/sdk'
import { findCustomPageByRoute } from '@/custom-pages/registry'
import { loadCustomPageAssets } from '@/custom-pages/runtime'

export default {
  name: 'CustomPage',
  data() {
    return {
      loading: true,
      error: '',
      pageConfig: null,
      cleanup: null,
      loadId: 0
    }
  },
  watch: {
    '$route.fullPath': {
      immediate: true,
      handler() {
        this.loadPage()
      }
    }
  },
  beforeUnmount() {
    this.destroyPage()
  },
  methods: {
    destroyPage() {
      if (typeof this.cleanup === 'function') {
        this.cleanup()
      }
      this.cleanup = null
      if (this.$refs.mountPoint) {
        this.$refs.mountPoint.innerHTML = ''
      }
    },
    async loadPage() {
      const currentLoadId = ++this.loadId
      this.destroyPage()
      this.loading = true
      this.error = ''

      try {
        const pageConfig = await findCustomPageByRoute({
          pageName: this.$route.params.pageName,
          pagePath: this.$route.params.pagePath
        })

        if (!pageConfig) {
          throw new Error(this.$t('customPage.notFound'))
        }

        this.pageConfig = pageConfig
        const { html, definition } = await loadCustomPageAssets(pageConfig)

        this.loading = false
        await this.$nextTick()
        if (currentLoadId !== this.loadId) return

        const mountPoint = this.$refs.mountPoint
        if (html) {
          mountPoint.innerHTML = html
        }

        const sdk = createCustomPageSdk({
          router: this.$router,
          route: this.$route,
          pageConfig,
          container: mountPoint
        })

        if (definition?.component) {
          this.cleanup = sdk.mountVue(definition.component)
          return
        }

        if (definition?.mount) {
          const result = await definition.mount(mountPoint, sdk)
          this.cleanup =
            typeof result === 'function'
              ? result
              : typeof result?.unmount === 'function'
                ? () => result.unmount()
                : null
          return
        }

        if (definition?.render) {
          const rendered = await definition.render(sdk)
          if (typeof rendered === 'string') {
            mountPoint.innerHTML = rendered
          }
          return
        }

        if (!html) {
          throw new Error(this.$t('customPage.invalidDefinition'))
        }
      } catch (error) {
        this.error = error?.message || this.$t('customPage.loadFailed')
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.custom-page-shell {
  min-height: 100%;
  background: #f5f7fb;
}

.custom-page-state {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #5d6b82;
  font-size: 14px;
}

.custom-page-mount {
  min-height: 100%;
}
</style>
