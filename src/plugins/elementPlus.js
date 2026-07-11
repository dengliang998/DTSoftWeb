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
  Rank,
  RefreshLeft,
  Search,
  Setting,
  Unlock,
  Upload,
  UploadFilled,
  User,
  VideoCamera,
  WarningFilled
} from '@element-plus/icons-vue'

const icons = [
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
  Rank,
  RefreshLeft,
  Search,
  Setting,
  Unlock,
  Upload,
  UploadFilled,
  User,
  VideoCamera,
  WarningFilled
]

export const installElementPlus = (app) => {
  icons.forEach((icon) => {
    app.component(icon.name, icon)
  })

  app.use(ElementPlus, { locale: zhCn })
}
