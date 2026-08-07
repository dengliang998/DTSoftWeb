<template>
  <span class="dialog-footer">
    <span class="footer-status">
      {{ $t('microRuntime.footerRequired', { completed: completedRequiredFieldCount, total: requiredFieldCount }) }}
      <template v-if="subTableCount > 0">{{ $t('microRuntime.footerDetails', { rows: totalSubTableRows }) }}</template>
    </span>
    <span class="footer-actions">
      <el-button @click="$emit('cancel')">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitLoading" @click="$emit('submit')">{{ $t('common.save') }}</el-button>
    </span>
  </span>
</template>

<script>
export default {
  name: 'MicroAppFormFooter',
  props: {
    completedRequiredFieldCount: { type: Number, default: 0 },
    requiredFieldCount: { type: Number, default: 0 },
    subTableCount: { type: Number, default: 0 },
    totalSubTableRows: { type: Number, default: 0 },
    submitLoading: { type: Boolean, default: false }
  },
  emits: ['cancel', 'submit']
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.footer-status {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-actions :deep(.el-button),
.dialog-footer > :deep(.el-button) {
  min-width: 104px;
  height: 38px;
  border-radius: 8px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .dialog-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .footer-actions,
  .footer-actions :deep(.el-button) {
    width: 100%;
  }
}

:global(html[data-theme='dark']) .dialog-footer {
  background: var(--dt-surface-soft) !important;
  border-color: var(--dt-border) !important;
}
</style>
