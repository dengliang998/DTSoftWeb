# DTSoft Admin

DTSoft Admin 是一个基于 Vue 3 的后台管理前端项目，主要用于用户、组织、角色权限、菜单、日志、附件、系统设置、API Key 以及动态应用配置等管理场景。

## 技术栈

- Vue 3
- Vue Router 4
- Vue CLI 5
- Element Plus
- Axios
- NProgress
- Less

## 核心能力

### 登录与工作台框架

- 账号密码登录，登录态统一存储在 `localStorage`，请求自动携带 `Authorization: Bearer <token>`。
- 登录页支持后台配置系统名称、背景图、验证码开关和浏览器 Tab 小 Logo。
- 路由守卫会在访问业务页面前检查登录态，未登录时跳转到 `/login`。
- 后台工作台包含顶部菜单、侧边栏菜单、标签页、多页面缓存、用户信息入口、修改密码和退出登录。

### 权限与基础数据

- 组织用户管理：部门组织、用户列表、用户资料、头像、密码重置和用户选择器。
- 角色权限管理：角色维护、成员管理、角色菜单授权。
- 菜单维护：支持菜单层级、图标、路由、隐藏菜单、扩展页面入口等配置。
- 操作日志：查询系统操作日志。
- 在线用户：查看当前在线用户状态。

### 系统设置与主题

- 系统设置集中维护系统名称、登录验证码、登录背景图、Tab 小 Logo 和后台主题。
- 主题支持预设配色和自定义配色，覆盖顶部菜单、侧边栏、页面背景、主色和暗色模式变量。
- 用户可在工作台头部切换亮色/暗色外观，选择保存在本地。
- 登录背景图限制为 `1MB`，支持 `JPG`、`PNG`、`WebP`；Tab 小 Logo 限制为 `256KB`，支持 `JPG`、`PNG`、`WebP`、`ICO`、`SVG`。

### 动态应用与自定义页面

- 动态应用配置提供低代码 CRUD 能力，支持字段配置、查询条件、列表、表单、详情、附件字段和子表配置。
- 动态应用运行时通过 `/app/:appPath` 渲染配置好的业务页面。
- 自定义页面运行时支持在 `public/custom-pages` 发布轻量 Vue 页面、静态 HTML 页面或已构建 JS 页面。
- 自定义页面通过菜单配置接入系统权限链路，可使用 `dtsoftSdk` 调用主系统 HTTP、路由、消息弹窗和隔离存储能力。

### 文件与集成

- 附件管理支持文件上传、下载、图片预览、视频预览和删除。
- API Key 管理支持密钥查询、创建、更新、删除，用于外部系统集成。

## 目录结构

```text
.
├── ARCHITECTURE.md         # 架构分层、开发约定与演进路线
├── public/                 # 静态入口文件
├── src/
│   ├── api/                # Axios 实例与业务 API 封装
│   ├── assets/             # 图片、字体图标、全局样式
│   ├── components/         # 通用业务组件
│   ├── constants/          # 跨模块常量
│   ├── core/               # 会话、响应解析等核心能力
│   ├── modules/            # 页面级复杂逻辑拆分
│   ├── plugins/            # Vue 插件与浏览器补丁安装
│   ├── router/             # 路由配置与登录守卫
│   ├── utils/              # 工具方法
│   ├── view/               # 页面视图
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── vue.config.js           # Vue CLI 构建与本地代理配置
├── package.json            # 项目依赖与脚本
└── README.md
```

## 快速开始

### 环境要求

建议使用 Node.js 16+ 或 18 LTS，并使用 npm 安装依赖。

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run serve
```

启动后访问终端输出的本地地址，通常是 `http://localhost:8080/`。

### 构建生产包

```bash
npm run build
```

构建产物会输出到 `dist/` 目录。

## 后端代理配置

本地开发代理在 `vue.config.js` 中配置：

```js
const apiProxyTarget = 'http://100.65.45.46:8000/api'
```

前端请求统一以 `/api` 开头，本地开发时会通过 Vue CLI devServer 代理到 `apiProxyTarget`，并移除路径前缀 `/api`：

```js
pathRewrite: { '^/api': '' }
```

如果后端地址发生变化，修改 `vue.config.js` 中的 `apiProxyTarget` 后重新启动开发服务。

## 请求与登录态

项目在 `src/api/http.js` 中创建统一的 Axios 实例：

- 请求开始时启动 NProgress。
- 除登录接口外，请求会自动携带 `Authorization: Bearer <token>`。
- 响应中出现 401 状态时会提示登录过期、清理本地登录信息，并跳转到 `/login`。

## 路由说明

项目使用 hash 路由，核心页面包括：

- `/login`：登录页
- `/home`：后台框架页
- `/welcome`：欢迎/概览页
- `/user/organization`：组织与用户管理
- `/role/rolesmenu`：角色权限
- `/log/logaction`：操作日志
- `/attachment/attachmentlist`：附件管理
- `/common/menus`：菜单维护
- `/common/systemsettings`：系统设置
- `/DynamicApp/DynamicApiConfig`：动态应用配置
- `/app/:appPath`：动态应用页面
- `/apikey/management`：API Key 管理

## 开发约定

- 页面组件集中放在 `src/view/`。
- 通用业务组件放在 `src/components/`。
- 业务 API 封装放在 `src/api/`，新代码优先调用领域 service，不在页面里直接拼核心接口。
- 登录态读写统一使用 `src/core/session.js`。
- 接口响应解析统一使用 `src/core/response.js`。
- 页面级复杂逻辑优先拆到 `src/modules/<page>/`，页面组件保留状态和视图编排。
- 全局样式放在 `src/assets/css/`。
- 新增页面后需要在 `src/router/index.js` 注册路由。
- 需要进入菜单的页面，需要同时在后端菜单数据中维护对应路径。
- 更完整的架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 部署说明

项目 `publicPath` 配置为 `./`，构建后的 `dist/` 可部署到静态资源服务器或后端静态目录。生产环境需要确保 `/api` 请求能够被服务器转发到实际后端服务。

## License

本项目使用 Mulan PSL v2，详见 [LICENSE](./LICENSE)。
