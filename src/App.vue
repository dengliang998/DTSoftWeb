<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
/* 全局按钮样式 */
.el-button {
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 主要按钮样式 - 与菜单选中状态颜色一致 */
.el-button--primary {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;
}

.el-button--primary:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.el-button--primary:active {
  background-color: #096dd9 !important;
  border-color: #096dd9 !important;
}

/* 普通按钮样式 - 与侧边栏背景色协调 */
.el-button--default {
  background-color: #374151 !important;
  border-color: #374151 !important;
  color: #d1d5db !important;
}

.el-button--default:hover {
  background-color: #4b5563 !important;
  border-color: #4b5563 !important;
  color: #ffffff !important;
}

.el-button--default:active {
  background-color: #1f2937 !important;
  border-color: #1f2937 !important;
  color: #ffffff !important;
}

/* 危险按钮样式 */
.el-button--danger {
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
  color: #ffffff !important;
}

.el-button--danger:hover {
  background-color: #ff7875 !important;
  border-color: #ff7875 !important;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

.el-button--danger:active {
  background-color: #d9363e !important;
  border-color: #d9363e !important;
}

/* 文本按钮样式 */
.el-button--text {
  color: #1890ff !important;
}

.el-button--text:hover {
  color: #40a9ff !important;
  background-color: rgba(24, 144, 255, 0.1) !important;
}

/* 按钮图标样式 */
.el-button .el-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>