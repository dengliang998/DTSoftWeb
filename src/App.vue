<template>
  <el-config-provider :locale="elementLocale">
    <div id="app">
      <router-view></router-view>
    </div>
  </el-config-provider>
</template>

<script>
import { computed, defineComponent } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { i18nState } from '@/i18n'

export default defineComponent({
  name: 'App',
  setup() {
    const elementLocale = computed(() => (i18nState.language === 'en-US' ? en : zhCn))
    return {
      elementLocale
    }
  }
})
</script>
