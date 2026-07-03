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
const DynamicAppPage = () => import('../view/DynamicApp/DynamicAppPage.vue')
const ApiKeyManagement = () => import('../view/ApiKey/ApiKeyManagement.vue')

const withCache = (cacheName, extraMeta = {}) => ({
  cacheName,
  requiresAuth: true,
  ...extraMeta
})

export const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    redirect: '/welcome',
    meta: { requiresAuth: true },
    children: [
      { path: '/welcome', name: 'Welcome', component: Welcome, meta: withCache('Welcome', { title: '首页' }) },
      {
        path: '/user/organization',
        name: 'Organization',
        component: Organization,
        meta: withCache('Organization')
      },
      { path: '/role/rolesmenu', name: 'Role', component: RolesMenu, meta: withCache('Role') },
      { path: '/log/logaction', name: 'LogAction', component: LogAction, meta: withCache('LogAction') },
      {
        path: '/attachment/attachmentlist',
        name: 'Attachment',
        component: AttachmentList,
        meta: withCache('Attachment')
      },
      { path: '/common/menus', name: 'Menus', component: Menus, meta: withCache('Menus') },
      {
        path: '/common/systemsettings',
        name: 'SystemSettings',
        component: SystemSettings,
        meta: withCache('SystemSettings')
      },
      {
        path: '/DynamicApp/DynamicApiConfig',
        name: 'DynamicApp',
        component: DynamicApiConfig,
        meta: withCache('DynamicApp')
      },
      {
        path: '/apikey/management',
        name: 'ApiKeyManagement',
        component: ApiKeyManagement,
        meta: withCache('ApiKeyManagement')
      },
      { path: '/jumppage', name: 'JumpPage', component: JumpPage, props: true, meta: withCache('JumpPage') },
      {
        path: '/app/:appPath',
        name: 'DynamicAppPage',
        component: DynamicAppPage,
        meta: withCache('DynamicAppPage')
      }
    ]
  }
]
