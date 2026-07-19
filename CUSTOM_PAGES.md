# Public 自定义页面

主应用只提供自定义页面运行时，不会自动创建菜单。菜单入口仍然通过系统现有“菜单配置”和角色权限配置完成，这样权限控制链路不变。

发布以后，客户只需要修改 `public/custom-pages` 里的页面文件和清单；菜单是否显示、给谁显示，仍由后台菜单和权限决定。

## 配置流程

1. 在 `public/custom-pages/manifest.json` 注册页面资源。
2. 在系统菜单配置里新增菜单，在“自定义页面”下拉里选择对应页面；系统会自动把菜单路径填成 `custom/<页面 name>/<页面 path>`。
3. 在角色权限里给对应角色授权这个菜单。

例如 manifest：

```json
{
  "pages": [
    {
      "name": "demo",
      "path": "index",
      "sfc": "demo/index.vue",
      "version": "1.0.0"
    }
  ]
}
```

如果不使用下拉，也可以手动填写后台菜单路径：

```text
custom/demo/index
```

实际访问路径是：

```text
#/custom/demo/index
```

## Vue 页面写法

在 `public/custom-pages/demo/index.vue` 里写页面：

```vue
<template>
  <section>
    <h2>{{ title }}</h2>
    <el-button type="primary" @click="showMessage">测试</el-button>
  </section>
</template>

<script>
export default {
  props: {
    dtsoftSdk: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      title: '我的自定义页面'
    }
  },
  methods: {
    showMessage() {
      this.dtsoftSdk.ui.message.success('调用主系统能力')
    }
  }
}
</script>

<style>
section {
  padding: 20px;
}
</style>
```

## 支持范围

这个 `.vue` 是运行时解析的轻量 SFC，适合交付后在 public 目录里做简单动态页面。当前支持：

- `<template>`。
- 普通 `<script>` 里的 `export default { ... }`。
- `<style>`，会注入到当前页面。
- Element Plus 组件，例如 `el-button`、`el-table`。

当前不支持：

- `<script setup>`。
- TypeScript。
- `import` 语句。
- scoped CSS 的自动哈希隔离。

如果页面需要复杂工程化能力，建议单独建一个 Vue 项目构建成 JS 后，再用 `entry` 方式挂载。

## SDK

自定义 Vue 页面会收到 `dtsoftSdk` prop，包含：

- `http`：主系统 axios 实例，会自动带登录 Token。
- `auth`：`getToken`、`getUserAccount`、`isAuthenticated`。
- `router`：`push`、`replace`、`back`、`current`。
- `ui`：Element Plus 的 `message`、`confirm`、`alert`、`notify`。
- `storage`：按页面隔离的 `local` 和 `session` 存储。
- `libs`：`Vue`、`ElementPlus`、`ElementPlusIconsVue`。
- `mountVue(component, props)`：在当前容器里挂载一个 Vue 组件，并返回卸载函数。

## 兼容写法

如果只需要静态 HTML，可以在 manifest 里配置：

```json
{
  "name": "notice",
  "path": "index",
  "html": "notice/index.html",
  "style": "notice/index.css"
}
```

如果页面已经构建成普通 JS，也可以继续用：

```json
{
  "name": "report",
  "path": "index",
  "entry": "report/index.js",
  "style": "report/index.css"
}
```

## 注意

浏览器里运行的自定义 JS 仍然能被用户看到。敏感逻辑、权限判断和密钥必须放在后端。
