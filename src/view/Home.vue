<template>
  <div class="home-container">
    <!-- 头部区域 -->
    <header class="header-container">
      <div class="header-left">
        <img class="header-logo" :src="browserLogoUrl || defaultHomeLogo" alt="" />
        <span class="header-title">{{ systemTitle }}</span>
      </div>

      <!-- 侧边栏折叠按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon v-if="isCollapse"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
      </div>

      <!-- 顶部一级菜单 -->
      <div class="top-menu">
        <el-menu
          :default-active="activeTopMenu"
          mode="horizontal"
          background-color="transparent"
          text-color="var(--dt-top-text)"
          active-text-color="var(--dt-top-active-text)"
          :ellipsis="false"
          @select="handleTopMenuSelect"
        >
          <el-menu-item v-for="item in fatherMenuList" :key="item.id" :index="item.id + ''">
            <el-icon v-if="item.Icon">
              <component :is="getIconComponent(item.Icon)" />
            </el-icon>
            <span>{{ getMenuDisplayName(item) }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <button
          type="button"
          class="theme-toggle"
          :class="{ 'is-animating': themeAnimating }"
          :aria-label="currentAppearance === 'dark' ? $t('theme.switchToLight') : $t('theme.switchToDark')"
          :title="currentAppearance === 'dark' ? $t('theme.switchToLight') : $t('theme.switchToDark')"
          @click="toggleAppearance"
        >
          <transition name="theme-icon" mode="out-in">
            <el-icon :key="currentAppearance" class="theme-toggle-icon">
              <Sunny v-if="currentAppearance === 'dark'" />
              <Moon v-else />
            </el-icon>
          </transition>
        </button>
        <el-dropdown
          v-if="enabledLanguages.length > 0"
          trigger="click"
          popper-class="language-menu-popper"
          @command="handleLanguageChange"
        >
          <button type="button" class="language-trigger" :title="$t('language.switchLabel')">
            <span>{{ currentLanguageLabel }}</span>
            <el-icon class="user-arrow"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in enabledLanguages"
                :key="item.LanguageCode"
                :command="item.LanguageCode"
                :disabled="item.LanguageCode === currentLanguage"
              >
                <span>{{ item.NativeName || item.LanguageName || item.LanguageCode }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- 用户信息区域 -->
        <div class="header-user-info">
          <el-dropdown trigger="click" popper-class="user-menu-popper" @command="handleCommand">
            <button type="button" class="user-trigger">
              <el-avatar :size="30" class="user-avatar" :src="circleUrl">
                <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
              </el-avatar>
              <span class="user-name">{{ UserDisplayName }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="ModifyPwdDialog">
                  <el-icon><Lock /></el-icon>
                  <span>{{ $t('user.changePassword') }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="ModifyAccountInfoDialog">
                  <el-icon><User /></el-icon>
                  <span>{{ $t('user.profile') }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>{{ $t('user.logout') }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 页面主体区域 -->
    <div class="main-content">
      <!-- 侧边栏 -->
      <aside class="sidebar-container" :class="{ collapsed: isCollapse }">
        <!-- 侧边栏菜单区 -->
        <el-menu
          :default-active="$route.path"
          :router="true"
          :collapse-transition="true"
          :collapse="isCollapse"
          unique-opened
          background-color="var(--dt-side-bg)"
          text-color="var(--dt-side-text)"
          active-text-color="var(--dt-side-active-text)"
        >
          <!-- 菜单列表 -->
          <template v-for="item in childrenMenuList" :key="item.id">
            <!-- 有子菜单的情况 -->
            <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.id + ''">
              <template #title>
                <el-icon v-if="item.Icon">
                  <component :is="getIconComponent(item.Icon)" />
                </el-icon>
                <span>{{ getMenuDisplayName(item) }}</span>
              </template>

              <!-- 子菜单项 -->
              <el-menu-item
                v-for="subItem in item.children"
                :key="subItem.id"
                :index="'/' + subItem.path"
                @click="saveNavState('/' + subItem.path)"
              >
                <el-icon v-if="subItem.Icon">
                  <component :is="getIconComponent(subItem.Icon)" />
                </el-icon>
                <template #title>
                  <span>{{ getMenuDisplayName(subItem) }}</span>
                </template>
              </el-menu-item>
            </el-sub-menu>

            <!-- 无子菜单的情况 -->
            <el-menu-item v-else :index="'/' + item.path" @click="saveNavState('/' + item.path)">
              <el-icon v-if="item.Icon">
                <component :is="getIconComponent(item.Icon)" />
              </el-icon>
              <template #title>
                <span>{{ getMenuDisplayName(item) }}</span>
              </template>
            </el-menu-item>
          </template>
        </el-menu>
      </aside>

      <!-- 右侧主体内容 -->
      <main class="main-container">
        <!-- 标签页区域 -->
        <div class="tabs-container">
          <el-tabs
            v-model="activeTab"
            class="workspace-tabs"
            type="card"
            @tab-click="handleTabClick"
            @tab-remove="handleTabRemove"
          >
            <el-tab-pane v-for="tab in openedTabs" :key="tab.path" :name="tab.path" :closable="openedTabs.length > 1">
              <template #label>
                <span class="tab-label" :title="tab.title">{{ tab.title }}</span>
              </template>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 路由占位符，添加过渡动画 -->
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="$route.path" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- 修改密码对话框 -->
    <ModifyPwdDialog v-model="ModifyPwdDialogVisible" :form="ModifyPwdForm" @success="ModifyPwdDialogVisible = false" />

    <!-- 修改用户的对话框 -->
    <el-dialog v-model="UserDialogVisible" :title="$t('user.profile')" width="50%" @close="UserDialogClosed">
      <UserInfo-components ref="UserInfo" :Account="LoginAcc" OpenType="Edit"></UserInfo-components>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="UpdateUserInfo">{{ $t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import UserInfoComponents from '../components/user/UserInfoComponents.vue'
import ModifyPwdDialog from '@/components/ModifyPwdDialog.vue'
import { ArrowDown, Lock, Moon, Sunny, SwitchButton, User } from '@element-plus/icons-vue'
import { getMenu } from '@/api/menu'
import { getUserAccount } from '@/core/session'
import {
  filterHiddenMenus,
  findFirstNavigableMenu,
  findChildrenByMenuId,
  getMenuDisplayName as resolveMenuDisplayName,
  getIconComponent,
  getMenuTitleByPath,
  getRootMenus,
  toRoutePath,
  resolveInitialMenuState
} from '@/modules/home/menuState'
import {
  buildCachedViews,
  getCacheNameByPath,
  getNextTabAfterRemove,
  refreshTabTitles,
  saveActivePath,
  shouldSkipTab,
  upsertTab
} from '@/modules/home/tabs'
import { createModifyPwdForm, loadCurrentUserProfile, logoutAndClearSession } from '@/modules/home/userPanel'
import {
  fetchAndCacheSystemInfo,
  getCachedAppearance,
  getCachedBrowserLogoDataUrl,
  getCachedSystemName,
  toggleUserAppearance
} from '@/utils/sysConfig'
import { getEnabledLanguages, getLanguageResourceValues } from '@/api/language'
import { cacheEnabledLanguages, getCurrentLanguage, i18nState, setLanguage } from '@/i18n'
import defaultHomeLogo from '@/assets/imgs/homelogo.png'
export default {
  name: 'Home',
  components: {
    ArrowDown,
    Lock,
    Moon,
    Sunny,
    UserInfoComponents,
    SwitchButton,
    User,
    ModifyPwdDialog
  },
  data() {
    return {
      systemTitle: 'DT Program',
      defaultHomeLogo,
      browserLogoUrl: getCachedBrowserLogoDataUrl(),
      LoginAcc: getUserAccount(),
      UserDisplayName: '',
      circleUrl: '',
      currentAppearance: getCachedAppearance(),
      currentLanguage: getCurrentLanguage(),
      enabledLanguages: i18nState.enabledLanguages,
      dynamicResources: {},
      themeAnimating: false,
      themeAnimationTimer: null,
      //完整的菜单数据存放的位置
      menuList: [],
      //一级菜单数据存放的位置
      fatherMenuList: [],
      //子菜单数据存放的位置
      childrenMenuList: [],
      //是否展示或折叠菜单
      isCollapse: false,
      //被激活的链接地址
      activePath: '',
      //被激活的顶部菜单
      activeTopMenu: '',
      ModifyPwdDialogVisible: false,
      ModifyPwdForm: createModifyPwdForm(),
      editDialogVisible: false,
      UserDialogVisible: false,
      // 缓存的视图组件
      cachedViews: [],
      // 已打开的标签页列表
      openedTabs: [],
      // 当前激活的标签页
      activeTab: ''
    }
  },
  computed: {
    currentLanguageLabel() {
      const current = this.enabledLanguages.find((item) => item.LanguageCode === this.currentLanguage)
      return current?.NativeName || current?.LanguageName || this.currentLanguage
    }
  },
  watch: {
    // 监听路由变化，自动添加标签页
    $route(to) {
      if (to.path) {
        this.addTab(to.path)
      }
    }
  },
  created() {
    // 初始化系统名称（用于头部标题）
    this.systemTitle = getCachedSystemName() || this.systemTitle
    fetchAndCacheSystemInfo()
      .then(() => {
        this.systemTitle = getCachedSystemName() || this.systemTitle
        this.browserLogoUrl = getCachedBrowserLogoDataUrl()
        document.title = this.systemTitle
      })
      .catch(() => {})

    // 在创建的生命周期执行获取菜单操作
    this.loadEnabledLanguages().finally(() => {
      this.getAllMenuList()
    })
    // 在创建生命周期函数的时候获取保存的路径并赋值到数据中
    //this.activePath = window.sessionStorage.getItem('activePath')
    this.loadUserProfile()

    // 如果刷新时当前路由已是具体页面，先加入标签；/home 等待菜单加载后决定入口
    if (this.$route && this.$route.path && !shouldSkipTab(this.$route.path)) {
      this.addTab(this.$route.path)
    }
  },
  beforeUnmount() {
    if (this.themeAnimationTimer) {
      window.clearTimeout(this.themeAnimationTimer)
      this.themeAnimationTimer = null
    }
  },
  methods: {
    getCacheNameByPath(path) {
      return getCacheNameByPath(this.$router, path)
    },
    getMenuDisplayName(menu) {
      return resolveMenuDisplayName(menu, this.dynamicResources)
    },
    refreshOpenedTabsTitles() {
      if (!Array.isArray(this.openedTabs) || this.openedTabs.length === 0) return
      this.openedTabs = refreshTabTitles({
        tabs: this.openedTabs,
        getTitle: this.getMenuTitleByPath,
        getCacheName: this.getCacheNameByPath
      })
      this.rebuildCachedViews()
    },
    rebuildCachedViews() {
      this.cachedViews = buildCachedViews(this.openedTabs)
    },
    // 判断头像下拉菜单指令
    handleCommand(command) {
      if (command == 'logout') {
        this.logout()
      } else if (command === 'ModifyPwdDialog') {
        this.ModifyPwdDialogVisible = true
      } else if (command === 'ModifyAccountInfoDialog') {
        this.UserDialogVisible = true
      }
    },
    async loadEnabledLanguages() {
      try {
        const { data: res } = await getEnabledLanguages()
        if (res?.success && Array.isArray(res.data)) {
          cacheEnabledLanguages(res.data)
          this.enabledLanguages = i18nState.enabledLanguages
          this.currentLanguage = i18nState.language
        }
      } catch {
        this.enabledLanguages = i18nState.enabledLanguages
      }
    },
    async loadDynamicResources() {
      try {
        const { data: res } = await getLanguageResourceValues(this.currentLanguage)
        this.dynamicResources = res?.success && res.data ? res.data : {}
      } catch {
        this.dynamicResources = {}
      }
    },
    async handleLanguageChange(language) {
      if (!language || language === this.currentLanguage) return
      setLanguage(language)
      this.currentLanguage = i18nState.language
      this.enabledLanguages = i18nState.enabledLanguages
      await this.loadDynamicResources()
      this.refreshOpenedTabsTitles()
    },
    // 退出登录
    logout() {
      logoutAndClearSession()
      //回到登录页面
      this.$router.push('/login')
    },
    getIconComponent,
    async loadUserProfile() {
      try {
        const profile = await loadCurrentUserProfile()
        this.UserDisplayName = profile.displayName
        this.circleUrl = profile.avatarUrl
      } catch (e) {
        this.$message.error(this.$t('user.loadFailed'))
      }
    },

    UpdateUserInfo() {
      this.$refs.UserInfo.UpdateUserInfo()
      this.UserDialogVisible = false
    },
    UserDialogClosed() {
      this.UserDialogVisible = false
    },
    // 获取所有菜单数据
    async getAllMenuList() {
      const me = this
      await this.loadDynamicResources()
      getMenu()
        .then(function (response) {
          const menuData = response.data.data || response.data
          me.menuList = Array.isArray(menuData) ? filterHiddenMenus(menuData) : []

          // 提取一级菜单（pid为0的菜单项）
          me.fatherMenuList = getRootMenus(me.menuList)

          // 当前路由属于某个菜单时选中对应一级菜单；否则先展示第一个一级菜单的子菜单。
          const menuState = resolveInitialMenuState(me.menuList, me.$route?.path || '')
          me.activeTopMenu = menuState.activeTopMenu
          me.childrenMenuList = menuState.childrenMenuList

          // 菜单加载完成后，修正已打开标签页的标题（刷新时避免显示“页面”）
          me.$nextTick(() => {
            const defaultRoutePath = me.getDefaultMenuRoutePath()
            if (me.$route?.path === '/home' && defaultRoutePath) {
              const defaultMenuState = resolveInitialMenuState(me.menuList, defaultRoutePath)
              me.activeTopMenu = defaultMenuState.activeTopMenu
              me.childrenMenuList = defaultMenuState.childrenMenuList
              me.$router.replace(defaultRoutePath)
              return
            }

            me.refreshOpenedTabsTitles()
            if (me.$route && me.$route.path && !shouldSkipTab(me.$route.path)) {
              me.addTab(me.$route.path)
              me.refreshOpenedTabsTitles()
            }
          })
        })
        .catch(function () {
          me.$message.error(me.$t('menuPage.loadFailed'))
        })
    },

    getChildrenMenuList(menuId) {
      this.childrenMenuList = findChildrenByMenuId(this.menuList, menuId)
      this.$nextTick(() => {})
    },
    getDefaultMenuRoutePath() {
      const menu = findFirstNavigableMenu(this.menuList)
      return toRoutePath(menu?.path)
    },

    // 处理顶部菜单选择
    handleTopMenuSelect(index) {
      this.activeTopMenu = index
      const topMenu = this.fatherMenuList.find((item) => String(item.id) === String(index))
      const children = findChildrenByMenuId(this.menuList, index)
      this.childrenMenuList = children

      if ((!children || children.length === 0) && topMenu?.path) {
        const routePath = toRoutePath(topMenu.path)
        if (routePath && this.$route.path !== routePath) {
          this.saveNavState(routePath)
          this.$router.push(routePath)
        }
      }
    },
    toggleAppearance(event) {
      this.currentAppearance = toggleUserAppearance({ animate: true, sourceEvent: event })
      this.themeAnimating = true
      if (this.themeAnimationTimer) {
        window.clearTimeout(this.themeAnimationTimer)
      }
      this.themeAnimationTimer = window.setTimeout(() => {
        this.themeAnimating = false
        this.themeAnimationTimer = null
      }, 860)
    },

    // 点击按钮切换菜单折叠和展开
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },
    // 保存链接的激活状态
    saveNavState(activePath) {
      saveActivePath(activePath)
      this.activePath = activePath
      // 添加标签页
      this.addTab(activePath)
    },

    // 添加标签页
    addTab(path) {
      // 登录页和布局页不添加标签，具体页面由菜单驱动。
      if (shouldSkipTab(path)) {
        this.activeTab = path
        return
      }

      // 获取菜单标题
      const title = this.getMenuTitleByPath(path)
      const cacheName = this.getCacheNameByPath(path)

      upsertTab({
        tabs: this.openedTabs,
        path,
        title,
        cacheName
      })

      // 激活当前标签页
      this.activeTab = path

      // 重建缓存视图（按组件名缓存，而非菜单标题）
      this.rebuildCachedViews()
    },

    // 根据路径获取菜单标题
    getMenuTitleByPath(path) {
      return getMenuTitleByPath(this.menuList, path, this.dynamicResources)
    },

    // 处理标签页点击
    handleTabClick(tab) {
      const path = tab.paneName
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
    },

    // 处理标签页关闭
    handleTabRemove(targetPath) {
      // 找到要关闭的标签页索引
      const targetIndex = this.openedTabs.findIndex((tab) => tab.path === targetPath)
      if (targetIndex === -1) return

      // 如果关闭的是当前激活的标签页
      if (this.activeTab === targetPath) {
        // 获取下一个或上一个标签页
        const nextTab = getNextTabAfterRemove(this.openedTabs, targetPath)
        if (nextTab) {
          this.activeTab = nextTab.path
          this.$router.push(nextTab.path)
        }
      }

      // 从标签页列表中移除
      this.openedTabs.splice(targetIndex, 1)

      // 重建缓存：只保留仍有标签页打开的组件名
      this.rebuildCachedViews()
    }
  }
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 主容器 */
.home-container {
  width: 100%;
  height: 100vh;
  background-color: var(--dt-page-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部容器 */
.header-container {
  background-color: var(--dt-top-bg);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transition: all 0.3s ease;
  border-bottom: 1px solid var(--dt-top-border);
}

/* 头部左侧 */
.header-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-logo {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.header-logo:hover {
  transform: scale(1.05);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

/* 头部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--dt-top-text);
  background: color-mix(in srgb, var(--dt-top-text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dt-top-text) 14%, transparent);
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.22s ease,
    background-color 0.22s ease,
    border-color 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.theme-toggle:hover,
.theme-toggle:focus-visible {
  color: var(--dt-top-hover-text);
  background: var(--dt-top-hover-bg);
  border-color: color-mix(in srgb, var(--dt-top-hover-text) 26%, transparent);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--dt-top-hover-text) 16%, transparent);
  outline: none;
}

.theme-toggle-icon {
  font-size: 18px;
  line-height: 1;
  transition:
    transform 0.32s ease,
    opacity 0.22s ease;
}

.theme-toggle-icon svg {
  width: 1em;
  height: 1em;
  display: block;
}

.theme-toggle.is-animating .theme-toggle-icon {
  transform: rotate(180deg) scale(0.9);
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: translateY(5px) rotate(-35deg) scale(0.78);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: translateY(-5px) rotate(35deg) scale(0.78);
}

/* 折叠按钮 */
.collapse-btn {
  background: transparent;
  color: var(--dt-top-text);
  font-size: 18px;
  cursor: pointer;
  padding: 8px 5px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  margin: 0 30px;
}

.collapse-btn:hover {
  background: var(--dt-top-hover-bg);
  color: var(--dt-top-hover-text);
  border-color: color-mix(in srgb, var(--dt-top-hover-text) 24%, transparent);
  transform: scale(1.05);
}

/* 顶部菜单 */
.top-menu {
  flex: 1;
  margin: 0 -20px;
  height: 100%;
  display: flex;
  align-items: center;
}

.top-menu .el-menu {
  background-color: transparent;
  border: none;
  height: 100%;
  box-shadow: none;
}

.top-menu :deep(.el-menu-item) {
  height: 64px;
  line-height: 64px;
  border: none;
  float: left;
  color: var(--dt-top-text) !important;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 4px;
  border-radius: 8px;
  padding: 0 16px;
}

/* 顶部菜单图标样式 */
.top-menu :deep(.el-menu-item) :deep(.el-icon) {
  color: var(--dt-top-text) !important;
  margin-right: 8px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-menu :deep(.el-menu-item:hover) {
  background-color: var(--dt-top-hover-bg) !important;
  color: var(--dt-top-hover-text) !important;
  transform: translateY(-1px);
}

.top-menu :deep(.el-menu-item:hover) :deep(.el-icon) {
  color: var(--dt-top-hover-text) !important;
}

.top-menu :deep(.el-menu-item.is-active) {
  background-color: var(--dt-top-active-bg) !important;
  color: var(--dt-top-active-text) !important;
  border-bottom: 2px solid var(--dt-top-active-bg);
  border-radius: 8px;
  transform: translateY(0);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dt-top-active-bg) 30%, transparent);
}

.top-menu :deep(.el-menu-item.is-active) :deep(.el-icon) {
  color: var(--dt-top-active-text) !important;
}

/* 用户信息区域 */
.header-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--dt-top-text);
  transition: all 0.3s ease;
}

.user-avatar {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: var(--dt-top-hover-text);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--dt-top-hover-text) 24%, transparent);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 0;
}

/* 侧边栏容器 */
.sidebar-container {
  width: 205px;
  background-color: var(--dt-side-bg);
  border-right: 1px solid var(--dt-side-border);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

.sidebar-container.collapsed {
  width: 64px;
}

/* 侧边栏菜单 */
.sidebar-container .el-menu {
  border-right: 0;
  height: 100%;
  overflow-y: auto;
  background-color: var(--dt-side-bg);
  transition: none;
}

/* 菜单项基础样式 */
.sidebar-container .el-menu-item,
.sidebar-container .el-sub-menu__title {
  height: 48px;
  line-height: 48px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dt-side-text);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin: 0 8px;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

/* 菜单项文字动画 */
.sidebar-container .el-menu-item span,
.sidebar-container .el-sub-menu__title span {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: translateX(0);
}

/* 菜单项图标动画 */
.sidebar-container .el-menu-item .el-icon,
.sidebar-container .el-sub-menu__title .el-icon {
  transition:
    margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    font-size 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 菜单项悬停效果 */
.sidebar-container .el-menu-item:hover,
.sidebar-container .el-sub-menu__title:hover {
  background-color: var(--dt-side-hover-bg) !important;
  color: var(--dt-side-hover-text) !important;
  transform: translateX(2px);
}

/* 菜单项选中效果 */
.sidebar-container .el-menu-item.is-active,
.sidebar-container .el-sub-menu__title.is-active {
  background: var(--dt-side-active-bg) !important;
  color: var(--dt-side-active-text) !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dt-side-active-bg) 30%, transparent);
  border-left: 3px solid var(--dt-side-active-bg);
  margin: 0 8px;
  transform: translateX(2px);
}

/* 子菜单样式 */
.sidebar-container .el-sub-menu .el-menu {
  background-color: var(--dt-side-bg) !important;
  border-right: 0;
}

.sidebar-container .el-sub-menu .el-menu-item {
  min-width: 200px;
  padding-left: 48px !important;
  height: 44px;
  line-height: 44px;
  color: var(--dt-side-text) !important;
  font-size: 13px;
  margin: 2px 8px;
  border-left: none;
}

.sidebar-container .el-sub-menu .el-menu-item:hover {
  background-color: var(--dt-side-hover-bg) !important;
  color: var(--dt-side-hover-text) !important;
}

.sidebar-container .el-sub-menu .el-menu-item.is-active {
  background: var(--dt-side-active-bg) !important;
  color: var(--dt-side-active-text) !important;
  border-radius: 6px;
  margin: 2px 8px;
  padding-left: 44px !important;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dt-side-active-bg) 30%, transparent);
  border-left: 3px solid var(--dt-side-active-bg);
  transform: translateX(2px);
}

/* 图标样式 */
.sidebar-container .el-menu-item .el-icon,
.sidebar-container .el-sub-menu__title .el-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: middle;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-container .el-menu-item:hover .el-icon,
.sidebar-container .el-sub-menu__title:hover .el-icon {
  color: var(--dt-side-hover-text);
  transform: scale(1.1);
}

.sidebar-container .el-menu-item.is-active .el-icon,
.sidebar-container .el-sub-menu__title.is-active .el-icon {
  color: var(--dt-side-active-text);
  transform: scale(1.1);
}

/* 主内容容器 */
.main-container {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 标签页容器 */
.tabs-container {
  background-color: var(--dt-page-bg);
  border-bottom: 1px solid #e4e7ed;
  padding: 0 16px;
  flex-shrink: 0;
}

.tabs-container :deep(.el-tabs__content) {
  display: none;
}

.tabs-container :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

.tabs-container :deep(.el-tabs__nav-wrap) {
  padding: 8px 0 0 0;
}

.tabs-container :deep(.el-tabs__nav) {
  border: none;
}

.tabs-container :deep(.el-tabs__item) {
  border: 1px solid #dcdfe6;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  margin-right: 4px;
  padding: 0 16px;
  height: 36px;
  line-height: 36px;
  background-color: #ffffff;
  color: #606266;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tabs-container :deep(.el-tabs__item:hover) {
  background-color: #ecf5ff;
  color: var(--dt-primary);
}

.tabs-container :deep(.el-tabs__item.is-active) {
  background-color: #ffffff;
  color: var(--dt-primary);
  font-weight: 500;
  border-color: #dcdfe6;
  border-bottom: 2px solid #ffffff;
  z-index: 1;
}

.tabs-container :deep(.el-tabs__close-icon) {
  font-size: 12px;
  margin-left: 8px;
  transition: all 0.3s ease;
}

.tabs-container :deep(.el-tabs__close-icon:hover) {
  color: #f56c6c;
  transform: scale(1.2);
}

/* 内容包装器 */
.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow: auto;
  min-height: 0;
}

/* 页面切换过渡动画 */
.fade-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 折叠状态下的样式 */
.sidebar-container.collapsed .el-menu-item,
.sidebar-container.collapsed .el-sub-menu__title {
  justify-content: center;
  padding: 0 8px !important;
  margin: 0 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 折叠状态下的菜单项文字隐藏动画 */
.sidebar-container.collapsed .el-menu-item span,
.sidebar-container.collapsed .el-sub-menu__title span {
  opacity: 0;
  transform: translateX(-10px);
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 折叠状态下的菜单项图标样式 */
.sidebar-container.collapsed .el-menu-item .el-icon,
.sidebar-container.collapsed .el-sub-menu__title .el-icon {
  margin-right: 0;
  font-size: 18px;
  transition:
    margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    font-size 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 折叠状态下的激活菜单项 */
.sidebar-container.collapsed .el-menu-item.is-active {
  transform: none;
  border-left: none;
  background: var(--dt-side-active-bg);
  color: var(--dt-side-active-text);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 折叠状态下的子菜单 */
.sidebar-container.collapsed .el-sub-menu .el-menu {
  background-color: var(--dt-side-bg);
}

.sidebar-container.collapsed .el-sub-menu .el-menu-item {
  padding-left: 20px !important;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f5;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 菜单分组样式 */
.sidebar-container .el-menu-item-group__title {
  padding: 16px 20px 8px;
  height: auto;
  line-height: normal;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-color: transparent;
  margin: 0;
  text-transform: uppercase;
}

/* 子菜单展开箭头 */
.el-sub-menu__icon-arrow {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  color: inherit;
}

.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
  transform: rotate(90deg);
  color: var(--dt-side-hover-text);
}

/* 调整对话框样式 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  position: relative;
  background-color: var(--dt-surface);
  border-bottom: 1px solid #ebeef5;
  padding: 8px 16px;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 12px;
}

:deep(.el-dialog__footer) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  background-color: var(--dt-surface);
  border-top: 1px solid #ebeef5;
  padding: 0 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 修改密码表单样式 */
.modify-pwd-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.modify-pwd-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* Modern shell refresh */
.home-container {
  background:
    radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--dt-primary) 11%, transparent), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
}

.header-container {
  height: 64px;
  padding: 0 22px;
  background: rgba(15, 23, 42, 0.94);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
}

.header-left {
  min-width: 210px;
}

.header-logo {
  width: 38px;
  height: 38px;
  padding: 4px;
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.header-logo:hover {
  transform: none;
}

.header-title {
  color: #f8fafc;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: 0;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  margin: 0 22px 0 4px;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.collapse-btn:hover {
  color: #ffffff;
  background: color-mix(in srgb, var(--dt-primary) 78%, transparent);
  border-color: rgba(141, 173, 255, 0.7);
  transform: none;
}

.top-menu {
  min-width: 0;
  margin: 0;
}

.top-menu :deep(.el-menu) {
  height: 100%;
  border-bottom: 0;
}

.top-menu :deep(.el-menu-item) {
  height: 38px;
  line-height: 38px;
  padding: 0 14px;
  margin: 0 3px;
  color: #cbd5e1 !important;
  border: 0 !important;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 650;
}

.top-menu :deep(.el-menu-item .el-icon) {
  margin-right: 7px;
  color: inherit !important;
}

.top-menu :deep(.el-menu-item:hover) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  transform: none;
}

.top-menu :deep(.el-menu-item.is-active) {
  color: #ffffff !important;
  background: linear-gradient(135deg, var(--dt-primary) 0%, var(--dt-primary-light) 100%) !important;
  border: 0 !important;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--dt-primary) 22%, transparent);
  transform: none;
}

.header-right {
  gap: 14px;
}

.header-user-info {
  height: 42px;
  padding: 0 4px 0 14px;
  gap: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.78);
}

.user-avatar:hover {
  border-color: #7dd3c7;
  box-shadow: 0 0 0 4px rgba(0, 168, 137, 0.16);
  transform: none;
}

.main-content {
  padding: 14px;
  gap: 14px;
}

.sidebar-container {
  width: 216px;
  padding: 10px 0;
  background: #101828;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.16);
}

.sidebar-container.collapsed {
  width: 68px;
}

.sidebar-container .el-menu {
  background: transparent !important;
}

.sidebar-container .el-menu-item,
.sidebar-container .el-sub-menu__title {
  height: 42px;
  line-height: 42px;
  margin: 3px 10px;
  color: #b7c4d4 !important;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.sidebar-container .el-menu-item:hover,
.sidebar-container .el-sub-menu__title:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
  transform: none;
}

.sidebar-container .el-menu-item.is-active,
.sidebar-container .el-sub-menu__title.is-active,
.sidebar-container .el-sub-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--dt-primary) 96%, transparent) 0%,
    color-mix(in srgb, var(--dt-primary-light) 92%, transparent) 100%
  ) !important;
  border-left: 0;
  box-shadow: 0 10px 20px color-mix(in srgb, var(--dt-primary) 22%, transparent);
  transform: none;
}

.sidebar-container .el-sub-menu .el-menu {
  background: rgba(255, 255, 255, 0.03) !important;
  margin: 2px 8px 6px;
  border-radius: 10px;
}

.sidebar-container .el-sub-menu .el-menu-item {
  min-width: 0;
  height: 38px;
  line-height: 38px;
  margin: 3px 6px;
  padding-left: 42px !important;
  color: #a8b5c5 !important;
  font-size: 13px;
}

.sidebar-container .el-menu-item .el-icon,
.sidebar-container .el-sub-menu__title .el-icon {
  margin-right: 10px;
  color: inherit;
}

.sidebar-container .el-menu-item:hover .el-icon,
.sidebar-container .el-sub-menu__title:hover .el-icon,
.sidebar-container .el-menu-item.is-active .el-icon,
.sidebar-container .el-sub-menu__title.is-active .el-icon {
  color: inherit;
  transform: none;
}

.sidebar-container.collapsed .el-menu-item,
.sidebar-container.collapsed .el-sub-menu__title {
  margin: 4px 8px;
  border-radius: 12px;
}

.sidebar-container.collapsed .el-menu-item.is-active {
  background: linear-gradient(135deg, var(--dt-primary) 0%, var(--dt-primary-light) 100%) !important;
}

.sidebar-container.collapsed .el-sub-menu .el-menu {
  background: #101828 !important;
}

.main-container {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(221, 229, 239, 0.9);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(18, 38, 63, 0.08);
}

.tabs-container {
  height: 48px;
  padding: 6px 10px;
  background: #f6f8fb;
  border-bottom: 1px solid #dde5ef;
}

.workspace-tabs {
  height: 100%;
}

.tabs-container :deep(.el-tabs__header) {
  height: 100%;
  margin: 0;
  border-bottom: 0;
}

.tabs-container :deep(.el-tabs__nav-wrap) {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0;
}

.tabs-container :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tabs-container :deep(.el-tabs__nav-scroll) {
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.tabs-container :deep(.el-tabs__nav-scroll::-webkit-scrollbar) {
  height: 4px;
}

.tabs-container :deep(.el-tabs__nav-scroll::-webkit-scrollbar-thumb) {
  background: #cfd8e3;
  border-radius: 999px;
}

.tabs-container :deep(.el-tabs__nav) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
  border: 0 !important;
}

.tabs-container :deep(.el-tabs__item) {
  display: inline-flex !important;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 92px;
  max-width: 176px;
  height: 34px;
  line-height: 32px;
  padding: 0 12px !important;
  margin: 0 !important;
  color: #5f6f85;
  background: #ffffff;
  border: 1px solid #dbe3ee !important;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.tabs-container :deep(.el-tabs__item:first-child) {
  min-width: 72px;
}

.tabs-container :deep(.el-tabs__item .tab-label) {
  min-width: 0;
  overflow: hidden;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs-container :deep(.el-tabs__item:hover) {
  color: var(--dt-primary);
  background: var(--dt-primary-subtle);
  border-color: var(--dt-primary-border) !important;
}

.tabs-container :deep(.el-tabs__item.is-active) {
  color: var(--dt-primary-dark);
  background: linear-gradient(180deg, #f8fbff 0%, #edf6ff 100%);
  border-color: var(--dt-primary-border) !important;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.12);
}

.tabs-container :deep(.el-tabs__item.is-active .tab-label) {
  font-weight: 700;
}

.tabs-container :deep(.el-tabs__item.is-active .el-tabs__close-icon) {
  color: var(--dt-primary-dark);
  background: color-mix(in srgb, var(--dt-primary) 9%, transparent);
}

.tabs-container :deep(.el-tabs__close-icon) {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-left: 0;
  border-radius: 50%;
  color: #8a97a8;
  opacity: 0.72;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    opacity 0.18s ease;
}

.tabs-container :deep(.el-tabs__item:hover .el-tabs__close-icon),
.tabs-container :deep(.el-tabs__item.is-active .el-tabs__close-icon) {
  opacity: 1;
}

.tabs-container :deep(.el-tabs__close-icon:hover) {
  color: #e5484d;
  background: #feecec;
  transform: none;
}

.content-wrapper {
  padding: 18px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--dt-primary) 3.5%, transparent) 1px, transparent 1px),
    linear-gradient(180deg, color-mix(in srgb, var(--dt-primary) 3.5%, transparent) 1px, transparent 1px), #f4f7fb;
  background-size: 28px 28px;
}

.content-wrapper {
  padding: 14px;
}

.content-wrapper {
  padding: 5px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-slide-enter-from {
  transform: translateY(8px);
}

.fade-slide-leave-to {
  transform: translateY(-4px);
}

.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
  color: #7dd3c7;
}

/* Header rhythm refinement */
.header-container {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 64px;
  padding: 0 24px;
}

.header-left {
  flex: 0 0 230px;
  min-width: 230px;
}

.header-logo {
  width: 34px;
  height: 34px;
  margin-right: 12px;
  border-radius: 9px;
}

.header-title {
  font-size: 16px;
  line-height: 1;
}

.collapse-btn {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  margin: 0 14px 0 0;
}

.top-menu {
  flex: 1 1 auto;
  align-self: stretch;
  display: flex;
  align-items: center;
  min-width: 0;
}

.top-menu :deep(.el-menu) {
  display: flex;
  align-items: center;
  height: 64px;
  min-width: 0;
}

.top-menu :deep(.el-menu--horizontal) {
  border-bottom: 0;
}

.top-menu :deep(.el-menu-item) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px !important;
  line-height: 36px !important;
  padding: 0 16px !important;
  margin: 0 5px;
  gap: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.top-menu :deep(.el-menu-item .el-icon) {
  width: 18px;
  height: 18px;
  margin-right: 0;
  font-size: 18px;
}

.top-menu :deep(.el-menu-item span) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.header-right {
  flex: 0 0 auto;
  align-self: stretch;
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.header-user-info {
  height: 38px;
  padding: 0 4px 0 14px;
}

.user-avatar {
  width: 32px !important;
  height: 32px !important;
}

@media (max-width: 1280px) {
  .header-left {
    flex-basis: 188px;
    min-width: 188px;
  }

  .top-menu :deep(.el-menu-item) {
    padding: 0 12px !important;
    margin: 0 2px;
  }
}

/* Sidebar refinement */
.main-content {
  padding: 4px;
  gap: 4px;
}

.sidebar-container {
  width: 200px;
  padding: 10px 8px;
  background: linear-gradient(180deg, rgba(16, 24, 40, 0.98) 0%, rgba(17, 25, 39, 0.98) 100%), #101828;
  border-color: rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  box-shadow: 0 14px 32px rgba(16, 24, 40, 0.14);
}

.sidebar-container.collapsed {
  width: 62px;
  padding: 10px 6px;
}

.sidebar-container .el-menu {
  padding: 2px 0;
}

.sidebar-container .el-menu-item,
.sidebar-container .el-sub-menu__title {
  height: 38px;
  line-height: 38px;
  margin: 2px 0;
  padding: 0 12px !important;
  border-radius: 9px;
  color: #aebacc !important;
  font-size: 13px;
  font-weight: 650;
}

.sidebar-container .el-menu-item .el-icon,
.sidebar-container .el-sub-menu__title .el-icon {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  font-size: 18px;
  opacity: 0.92;
}

.sidebar-container .el-menu-item span,
.sidebar-container .el-sub-menu__title span {
  line-height: 1;
}

.sidebar-container .el-menu-item:hover,
.sidebar-container .el-sub-menu__title:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.07) !important;
}

.sidebar-container .el-menu-item.is-active,
.sidebar-container .el-sub-menu__title.is-active,
.sidebar-container .el-sub-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: linear-gradient(135deg, var(--dt-primary) 0%, var(--dt-primary-light) 100%) !important;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-primary) 20%, transparent);
}

.sidebar-container .el-sub-menu .el-menu {
  margin: 3px 0 6px;
  padding: 3px 0;
  background: rgba(255, 255, 255, 0.035) !important;
  border-radius: 9px;
}

.sidebar-container .el-sub-menu .el-menu-item {
  height: 34px;
  line-height: 34px;
  margin: 1px 4px;
  padding-left: 34px !important;
  font-size: 12px;
}

.sidebar-container .el-sub-menu__icon-arrow {
  right: 12px;
  margin-top: -5px;
  color: #7b8798;
}

.sidebar-container.collapsed .el-menu-item,
.sidebar-container.collapsed .el-sub-menu__title {
  justify-content: center;
  height: 38px;
  line-height: 38px;
  margin: 3px 0;
  padding: 0 !important;
}

.sidebar-container.collapsed .el-menu-item .el-icon,
.sidebar-container.collapsed .el-sub-menu__title .el-icon {
  margin-right: 0;
}

.sidebar-container.collapsed .el-menu-item span,
.sidebar-container.collapsed .el-sub-menu__title span,
.sidebar-container.collapsed .el-sub-menu__icon-arrow {
  display: none;
}

/* Theme binding override: keep the final menu skin controlled by SystemSettings. */
.home-container .header-container {
  background: var(--dt-top-bg) !important;
  border-bottom-color: var(--dt-top-border) !important;
}

.home-container .header-title,
.home-container .user-name,
.home-container .collapse-btn {
  color: var(--dt-top-text) !important;
}

.home-container .collapse-btn {
  background: color-mix(in srgb, var(--dt-top-text) 8%, transparent) !important;
  border-color: color-mix(in srgb, var(--dt-top-text) 14%, transparent) !important;
}

.home-container .collapse-btn:hover {
  color: var(--dt-top-hover-text) !important;
  background: var(--dt-top-hover-bg) !important;
  border-color: color-mix(in srgb, var(--dt-top-hover-text) 28%, transparent) !important;
}

.home-container .header-user-info {
  background: color-mix(in srgb, var(--dt-top-text) 8%, transparent) !important;
  border-color: color-mix(in srgb, var(--dt-top-text) 14%, transparent) !important;
}

.home-container .user-avatar:hover {
  border-color: var(--dt-top-hover-text) !important;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dt-top-hover-text) 18%, transparent) !important;
}

.top-menu :deep(.el-menu) {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--dt-top-text);
  --el-menu-hover-text-color: var(--dt-top-hover-text);
  --el-menu-hover-bg-color: var(--dt-top-hover-bg);
  --el-menu-active-color: var(--dt-top-active-text);
  --el-menu-border-color: transparent;
}

.top-menu :deep(.el-menu-item),
.top-menu :deep(.el-sub-menu__title) {
  color: var(--dt-top-text) !important;
  background: transparent !important;
  border: 0 !important;
}

.top-menu :deep(.el-menu-item:hover),
.top-menu :deep(.el-sub-menu__title:hover) {
  color: var(--dt-top-hover-text) !important;
  background: var(--dt-top-hover-bg) !important;
}

.top-menu :deep(.el-menu-item.is-active),
.top-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--dt-top-active-text) !important;
  background: var(--dt-top-active-bg) !important;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--dt-top-active-bg) 24%, transparent) !important;
}

.top-menu :deep(.el-menu-item .el-icon),
.top-menu :deep(.el-sub-menu__title .el-icon) {
  color: inherit !important;
}

.home-container .sidebar-container {
  background: var(--dt-side-bg) !important;
  border-color: var(--dt-side-border) !important;
}

.sidebar-container :deep(.el-menu) {
  --el-menu-bg-color: var(--dt-side-bg);
  --el-menu-text-color: var(--dt-side-text);
  --el-menu-hover-text-color: var(--dt-side-hover-text);
  --el-menu-hover-bg-color: var(--dt-side-hover-bg);
  --el-menu-active-color: var(--dt-side-active-text);
  --el-menu-border-color: var(--dt-side-border);
  background: var(--dt-side-bg) !important;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  color: var(--dt-side-text) !important;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover) {
  color: var(--dt-side-hover-text) !important;
  background: var(--dt-side-hover-bg) !important;
}

.sidebar-container :deep(.el-menu-item.is-active),
.sidebar-container :deep(.el-sub-menu__title.is-active),
.sidebar-container :deep(.el-sub-menu .el-menu-item.is-active) {
  color: var(--dt-side-active-text) !important;
  background: var(--dt-side-active-bg) !important;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-side-active-bg) 24%, transparent) !important;
}

.sidebar-container :deep(.el-sub-menu .el-menu) {
  background: color-mix(in srgb, var(--dt-side-bg) 88%, #ffffff 12%) !important;
}

.sidebar-container :deep(.el-menu-item .el-icon),
.sidebar-container :deep(.el-sub-menu__title .el-icon),
.sidebar-container :deep(.el-sub-menu__icon-arrow) {
  color: inherit !important;
}

.home-container .header-user-info {
  height: 40px;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  max-width: 190px;
  padding: 3px 9px 3px 4px;
  color: var(--dt-top-text);
  background: color-mix(in srgb, var(--dt-top-text) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--dt-top-text) 16%, transparent);
  border-radius: 999px;
  cursor: pointer;
  outline: none;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.user-trigger:hover,
.user-trigger:focus-visible {
  color: var(--dt-top-hover-text);
  background: color-mix(in srgb, var(--dt-top-hover-bg) 86%, transparent);
  border-color: color-mix(in srgb, var(--dt-top-hover-text) 32%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dt-top-hover-text) 14%, transparent);
}

.language-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  min-width: 104px;
  padding: 0 12px;
  color: var(--dt-top-text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  outline: none;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.language-trigger:hover,
.language-trigger:focus-visible {
  color: var(--dt-top-hover-text);
  background: var(--dt-top-hover-bg);
  border-color: transparent;
  box-shadow: none;
}

.language-trigger span {
  color: inherit;
  opacity: 1;
}

.home-container .user-name {
  max-width: 110px;
  overflow: hidden;
  color: inherit !important;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-container .user-avatar {
  width: 30px !important;
  height: 30px !important;
  border: 2px solid color-mix(in srgb, var(--dt-top-text) 36%, transparent);
  background: color-mix(in srgb, var(--dt-top-text) 14%, transparent);
  transition: border-color 0.18s ease;
}

.user-trigger:hover .user-avatar,
.user-trigger:focus-visible .user-avatar {
  border-color: color-mix(in srgb, var(--dt-top-hover-text) 58%, transparent) !important;
  box-shadow: none !important;
}

.user-arrow {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: inherit;
  opacity: 0.76;
}

:global(.user-menu-popper.el-popper) {
  border: 1px solid #d9e2ee !important;
  border-radius: 10px !important;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14) !important;
}

:global(.user-menu-popper .el-popper__arrow::before) {
  border-color: #d9e2ee !important;
}

:global(.user-menu-popper .el-dropdown-menu) {
  min-width: 138px;
  padding: 6px !important;
  border: 0 !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}

:global(.user-menu-popper .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px !important;
  color: #4b5565;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 650;
  line-height: 36px;
}

:global(.user-menu-popper .el-dropdown-menu__item .el-icon) {
  margin: 0;
  color: #7a8797;
  font-size: 16px;
}

:global(.user-menu-popper .el-dropdown-menu__item:not(.is-disabled):hover) {
  color: var(--dt-primary-dark) !important;
  background: var(--dt-primary-subtle) !important;
}

:global(.user-menu-popper .el-dropdown-menu__item:not(.is-disabled):hover .el-icon) {
  color: var(--dt-primary-dark);
}

:global(.user-menu-popper .el-dropdown-menu__item--divided) {
  margin-top: 6px;
  border-top-color: #edf1f6;
}

:global(html[data-theme='dark']) .home-container {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--dt-primary) 5%, transparent) 1px, transparent 1px),
    linear-gradient(180deg, color-mix(in srgb, var(--dt-primary) 5%, transparent) 1px, transparent 1px), var(--dt-bg);
  background-size: 32px 32px;
}

:global(html[data-theme='dark']) .main-container {
  border-color: var(--dt-border);
  background: color-mix(in srgb, var(--dt-surface) 92%, transparent);
  box-shadow: var(--dt-shadow);
}

:global(html[data-theme='dark']) .tabs-container {
  border-bottom-color: var(--dt-border);
  background: var(--dt-surface-soft);
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__nav-scroll::-webkit-scrollbar-thumb) {
  background: var(--dt-border-strong);
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__item) {
  color: var(--dt-text-muted);
  border-color: var(--dt-border) !important;
  background: var(--dt-surface);
  box-shadow: none;
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__item:hover) {
  color: var(--dt-primary-light);
  background: var(--dt-primary-subtle);
  border-color: var(--dt-primary-border) !important;
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__item.is-active) {
  color: var(--dt-primary-light);
  background: color-mix(in srgb, var(--dt-primary) 18%, var(--dt-surface));
  border-color: var(--dt-primary-border) !important;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-primary) 18%, transparent);
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__item.is-active .el-tabs__close-icon) {
  color: var(--dt-primary-light);
  background: color-mix(in srgb, var(--dt-primary) 18%, transparent);
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__close-icon) {
  color: var(--dt-text-muted);
}

:global(html[data-theme='dark']) .tabs-container :deep(.el-tabs__close-icon:hover) {
  color: var(--dt-danger);
  background: var(--dt-danger-soft);
}

:global(html[data-theme='dark']) .content-wrapper {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--dt-primary) 5%, transparent) 1px, transparent 1px),
    linear-gradient(180deg, color-mix(in srgb, var(--dt-primary) 5%, transparent) 1px, transparent 1px), var(--dt-bg);
  background-size: 28px 28px;
}

:global(html[data-theme='dark']) .sidebar-container :deep(.el-sub-menu .el-menu) {
  background: color-mix(in srgb, var(--dt-side-bg) 82%, var(--dt-surface) 18%) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper.el-popper) {
  border-color: var(--dt-border) !important;
  background: var(--dt-surface) !important;
  box-shadow: var(--dt-shadow) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-popper__arrow::before) {
  border-color: var(--dt-border) !important;
  background: var(--dt-surface) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu) {
  background: var(--dt-surface) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu__item) {
  color: var(--dt-text) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu__item .el-icon) {
  color: var(--dt-text-muted);
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu__item:not(.is-disabled):hover) {
  color: var(--dt-primary-light) !important;
  background: var(--dt-primary-subtle) !important;
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu__item:not(.is-disabled):hover .el-icon) {
  color: var(--dt-primary-light);
}

:global(html[data-theme='dark']) :global(.user-menu-popper .el-dropdown-menu__item--divided) {
  border-top-color: var(--dt-border);
}

/* SRM workbench skin */
.home-container {
  background: var(--dt-side-bg) !important;
}

.home-container .header-container {
  height: 60px;
  gap: 12px;
  padding: 0 20px 0 0;
  background: var(--dt-shell-header-bg) !important;
  border-bottom: 1px solid var(--dt-shell-header-border) !important;
  box-shadow: none !important;
  backdrop-filter: none;
}

.home-container .header-left {
  align-self: stretch;
  flex: 0 0 214px;
  min-width: 214px;
  justify-content: center;
  background: var(--dt-side-bg);
  border-right: 1px solid var(--dt-side-border);
}

.home-container .header-logo {
  display: none;
}

.home-container .header-title {
  color: var(--dt-side-active-text) !important;
  font-size: 20px;
  font-weight: 500;
}

.home-container .collapse-btn,
.home-container .theme-toggle {
  width: 32px;
  height: 32px;
  color: var(--dt-shell-header-muted) !important;
  background: transparent !important;
  border-color: transparent !important;
  border-radius: 6px;
  box-shadow: none !important;
}

.home-container .collapse-btn {
  margin: 0 8px 0 0;
}

.home-container .collapse-btn:hover,
.home-container .theme-toggle:hover,
.home-container .theme-toggle:focus-visible {
  color: var(--dt-shell-header-hover-text) !important;
  background: var(--dt-shell-header-hover-bg) !important;
  transform: none;
}

.top-menu :deep(.el-menu) {
  --el-menu-text-color: var(--dt-shell-header-text);
  --el-menu-hover-text-color: var(--dt-primary);
  --el-menu-hover-bg-color: transparent;
  --el-menu-active-color: var(--dt-primary);
  height: 60px;
}

.top-menu :deep(.el-menu-item) {
  height: 60px !important;
  line-height: 60px !important;
  padding: 0 18px !important;
  margin: 0 2px !important;
  color: var(--dt-shell-header-text) !important;
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-size: 14px;
  font-weight: 650;
}

.top-menu :deep(.el-menu-item:hover) {
  color: var(--dt-primary) !important;
  background: transparent !important;
}

.top-menu :deep(.el-menu-item.is-active) {
  color: var(--dt-primary) !important;
  background: transparent !important;
  box-shadow: inset 0 -3px 0 var(--dt-primary) !important;
}

.home-container .header-right {
  margin-left: 10px;
  gap: 8px;
}

.home-container .language-trigger,
.home-container .user-trigger {
  height: 38px;
  color: var(--dt-shell-header-text);
  background: transparent;
  border-color: transparent;
  border-radius: 6px;
}

.home-container .language-trigger .user-arrow {
  color: inherit;
  opacity: 0.72;
}

.home-container .language-trigger:hover,
.home-container .language-trigger:focus-visible,
.home-container .user-trigger:hover,
.home-container .user-trigger:focus-visible {
  color: var(--dt-shell-header-hover-text);
  background: var(--dt-shell-header-hover-bg);
  box-shadow: none;
}

.home-container .user-name {
  color: inherit !important;
  font-weight: 500;
}

.home-container .main-content {
  gap: 0;
  padding: 0;
  background: var(--dt-shell-content-bg);
}

.home-container .sidebar-container {
  width: 214px;
  padding: 18px 12px;
  border: 0 !important;
  border-right: 1px solid var(--dt-side-border) !important;
  border-radius: 0;
  box-shadow: none;
}

.home-container .sidebar-container.collapsed {
  width: 64px;
  padding: 18px 8px;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.sidebar-container :deep(.el-menu-item.is-active),
.sidebar-container :deep(.el-sub-menu__title.is-active),
.sidebar-container :deep(.el-sub-menu .el-menu-item.is-active) {
  box-shadow: none !important;
}

.home-container .main-container {
  border: 0;
  border-radius: 0;
  background: var(--dt-shell-content-bg);
  box-shadow: none;
}

.home-container .tabs-container {
  height: 54px;
  padding: 10px 16px 8px;
  background: var(--dt-shell-tabs-bg);
  border-bottom: 1px solid var(--dt-border);
}

.tabs-container :deep(.el-tabs__item) {
  min-width: 74px;
  height: 34px;
  line-height: 32px;
  color: var(--dt-text);
  background: var(--dt-surface);
  border-color: var(--dt-border) !important;
  border-radius: 5px;
  box-shadow: none;
  font-weight: 600;
}

.tabs-container :deep(.el-tabs__item.is-active) {
  color: var(--dt-primary);
  background: var(--dt-primary-subtle);
  border-color: var(--dt-primary-border) !important;
  box-shadow: none;
}

.home-container .content-wrapper {
  padding: 10px;
  background: var(--dt-shell-content-bg);
}

.home-container .content-wrapper > * {
  border-radius: 4px;
}

:global(html[data-theme='dark']) .home-container .header-container,
:global(html[data-theme='dark']) .home-container .main-container,
:global(html[data-theme='dark']) .home-container .content-wrapper {
  background: var(--dt-shell-content-bg);
}

:global(html[data-theme='dark']) .home-container .header-container {
  background: var(--dt-shell-header-bg) !important;
}

/* Sidebar navigation refinement */
.home-container .sidebar-container {
  padding: 14px 10px 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dt-side-bg) 96%, #ffffff 4%) 0%, var(--dt-side-bg) 100%),
    var(--dt-side-bg) !important;
}

.sidebar-container :deep(.el-menu) {
  padding: 2px 0;
  border-right: 0 !important;
}

.sidebar-container :deep(.el-sub-menu) {
  margin: 1px 0;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  position: relative;
  height: 42px;
  line-height: 42px;
  margin: 3px 0;
  padding: 0 12px !important;
  border-radius: 4px;
  color: color-mix(in srgb, var(--dt-side-text) 86%, transparent) !important;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
}

.sidebar-container :deep(.el-menu-item .el-icon),
.sidebar-container :deep(.el-sub-menu__title .el-icon) {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  font-size: 18px;
  opacity: 0.9;
}

.sidebar-container :deep(.el-menu-item span),
.sidebar-container :deep(.el-sub-menu__title span) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover) {
  color: var(--dt-side-hover-text) !important;
  background: color-mix(in srgb, var(--dt-side-hover-bg) 82%, transparent) !important;
}

.sidebar-container :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: var(--dt-side-hover-text) !important;
  background: color-mix(in srgb, var(--dt-side-hover-bg) 68%, transparent) !important;
}

.sidebar-container :deep(.el-menu-item.is-active),
.sidebar-container :deep(.el-sub-menu__title.is-active),
.sidebar-container :deep(.el-sub-menu .el-menu-item.is-active) {
  color: var(--dt-side-active-text) !important;
  background: var(--dt-side-active-bg) !important;
  font-weight: 650;
}

.sidebar-container :deep(.el-sub-menu .el-menu) {
  margin: 2px 0 6px;
  padding: 3px 0 4px;
  background: color-mix(in srgb, var(--dt-side-bg) 88%, #ffffff 12%) !important;
  border-radius: 4px;
}

.sidebar-container :deep(.el-sub-menu .el-menu-item) {
  height: 36px;
  line-height: 36px;
  margin: 2px 4px;
  padding-left: 38px !important;
  color: color-mix(in srgb, var(--dt-side-text) 76%, transparent) !important;
  font-size: 13px;
}

.sidebar-container :deep(.el-sub-menu__icon-arrow) {
  right: 12px;
  color: color-mix(in srgb, var(--dt-side-text) 64%, transparent) !important;
  font-size: 12px;
}

.home-container .sidebar-container.collapsed {
  padding: 14px 8px 18px;
}

.home-container .sidebar-container.collapsed :deep(.el-menu-item),
.home-container .sidebar-container.collapsed :deep(.el-sub-menu__title) {
  justify-content: center;
  padding: 0 !important;
}

.home-container .sidebar-container.collapsed :deep(.el-menu-item .el-icon),
.home-container .sidebar-container.collapsed :deep(.el-sub-menu__title .el-icon) {
  margin-right: 0;
}
</style>
