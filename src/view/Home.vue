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
            <span>{{ item.MenuName }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <!-- 用户信息区域 -->
        <div class="header-user-info">
          <span class="user-name">{{ UserDisplayName }}</span>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-avatar :size="40" class="user-avatar" :src="circleUrl">
              <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="ModifyPwdDialog">修改密码</el-dropdown-item>
                <el-dropdown-item command="ModifyAccountInfoDialog">账号信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
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
                <span>{{ item.MenuName }}</span>
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
                  <span>{{ subItem.MenuName }}</span>
                </template>
              </el-menu-item>
            </el-sub-menu>

            <!-- 无子菜单的情况 -->
            <el-menu-item v-else :index="'/' + item.path" @click="saveNavState('/' + item.path)">
              <el-icon v-if="item.Icon">
                <component :is="getIconComponent(item.Icon)" />
              </el-icon>
              <template #title>
                <span>{{ item.MenuName }}</span>
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
            <el-tab-pane v-for="tab in openedTabs" :key="tab.path" :name="tab.path" :closable="tab.path !== '/welcome'">
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
    <el-dialog v-model="UserDialogVisible" title="修改用户信息" width="50%" @close="UserDialogClosed">
      <UserInfo-components ref="UserInfo" :Account="LoginAcc" OpenType="Edit"></UserInfo-components>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="UpdateUserInfo">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import UserInfoComponents from '../components/user/UserInfoComponents.vue'
import ModifyPwdDialog from '@/components/ModifyPwdDialog.vue'
import { getMenu } from '@/api/menu'
import { getUserAccount } from '@/core/session'
import {
  filterHiddenMenus,
  findChildrenByMenuId,
  getIconComponent,
  getMenuTitleByPath,
  getRootMenus,
  resolveInitialMenuState
} from '@/modules/home/menuState'
import {
  buildCachedViews,
  createDefaultTabs,
  getCacheNameByPath,
  getNextTabAfterRemove,
  refreshTabTitles,
  saveActivePath,
  shouldSkipTab,
  upsertTab
} from '@/modules/home/tabs'
import { createModifyPwdForm, loadCurrentUserProfile, logoutAndClearSession } from '@/modules/home/userPanel'
import { fetchAndCacheSystemInfo, getCachedBrowserLogoDataUrl, getCachedSystemName } from '@/utils/sysConfig'
import defaultHomeLogo from '@/assets/imgs/homelogo.png'
export default {
  name: 'Home',
  components: {
    UserInfoComponents,
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
    this.getAllMenuList()
    // 在创建生命周期函数的时候获取保存的路径并赋值到数据中
    //this.activePath = window.sessionStorage.getItem('activePath')
    this.loadUserProfile()

    // 初始化默认标签页
    this.initDefaultTab()
    // 如果刷新时当前路由不是欢迎页，也加入标签并加入缓存
    if (this.$route && this.$route.path && this.$route.path !== '/welcome' && this.$route.path !== '/login') {
      this.addTab(this.$route.path)
    }
  },
  methods: {
    getCacheNameByPath(path) {
      return getCacheNameByPath(this.$router, path)
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
        this.$message.error('用户信息初始化失败，请稍后重试！')
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
      getMenu()
        .then(function (response) {
          const menuData = response.data.data || response.data
          me.menuList = Array.isArray(menuData) ? filterHiddenMenus(menuData) : []

          // 提取一级菜单（pid为0的菜单项）
          me.fatherMenuList = getRootMenus(me.menuList)

          // 首页初次打开时不默认选中第一个一级菜单：
          // - 如果当前路由属于某个一级菜单下，则选中对应的一级菜单并加载其子菜单
          // - 否则仅加载第一个一级菜单的子菜单（不高亮任何一级菜单）
          const menuState = resolveInitialMenuState(me.menuList, me.$route?.path || '')
          me.activeTopMenu = menuState.activeTopMenu
          me.childrenMenuList = menuState.childrenMenuList

          // 菜单加载完成后，修正已打开标签页的标题（刷新时避免显示“页面”）
          me.$nextTick(() => {
            me.refreshOpenedTabsTitles()
            if (me.$route && me.$route.path && me.$route.path !== '/welcome' && me.$route.path !== '/login') {
              me.addTab(me.$route.path)
              me.refreshOpenedTabsTitles()
            }
          })
        })
        .catch(function () {
          me.$message.error('获取菜单数据失败，请稍后重试！')
        })
    },

    getChildrenMenuList(menuId) {
      this.childrenMenuList = findChildrenByMenuId(this.menuList, menuId)
      this.$nextTick(() => {})
    },

    // 处理顶部菜单选择
    handleTopMenuSelect(index) {
      this.activeTopMenu = index
      // 获取选中菜单的子菜单
      this.getChildrenMenuList(index)
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
      // 如果是欢迎页面或登录页面，不添加标签
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
      return getMenuTitleByPath(this.menuList, path)
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
    },

    // 初始化默认标签页
    initDefaultTab() {
      // 添加欢迎页标签
      this.openedTabs = createDefaultTabs()
      this.activeTab = '/welcome'
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
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  background-color: #fafafa;
  border-top: 1px solid #ebeef5;
  padding: 16px 24px;
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
</style>
