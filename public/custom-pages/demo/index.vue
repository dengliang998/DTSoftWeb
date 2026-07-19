<template>
  <div class="dt-custom-demo">
    <div class="dt-custom-demo__head">
      <div>
        <h2>自定义 Vue 页面示例11</h2>
        <p>这个页面来自 public/custom-pages/demo/index.vue，不需要重新构建主应用。</p>
      </div>
      <el-button type="primary" @click="showMessage">测试 SDK 提示</el-button>
    </div>
    <pre class="dt-custom-demo__code">{{ JSON.stringify(pageInfo, null, 2) }}</pre>
  </div>
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
      userAccount: this.dtsoftSdk.auth.getUserAccount() || '未登录'
    }
  },
  computed: {
    pageInfo() {
      return {
        page: this.dtsoftSdk.page.name,
        userAccount: this.userAccount,
        route: this.dtsoftSdk.router.current().fullPath,
        sdkVersion: this.dtsoftSdk.version
      }
    }
  },
  methods: {
    showMessage() {
      this.dtsoftSdk.ui.message.success('自定义 Vue 页面可以调用主系统 SDK')
    }
  }
}
</script>

<style>
.dt-custom-demo {
  padding: 20px;
  color: #1f2937;
}

.dt-custom-demo__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #d8dee9;
  border-radius: 8px;
}

.dt-custom-demo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}

.dt-custom-demo p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.dt-custom-demo__code {
  margin: 16px 0 0;
  padding: 16px;
  color: #dbeafe;
  background: #111827;
  border-radius: 8px;
  overflow: auto;
}
</style>
