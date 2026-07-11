<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="API密钥创建成功" width="60%" @close="dialogVisible = false">
    <el-alert title="请妥善保管您的SecretKey！" type="warning" :closable="false" show-icon style="margin-bottom: 20px">
      <template #default><p>SecretKey仅在创建时显示一次，请务必妥善保存。如果遗失，请重新创建新的密钥。</p></template>
    </el-alert>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="密钥名称">{{ data.KeyName }}</el-descriptions-item>
      <el-descriptions-item label="SecretKey">
        <div style="display: flex; align-items: center; gap: 10px">
          <el-input v-model="data.SecretKey" readonly></el-input>
          <el-button type="primary" @click="copyKey">复制</el-button>
        </div>
      </el-descriptions-item>
    </el-descriptions>
    <el-alert title="安全建议" type="info" :closable="false" show-icon style="margin-top: 20px">
      <template #default>
        <ul style="margin: 0; padding-left: 20px">
          <li>请安全存储SecretKey，建议使用环境变量或密钥管理服务</li>
          <li>不要在前端代码中硬编码SecretKey</li>
          <li>定期更换API密钥</li>
          <li>发现泄露请立即禁用并重新生成</li>
        </ul>
      </template>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">我已妥善保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'ApiKeySecretDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    data: { type: Object, default: () => ({ KeyName: '', SecretKey: '' }) }
  },
  emits: ['update:modelValue'],
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    }
  },
  methods: {
    async copyKey() {
      try {
        await navigator.clipboard.writeText(this.data.SecretKey)
        this.$message.success('已复制到剪贴板')
      } catch (error) {
        this.$message.error('复制失败，请手动复制')
      }
    }
  }
}
</script>
