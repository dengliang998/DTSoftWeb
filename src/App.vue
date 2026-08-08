<template>
  <el-config-provider :locale="elementLocale">
    <div id="app">
      <router-view></router-view>
    </div>
  </el-config-provider>
</template>

<script>
import { computed, defineComponent, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { getEnabledLanguages } from '@/api/language'
import { cacheEnabledLanguages, i18nState } from '@/i18n'

export default defineComponent({
  name: 'App',
  setup() {
    const elementLocale = computed(() => (i18nState.language === 'en-US' ? en : zhCn))
    onMounted(async () => {
      try {
        const { data: res } = await getEnabledLanguages()
        if (res?.success && Array.isArray(res.data)) {
          cacheEnabledLanguages(res.data)
        }
      } catch {
        // Keep the built-in fallback language pack when the config request fails.
      }
    })
    return {
      elementLocale
    }
  }
})
</script>
