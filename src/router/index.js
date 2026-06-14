import { createRouter, createWebHashHistory } from 'vue-router'
const Login = () => import('../view/Login.vue')
const Home = () => import('../view/Home.vue')
const Welcome = () => import('../view/Welcome.vue')
const Organization = () => import('../view/user/Organization.vue')
const RolesMenu = () => import('../view/Role/RolesMenu.vue')
const LogAction = () => import('../view/Log/LogAction.vue')
const AttachmentList = () => import('../view/attachment/attachmentlist.vue')
const Menus = () => import('../view/Common/Menus.vue')
const SystemSettings = () => import('../view/Common/SystemSettings.vue')
const JumpPage = () => import('../view/Common/JumpPage.vue')
const DynamicApiConfig = () => import('../view/DynamicApp/DynamicApiConfig.vue')
const ApiKeyManagement = () => import('../view/ApiKey/ApiKeyManagement.vue')

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/home', name: 'Home', component: Home, redirect: '/welcome', children: [
    { path: '/welcome', name: 'Welcome', component: Welcome, meta: { cacheName: 'Welcome' } },
    { path: '/user/organization', name: 'Organization', component: Organization, meta: { cacheName: 'Organization' } },
    { path: '/role/rolesmenu', name: 'Role', component: RolesMenu, meta: { cacheName: 'Role' } },
    { path: '/log/logaction', name: 'LogAction', component: LogAction, meta: { cacheName: 'LogAction' } },
    { path: '/attachment/attachmentlist', name: 'Attachment', component: AttachmentList, meta: { cacheName: 'Attachment' } },
    { path: '/common/menus', name: 'Menus', component: Menus, meta: { cacheName: 'Menus' } },  // 添加菜单维护页面路由
    { path: '/common/systemsettings', name: 'SystemSettings', component: SystemSettings, meta: { cacheName: 'SystemSettings' } },  // 系统设置（系统名称、登录背景图）
    { path: '/DynamicApp/DynamicApiConfig', name: 'DynamicApp', component: DynamicApiConfig, meta: { cacheName: 'DynamicApp' } },  // 添加CRUD配置页面路由
    { path: '/apikey/management', name: 'ApiKeyManagement', component: ApiKeyManagement, meta: { cacheName: 'ApiKeyManagement' } },  // 添加API密钥管理页面路由
    { path: '/jumppage', name: 'JumpPage', component: JumpPage, props: true, meta: { cacheName: 'JumpPage' } },
    // 动态应用路由占位符
    { path: '/app/:appPath', name: 'DynamicAppPage', component: () => import('../view/DynamicApp/DynamicAppPage.vue'), meta: { cacheName: 'DynamicAppPage' } }
  ] }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 挂载路由导航守卫
router.beforeEach((to, from, next) => {
  // to 将要访问的路径
  // from 代表从哪个路径跳转而来
  // next 是一个函数，表示放行
  // next() 放行 next('/login') 强制跳转
  
  if (to.path === '/login') return next()
  
  // 获取token
  const tokenStr = window.localStorage.getItem('token')
  if (!tokenStr) return next('/login')
  next()
})

export default router
