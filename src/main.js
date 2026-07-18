import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import http from './api/http'
import { installElementPlus } from './plugins/elementPlus'
import { installResizeObserverPatch } from './plugins/resizeObserverPatch'
import { formatDateTime } from './utils/date'
import { applyCachedSystemAppearance } from './utils/sysConfig'

/*导入字体图标*/
import './assets/fonts/iconfont.css'
/* 引入全局样式 */
import './assets/css/global.css'

// 导入nprogress和样式 (加载条)
import 'nprogress/nprogress.css'

installResizeObserverPatch()
applyCachedSystemAppearance()

const app = createApp(App)

installElementPlus(app)
app.use(router)

// 将常用库挂载到全局属性
app.config.globalProperties.axios = http
app.config.globalProperties.$http = http

// 注册全局过滤器
app.config.globalProperties.$filters = {
  dateFormat: formatDateTime
}

// 挂载应用
app.mount('#app')
