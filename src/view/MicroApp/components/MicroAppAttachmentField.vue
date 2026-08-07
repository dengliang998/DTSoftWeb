<template>
  <div class="attachment-field">
    <el-upload
      class="attachment-upload"
      :action="uploadActionUrl"
      name="Files"
      multiple
      :headers="uploadHeaders"
      :show-file-list="false"
      :disabled="disabled"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
    >
      <el-button type="primary" size="small" icon="Upload" :disabled="disabled">
        {{ $t('microRuntime.uploadAttachment') }}
      </el-button>
    </el-upload>
    <div v-if="attachments.length > 0" class="attachment-list">
      <div
        v-for="(attachment, attachmentIndex) in attachments"
        :key="getAttachmentKey(attachment, attachmentIndex)"
        class="attachment-item"
      >
        <span class="attachment-name" :title="getAttachmentName(attachment)">
          {{ getAttachmentName(attachment) }}
        </span>
        <el-button
          v-if="!disabled"
          class="attachment-remove-button"
          text
          type="danger"
          size="small"
          icon="Delete"
          :title="$t('microRuntime.removeAttachment')"
          @click="$emit('remove', attachmentIndex)"
        ></el-button>
      </div>
    </div>
    <div v-else class="attachment-empty">{{ $t('microRuntime.noAttachment') }}</div>
  </div>
</template>

<script>
import { getAttachmentKey, getAttachmentName } from '../utils/microAppField'

export default {
  name: 'MicroAppAttachmentField',
  props: {
    uploadActionUrl: { type: String, default: '' },
    uploadHeaders: { type: Object, default: () => ({}) },
    attachments: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false }
  },
  emits: ['upload-success', 'upload-error', 'remove'],
  methods: {
    getAttachmentKey(attachment, index) {
      return getAttachmentKey(attachment, index)
    },
    getAttachmentName(attachment) {
      return getAttachmentName(attachment)
    },
    handleUploadSuccess(response, file) {
      this.$emit('upload-success', response, file)
    },
    handleUploadError(error) {
      this.$emit('upload-error', error)
    }
  }
}
</script>

<style scoped>
.attachment-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: #fbfdff;
}

.attachment-name {
  min-width: 0;
  overflow: hidden;
  color: #344563;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-remove-button {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: #e5484d !important;
}

.attachment-remove-button:hover,
.attachment-remove-button:focus {
  background: #feecec !important;
  color: #c73338 !important;
}

.attachment-empty {
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}

:global(html[data-theme='dark']) .attachment-item {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

:global(html[data-theme='dark']) .attachment-name {
  color: var(--dt-text) !important;
}

:global(html[data-theme='dark']) .attachment-empty {
  color: var(--dt-text-muted) !important;
}

:global(html[data-theme='dark']) .attachment-remove-button:hover,
:global(html[data-theme='dark']) .attachment-remove-button:focus {
  background: var(--dt-danger-soft) !important;
  color: var(--dt-danger) !important;
}
</style>
