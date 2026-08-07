<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('apiKey.secretTitle')" width="60%" @close="dialogVisible = false">
    <el-alert
      :title="$t('apiKey.keepSecretTitle')"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p>{{ $t('apiKey.keepSecretText') }}</p>
      </template>
    </el-alert>
    <el-descriptions :column="1" border>
      <el-descriptions-item :label="$t('apiKey.keyName')">{{ data.KeyName }}</el-descriptions-item>
      <el-descriptions-item label="SecretKey">
        <div style="display: flex; align-items: center; gap: 10px">
          <el-input v-model="data.SecretKey" readonly></el-input>
          <el-button type="primary" @click="copyKey">{{ $t('apiKey.copy') }}</el-button>
        </div>
      </el-descriptions-item>
    </el-descriptions>
    <el-alert :title="$t('apiKey.securityAdvice')" type="info" :closable="false" show-icon style="margin-top: 20px">
      <template #default>
        <ul style="margin: 0; padding-left: 20px">
          <li>{{ $t('apiKey.adviceStore') }}</li>
          <li>{{ $t('apiKey.adviceNoHardcode') }}</li>
          <li>{{ $t('apiKey.adviceRotate') }}</li>
          <li>{{ $t('apiKey.adviceLeak') }}</li>
        </ul>
      </template>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">{{ $t('apiKey.savedConfirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'IntegrationApiKeySecretDialog',
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
        this.$message.success(this.$t('apiKey.copied'))
      } catch (error) {
        this.$message.error(this.$t('apiKey.copyFailed'))
      }
    }
  }
}
</script>
