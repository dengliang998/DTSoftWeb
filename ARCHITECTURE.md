# 前端架构说明

## 目标

项目当前采用 Vue 3 + Vue Router + Element Plus + Axios。架构优化的目标是先建立稳定边界，再逐步迁移页面，避免一次性重写带来的回归风险。

## 分层

```text
src/
├── api/          # 后端接口封装，页面不直接拼核心业务接口
├── constants/    # 跨模块常量，例如本地存储键
├── core/         # 框架无关的核心能力：会话、响应解析等
├── modules/      # 页面级复杂逻辑拆分，例如 Home 的菜单、标签页和用户面板
├── plugins/      # Vue 插件与浏览器补丁安装
├── router/       # 路由声明与守卫
├── utils/        # 通用工具函数
├── components/   # 可复用业务组件
└── view/         # 页面视图
```

## 核心约定

- 登录态统一通过 `src/core/session.js` 读写，禁止在新代码里散落 `token`、`UserAcc` 等存储键。
- 后端响应格式统一通过 `src/core/response.js` 判断，兼容 `Code/code/StateCode/statusCode/success` 等历史格式。
- Axios 实例只放在 `src/api/http.js`，统一处理进度条、Token 注入和 401 失效跳转。
- 业务接口按领域放到 `src/api/*.js`，例如 `auth.js`、`user.js`、`menu.js`。
- 路由声明放在 `src/router/routes.js`，守卫放在 `src/router/index.js`。
- Vue 插件注册放在 `src/plugins/`，`main.js` 只负责应用装配。
- 页面级复杂逻辑可以放在 `src/modules/<page>/`，优先沉淀为纯函数，页面组件负责状态绑定和交互编排。

## 新增或迁移页面流程

1. 在 `src/api/` 中新增或复用领域接口封装。
2. 在 `src/router/routes.js` 注册路由，并设置 `meta.cacheName`；需要登录的页面默认 `requiresAuth: true`。
3. 页面内通过 API service 调用接口，避免直接引用 `src/api/http.js`。
4. 如需读写登录态，通过 `src/core/session.js`。
5. 如需判断接口成功、失败消息或数据体，通过 `src/core/response.js`。

## 后续演进建议

- 按模块继续收敛重复的表单参数构造，减少页面里的 `URLSearchParams` 和 `FormData` 细节。
- 将 `Home.vue` 的头部、侧栏菜单、标签页进一步拆为展示组件。
- 对动态应用、组织用户、角色权限三个复杂模块补充领域 service 和基础单元测试。
- 引入统一的错误提示策略，避免页面和 HTTP 拦截器重复弹窗。
- 在业务稳定后考虑引入状态管理，例如 Pinia，用于菜单、用户信息和系统配置缓存。
