<!-- eslint-disable vue/no-mutating-props -->
<template>
  <section class="form-section form-section--main">
    <div class="form-section-head">
      <div>
        <h3 class="form-section-title">{{ $t('microRuntime.baseInfo') }}</h3>
      </div>
      <span class="section-pill">
        {{ $t('microRuntime.requiredProgress', { completed: completedRequiredFieldCount, total: requiredFieldCount }) }}
      </span>
    </div>
    <el-row class="main-field-grid" :gutter="16">
      <el-col v-for="(field, index) in orderedFields" :key="index" :span="formFieldSpan">
        <el-form-item
          class="main-form-item"
          :label="field.label || field.fieldName"
          :prop="field.fieldName"
          :rules="getFieldRules(field)"
        >
          <el-input
            v-if="field.fieldType === 'string'"
            v-model="formData[field.fieldName]"
            :placeholder="$t('microRuntime.inputPlaceholder', { label: field.label || field.fieldName })"
            :disabled="isFieldDisabled(field)"
          ></el-input>
          <el-input-number
            v-else-if="field.fieldType === 'number'"
            v-model="formData[field.fieldName]"
            style="width: 100%"
            :disabled="isFieldDisabled(field)"
          ></el-input-number>
          <el-date-picker
            v-else-if="field.fieldType === 'datetime'"
            v-model="formData[field.fieldName]"
            :type="getDatePickerType(field)"
            :value-format="getDateValueFormat(field)"
            :format="getDateDisplayFormat(field)"
            style="width: 100%"
            :disabled="isFieldDisabled(field)"
          ></el-date-picker>
          <el-switch
            v-else-if="field.fieldType === 'boolean'"
            v-model="formData[field.fieldName]"
            :disabled="isFieldDisabled(field)"
          ></el-switch>
          <el-input
            v-else-if="field.fieldType === 'textarea'"
            v-model="formData[field.fieldName]"
            type="textarea"
            :rows="4"
            :disabled="isFieldDisabled(field)"
          ></el-input>
          <el-select
            v-else-if="field.fieldType === 'select'"
            v-model="formData[field.fieldName]"
            style="width: 100%"
            :disabled="isFieldDisabled(field)"
          >
            <el-option
              v-for="opt in field.options || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
          <el-radio-group
            v-else-if="field.fieldType === 'radio'"
            v-model="formData[field.fieldName]"
            :disabled="isFieldDisabled(field)"
          >
            <el-radio v-for="opt in field.options || []" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
          <el-checkbox-group
            v-else-if="field.fieldType === 'checkbox'"
            v-model="formData[field.fieldName]"
            :disabled="isFieldDisabled(field)"
          >
            <el-checkbox v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>
          <div
            v-else-if="field.fieldType === 'lookup'"
            class="lookup-field"
            :class="{ 'is-disabled': isFieldDisabled(field) }"
          >
            <el-input
              v-model="formData[field.fieldName]"
              readonly
              :placeholder="$t('microRuntime.selectPlaceholder', { label: field.label || field.fieldName })"
              :disabled="isFieldDisabled(field)"
            ></el-input>
            <button
              class="lookup-field__button"
              type="button"
              :disabled="isFieldDisabled(field)"
              @click="$emit('open-lookup', field)"
            >
              <el-icon><Search /></el-icon>
            </button>
          </div>
          <MicroAppAttachmentField
            v-else-if="field.fieldType === 'attachment'"
            :upload-action-url="uploadActionUrl"
            :upload-headers="uploadHeaders"
            :attachments="getAttachmentList(field)"
            :disabled="isFieldDisabled(field)"
            @upload-success="(response, file) => $emit('attachment-upload-success', response, file, field)"
            @upload-error="$emit('attachment-upload-error', $event)"
            @remove="$emit('remove-attachment', field, $event)"
          />
          <el-input v-else v-model="formData[field.fieldName]" :disabled="isFieldDisabled(field)"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
  </section>
</template>

<script>
import { Search } from '@element-plus/icons-vue'
import { getDateDisplayFormat, getDatePickerType, getDateValueFormat } from '../utils/microAppField'
import MicroAppAttachmentField from './MicroAppAttachmentField.vue'

export default {
  name: 'MicroAppMainFields',
  components: {
    MicroAppAttachmentField,
    Search
  },
  props: {
    formData: { type: Object, required: true },
    orderedFields: { type: Array, default: () => [] },
    formFieldSpan: { type: Number, default: 24 },
    dialogType: { type: String, default: 'create' },
    requiredFieldCount: { type: Number, default: 0 },
    completedRequiredFieldCount: { type: Number, default: 0 },
    uploadActionUrl: { type: String, default: '' },
    uploadHeaders: { type: Object, default: () => ({}) },
    getFieldRules: { type: Function, required: true },
    getAttachmentList: { type: Function, required: true }
  },
  emits: ['open-lookup', 'attachment-upload-success', 'attachment-upload-error', 'remove-attachment'],
  methods: {
    scrollIntoView(options) {
      this.$el?.scrollIntoView?.(options)
    },
    getDatePickerType(field) {
      return getDatePickerType(field)
    },
    getDateValueFormat(field) {
      return getDateValueFormat(field)
    },
    getDateDisplayFormat(field) {
      return getDateDisplayFormat(field)
    },
    isFieldDisabled(field) {
      return this.dialogType === 'edit' && !field.editable
    }
  }
}
</script>

<style scoped>
.form-section {
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(26, 42, 68, 0.05);
}

.form-section--main {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.form-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 6px 12px;
  border-bottom: 1px solid #e6ebf2;
  background: #f8fafc;
}

.form-section-title {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-weight: 800;
  line-height: 22px;
}

.section-pill {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #a85116;
  font-size: 12px;
  font-weight: 800;
  line-height: 18px;
}

.main-field-grid {
  padding: 10px 12px 0;
}

.main-form-item {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  margin-bottom: 10px !important;
}

.main-form-item :deep(.el-form-item__label) {
  justify-content: flex-start;
  min-height: 32px !important;
  padding: 0 !important;
  line-height: 32px !important;
}

.main-form-item :deep(.el-form-item__content) {
  min-width: 0;
  min-height: 32px;
  line-height: 32px;
}

.main-form-item :deep(.el-select),
.main-form-item :deep(.el-date-editor),
.main-form-item :deep(.el-input-number),
.main-form-item :deep(.el-input),
.main-form-item :deep(.el-textarea) {
  width: 100%;
}

.lookup-field {
  display: grid;
  width: 100%;
  height: 32px;
  max-height: 32px;
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) 36px;
  align-items: center;
  border: 1px solid #d7deea;
  overflow: hidden;
  border-radius: 4px;
  background: #ffffff;
  line-height: 32px;
}

.lookup-field:hover {
  border-color: #9fb0c8;
}

.lookup-field:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}

.lookup-field :deep(.el-input) {
  height: 30px;
  max-height: 30px;
  line-height: 30px;
}

.lookup-field :deep(.el-input__wrapper) {
  height: 30px !important;
  min-height: 30px !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.lookup-field :deep(.el-input__inner) {
  height: 30px;
  line-height: 30px;
}

.lookup-field__button {
  appearance: none;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 40px !important;
  min-width: 40px !important;
  height: 30px !important;
  min-height: 30px !important;
  max-height: 30px !important;
  box-sizing: border-box;
  margin: 0;
  padding: 0 !important;
  border: 0;
  border-radius: 0 !important;
  background: #1677ff;
  color: #ffffff;
  cursor: pointer;
  line-height: 30px !important;
}

.lookup-field__button:hover,
.lookup-field__button:focus {
  background: #0f67dc;
  outline: none;
}

.lookup-field__button:disabled {
  background: #a8c7f7;
  cursor: not-allowed;
}

.lookup-field__button .el-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 16px;
  line-height: 16px;
}

.lookup-field.is-disabled .lookup-field__button {
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .main-form-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .main-form-item :deep(.el-form-item__label) {
    padding-top: 0 !important;
  }

  .form-section-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

:global(html[data-theme='dark']) .form-section {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

:global(html[data-theme='dark']) .form-section-head {
  background: var(--dt-surface-soft) !important;
  border-color: var(--dt-border) !important;
}

:global(html[data-theme='dark']) .form-section-title {
  color: var(--dt-text) !important;
}
</style>
