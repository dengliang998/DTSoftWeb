import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  Delete,
  Document,
  Download,
  Edit,
  Expand,
  Fold,
  Lock,
  OfficeBuilding,
  Picture,
  Plus,
  Search,
  Setting,
  Unlock,
  Upload,
  UploadFilled,
  User,
  VideoCamera,
  WarningFilled
} from '@element-plus/icons-vue'
import http from './api/http'

/*导入字体图标*/
import './assets/fonts/iconfont.css'
/* 引入全局样式 */
import './assets/css/global.css'

// 导入nprogress和样式 (加载条)
import 'nprogress/nprogress.css'

// 创建Vue应用实例
const app = createApp(App)

// 全局处理 ResizeObserver 循环错误（这是一个常见的浏览器警告，不影响功能）
const debounceResizeObserver = (fn) => {
  let frame
  return (...args) => {
    if (frame) {
      cancelAnimationFrame(frame)
    }
    frame = requestAnimationFrame(() => {
      fn(...args)
    })
  }
}

// 覆盖 ResizeObserver 以抑制循环错误
if (typeof window !== 'undefined') {
  const OriginalResizeObserver = window.ResizeObserver
  if (OriginalResizeObserver) {
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback) {
        const debouncedCallback = debounceResizeObserver(callback)
        super(debouncedCallback)
      }
    }
  }

  // 或者更简单的方式：忽略 ResizeObserver 循环错误
  const originalError = console.error
  console.error = function (...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
      // 忽略 ResizeObserver 循环错误
      return
    }
    originalError.apply(console, args)
  }
}

;[
  Delete,
  Document,
  Download,
  Edit,
  Expand,
  Fold,
  Lock,
  OfficeBuilding,
  Picture,
  Plus,
  Search,
  Setting,
  Unlock,
  Upload,
  UploadFilled,
  User,
  VideoCamera,
  WarningFilled
].forEach((icon) => {
  app.component(icon.name, icon)
})

// 使用插件和路由
app.use(router).use(ElementPlus, { locale: zhCn })

// 将常用库挂载到全局属性
app.config.globalProperties.axios = http

// 注册全局过滤器
app.config.globalProperties.$filters = {
  dateFormat(originVal) {
    const dt = new Date(originVal)
    const year = dt.getFullYear()
    const month = (dt.getMonth() + 1).toString().padStart(2, '0')
    const date = dt.getDate().toString().padStart(2, '0')
    const hour = dt.getHours().toString().padStart(2, '0')
    const minute = dt.getMinutes().toString().padStart(2, '0')
    const second = dt.getSeconds().toString().padStart(2, '0')
    return `${year}-${month}-${date} ${hour}:${minute}:${second}`
  }
}

// 挂载应用
app.mount('#app')
