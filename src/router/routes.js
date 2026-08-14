const Login = () => import('../view/Login.vue')
const SsoLogin = () => import('../view/SsoLogin.vue')
const Home = () => import('../view/Home.vue')
const Welcome = () => import('../view/Welcome.vue')
const Organization = () => import('../view/user/Organization.vue')
const RolesMenu = () => import('../view/Role/RolesMenu.vue')
const LogAction = () => import('../view/Log/LogAction.vue')
const AttachmentList = () => import('../view/attachment/attachmentlist.vue')
const Menus = () => import('../view/Common/Menus.vue')
const SystemSettings = () => import('../view/Common/SystemSettings.vue')
const SystemInfo = () => import('../view/Common/SystemInfo.vue')
const OnlineUsers = () => import('../view/Common/OnlineUsers.vue')
const PluginManagement = () => import('../view/Common/PluginManagement.vue')
const Dictionaries = () => import('../view/Common/Dictionaries.vue')
const Languages = () => import('../view/Common/Languages.vue')
const EsbServiceConnections = () => import('../view/Common/EsbServiceConnections.vue')
const EsbDataSources = () => import('../view/Common/EsbDataSources.vue')
const JumpPage = () => import('../view/Common/JumpPage.vue')
const MicroApiConfig = () => import('../view/MicroApp/MicroApiConfig.vue')
const MicroAppPage = () => import('../view/MicroApp/MicroAppPage.vue')
const CustomPage = () => import('../view/CustomPage/CustomPage.vue')
const IntegrationApiKeyManagement = () => import('../view/IntegrationApiKeys/IntegrationApiKeyManagement.vue')

const withCache = (cacheName, extraMeta = {}) => ({
  cacheName,
  requiresAuth: true,
  ...extraMeta
})

export const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  { path: '/sso', name: 'SsoLogin', component: SsoLogin, meta: { requiresAuth: false } },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/welcome',
        name: 'Welcome',
        component: Welcome,
        meta: withCache('Welcome', { titleKey: 'menu.welcome' })
      },
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
        path: '/common/systeminfo',
        name: 'SystemInfo',
        component: SystemInfo,
        meta: withCache('SystemInfo')
      },
      {
        path: '/common/onlineusers',
        name: 'OnlineUsers',
        component: OnlineUsers,
        meta: withCache('OnlineUsers')
      },
      {
        path: '/common/plugins',
        name: 'PluginManagement',
        component: PluginManagement,
        meta: withCache('PluginManagement')
      },
      {
        path: '/common/dictionaries',
        name: 'Dictionaries',
        component: Dictionaries,
        meta: withCache('Dictionaries')
      },
      {
        path: '/common/languages',
        name: 'Languages',
        component: Languages,
        meta: withCache('Languages')
      },
      {
        path: '/common/esb-connections',
        name: 'EsbServiceConnections',
        component: EsbServiceConnections,
        meta: withCache('EsbServiceConnections')
      },
      {
        path: '/common/esb',
        name: 'EsbDataSources',
        component: EsbDataSources,
        meta: withCache('EsbDataSources')
      },
      {
        path: '/MicroApp/MicroApiConfig',
        name: 'MicroApp',
        component: MicroApiConfig,
        meta: withCache('MicroApp')
      },
      {
        path: '/integration/api-keys',
        name: 'IntegrationApiKeyManagement',
        component: IntegrationApiKeyManagement,
        meta: withCache('IntegrationApiKeyManagement')
      },
      { path: '/jumppage', name: 'JumpPage', component: JumpPage, props: true, meta: withCache('JumpPage') },
      {
        path: '/app/:appPath',
        name: 'MicroAppPage',
        component: MicroAppPage,
        meta: withCache('MicroAppPage')
      },
      {
        path: '/custom/:pageName/:pagePath(.*)*',
        name: 'CustomPage',
        component: CustomPage,
        meta: withCache('CustomPage')
      }
    ]
  }
]
