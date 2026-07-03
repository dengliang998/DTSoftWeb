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

## 功能模块

- 登录认证：通过 `/api/Auth/login` 登录，登录态存储在 `localStorage`。
- 路由守卫：访问业务页面前检查 `token`，未登录时跳转到登录页。
- 首页框架：顶部菜单、侧边栏菜单、标签页、页面缓存和用户信息入口。
- 用户与组织：部门组织、用户列表、用户信息维护、密码重置、用户选择器。
- 角色权限：角色维护、成员管理、菜单授权。
- 菜单维护：系统菜单的新增、编辑、删除和层级展示。
- 系统设置：系统名称和登录背景图配置。
- 附件管理：文件上传、下载、预览和删除。
- 操作日志：系统操作日志查询。
- API Key 管理：密钥查询、创建、更新和删除。
- 动态应用：动态 CRUD 页面配置和运行时页面渲染。

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
- 全局样式放在 `src/assets/css/`。
- 新增页面后需要在 `src/router/index.js` 注册路由。
- 需要进入菜单的页面，需要同时在后端菜单数据中维护对应路径。
- 更完整的架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 部署说明

项目 `publicPath` 配置为 `./`，构建后的 `dist/` 可部署到静态资源服务器或后端静态目录。生产环境需要确保 `/api` 请求能够被服务器转发到实际后端服务。

## License

本项目使用 Mulan PSL v2，详见 [LICENSE](./LICENSE)。
