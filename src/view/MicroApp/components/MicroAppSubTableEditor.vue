<template>
  <section class="form-section subtable-form-sections">
    <div class="subtable-group-heading">
      <div>
        <div class="section-kicker">明细</div>
        <div class="subtable-group-title">明细信息</div>
        <div class="subtable-group-subtitle">维护当前记录的关联明细</div>
      </div>
      <span class="subtable-group-count">{{ subTables.length }} 个子表 / {{ totalSubTableRows }} 行</span>
    </div>
    <el-tabs v-model="activeSubTableName" class="subtable-tabs" @tab-click="$emit('activate')">
      <el-tab-pane v-for="subTable in subTables" :key="subTable.tableName" :name="subTable.tableName">
        <template #label>
          <span class="subtable-tab-label">
            {{ subTable.label || subTable.tableName }}
            <em>{{ getRows(subTable).length }}</em>
          </span>
        </template>
        <section class="subtable-panel">
          <div class="subtable-panel-header">
            <div class="subtable-title-area">
              <span class="subtable-title-marker"></span>
              <div>
                <div class="subtable-title">{{ subTable.label || subTable.tableName }}</div>
                <div class="subtable-meta">
                  {{ getRows(subTable).length }} 行
                  <template v-if="subTable.maxRows">/ 最多 {{ subTable.maxRows }} 行</template>
                </div>
              </div>
            </div>
            <div class="subtable-actions">
              <el-button
                v-if="subTable.enableLookup"
                class="subtable-action-button"
                size="small"
                icon="Search"
                :disabled="isMaxReached(subTable)"
                @click="$emit('open-lookup', subTable)"
              >
                选择数据
              </el-button>
              <el-button
                class="subtable-action-button subtable-action-button--primary"
                type="primary"
                size="small"
                icon="Plus"
                :disabled="isMaxReached(subTable)"
                @click="$emit('add-row', subTable)"
              >
                新增行
              </el-button>
            </div>
          </div>
          <div v-if="getRows(subTable).length === 0" class="subtable-empty-state">
            <div class="subtable-empty-title">暂无明细</div>
            <div class="subtable-empty-text">可以新增空白行，也可以从配置的数据源带入</div>
            <div class="subtable-empty-actions">
              <el-button
                v-if="subTable.enableLookup"
                size="small"
                icon="Search"
                :disabled="isMaxReached(subTable)"
                @click="$emit('open-lookup', subTable)"
              >
                选择数据
              </el-button>
              <el-button
                type="primary"
                size="small"
                icon="Plus"
                :disabled="isMaxReached(subTable)"
                @click="$emit('add-row', subTable)"
              >
                新增第一行
              </el-button>
            </div>
          </div>
          <div v-else class="subtable-editor-wrap">
            <el-table
              :data="getRows(subTable)"
              border
              stripe
              class="subtable-editor"
              :height="editorHeight"
              :row-style="{ height: '52px' }"
              :cell-style="{ padding: '6px 0' }"
            >
              <el-table-column type="index" label="序号" width="64"></el-table-column>
              <el-table-column
                v-for="field in normalizeFieldOrder(subTable.fields)"
                :key="field.fieldName"
                :label="field.label || field.fieldName"
                :min-width="field.fieldType === 'textarea' ? 240 : 180"
              >
                <template #default="{ row, $index }">
                  <el-form-item
                    class="subtable-form-item"
                    :prop="`__subTables.${subTable.tableName}.${$index}.${field.fieldName}`"
                    :rules="getFieldRules(field)"
                  >
                    <el-input
                      v-if="field.fieldType === 'string'"
                      v-model="row[field.fieldName]"
                      :disabled="isFieldDisabled(field)"
                    ></el-input>
                    <el-input-number
                      v-else-if="field.fieldType === 'number'"
                      v-model="row[field.fieldName]"
                      style="width: 100%"
                      :disabled="isFieldDisabled(field)"
                    ></el-input-number>
                    <el-date-picker
                      v-else-if="field.fieldType === 'datetime'"
                      v-model="row[field.fieldName]"
                      :type="getDatePickerType(field)"
                      :value-format="getDateValueFormat(field)"
                      :format="getDateDisplayFormat(field)"
                      style="width: 100%"
                      :disabled="isFieldDisabled(field)"
                    ></el-date-picker>
                    <el-switch
                      v-else-if="field.fieldType === 'boolean'"
                      v-model="row[field.fieldName]"
                      :disabled="isFieldDisabled(field)"
                    ></el-switch>
                    <el-input
                      v-else-if="field.fieldType === 'textarea'"
                      v-model="row[field.fieldName]"
                      type="textarea"
                      :rows="2"
                      :disabled="isFieldDisabled(field)"
                    ></el-input>
                    <el-select
                      v-else-if="field.fieldType === 'select'"
                      v-model="row[field.fieldName]"
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
                      v-model="row[field.fieldName]"
                      :disabled="isFieldDisabled(field)"
                    >
                      <el-radio v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                        {{ opt.label }}
                      </el-radio>
                    </el-radio-group>
                    <el-checkbox-group
                      v-else-if="field.fieldType === 'checkbox'"
                      v-model="row[field.fieldName]"
                      :disabled="isFieldDisabled(field)"
                    >
                      <el-checkbox v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                        {{ opt.label }}
                      </el-checkbox>
                    </el-checkbox-group>
                    <el-input v-else v-model="row[field.fieldName]" :disabled="isFieldDisabled(field)"></el-input>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right" align="center">
                <template #default="{ $index }">
                  <el-button
                    class="subtable-delete-button"
                    type="danger"
                    size="small"
                    icon="Delete"
                    title="删除行"
                    @click="$emit('remove-row', subTable, $index)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script>
import {
  getDateDisplayFormat,
  getDatePickerType,
  getDateValueFormat,
  normalizeFieldOrder
} from '../utils/microAppField'

export default {
  name: 'MicroAppSubTableEditor',
  props: {
    modelValue: { type: String, default: '' },
    subTables: { type: Array, default: () => [] },
    totalSubTableRows: { type: Number, default: 0 },
    editorHeight: { type: String, default: '100%' },
    dialogType: { type: String, default: 'create' },
    getRows: { type: Function, required: true },
    isMaxReached: { type: Function, required: true },
    getFieldRules: { type: Function, required: true }
  },
  emits: ['update:modelValue', 'activate', 'open-lookup', 'add-row', 'remove-row'],
  computed: {
    activeSubTableName: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  methods: {
    scrollIntoView(options) {
      this.$el?.scrollIntoView?.(options)
    },
    normalizeFieldOrder(fields) {
      return normalizeFieldOrder(fields)
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
.subtable-form-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  margin-top: 0 !important;
  padding: 16px 18px 18px;
}

.subtable-group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.subtable-group-title {
  color: #172033;
  font-size: 16px;
  font-weight: 700;
  line-height: 26px;
}

.subtable-group-subtitle {
  margin-top: 2px;
  color: #768397;
  font-size: 13px;
  line-height: 20px;
}

.subtable-group-count {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: #35639b;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.subtable-tabs {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.subtable-tabs :deep(.el-tabs__content) {
  height: calc(100% - 44px);
  min-height: 0;
}

.subtable-tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
}

.subtable-tabs :deep(.el-tabs__header) {
  margin: 0 0 12px;
}

.subtable-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #e6ebf2;
}

.subtable-tab-label {
  display: inline-flex;
  align-items: center;
  max-width: 220px;
  gap: 8px;
}

.subtable-tab-label em {
  min-width: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: #eef2f7;
  color: #536176;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.subtable-tabs :deep(.is-active .subtable-tab-label em) {
  background: #16a6a0;
  color: #ffffff;
}

.subtable-panel {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(35, 54, 86, 0.06);
}

.subtable-panel-header {
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #e6ebf2;
  background: #f6f8fb;
}

.subtable-title-area {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.subtable-title-marker {
  width: 4px;
  height: 32px;
  flex: 0 0 4px;
  border-radius: 4px;
  background: #1677ff;
}

.subtable-title {
  overflow: hidden;
  color: #26344d;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtable-meta {
  margin-top: 2px;
  color: #768397;
  font-size: 12px;
  line-height: 18px;
}

.subtable-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
}

.subtable-action-button {
  height: 36px !important;
  padding: 0 14px !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
}

.subtable-action-button--primary {
  background: #1677ff !important;
  border-color: #1677ff !important;
}

.subtable-editor-wrap {
  min-height: 0;
  overflow: hidden;
  padding: 12px 12px 64px;
  background: #ffffff;
}

.subtable-editor {
  width: 100%;
  height: 100% !important;
  border-radius: 8px;
}

.subtable-editor :deep(.el-table__inner-wrapper),
.subtable-editor :deep(.el-table__body-wrapper),
.subtable-editor :deep(.el-scrollbar),
.subtable-editor :deep(.el-scrollbar__wrap) {
  min-height: 0;
}

.subtable-editor :deep(.el-scrollbar__view) {
  padding-bottom: 18px;
}

.subtable-editor :deep(.el-table__header th) {
  height: 42px;
  background: #f2f5f9;
  color: #364258;
  font-size: 13px;
  font-weight: 700;
}

.subtable-editor :deep(.el-table__cell) {
  padding: 6px 0;
  vertical-align: middle;
}

.subtable-editor :deep(.cell) {
  display: flex;
  min-height: 36px;
  align-items: center;
}

.subtable-editor :deep(.el-table__fixed-right .cell),
.subtable-editor :deep(.el-table__fixed-right-patch .cell) {
  justify-content: center;
}

.subtable-empty-state {
  display: flex;
  height: 100%;
  min-height: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  color: #8a98aa;
  font-size: 13px;
}

.subtable-empty-title {
  color: #43516a;
  font-size: 14px;
  font-weight: 700;
}

.subtable-empty-text {
  color: #8995a8;
  font-size: 12px;
  line-height: 18px;
}

.subtable-empty-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.subtable-form-item {
  width: 100%;
  margin-bottom: 0 !important;
}

.subtable-form-item :deep(.el-form-item__label) {
  display: none;
}

.subtable-form-item :deep(.el-form-item__content) {
  min-height: 32px;
  line-height: 32px;
}

.subtable-form-item :deep(.el-form-item__error) {
  position: absolute;
  top: 31px;
  left: 0;
  padding-top: 0;
  font-size: 11px;
  line-height: 14px;
}

.subtable-form-item :deep(.el-input__wrapper),
.subtable-form-item :deep(.el-input-number .el-input__wrapper),
.subtable-form-item :deep(.el-select .el-input__wrapper),
.subtable-form-item :deep(.el-date-editor.el-input__wrapper) {
  min-height: 32px;
  height: 32px;
}

.subtable-form-item :deep(.el-textarea__inner) {
  min-height: 32px !important;
  height: 32px;
  padding-top: 5px;
  padding-bottom: 5px;
  resize: none;
}

.subtable-form-item :deep(.el-input-number) {
  width: 100%;
}

.subtable-delete-button {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .subtable-group-heading,
  .subtable-panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .subtable-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

:global(html[data-theme='dark']) .subtable-panel {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

:global(html[data-theme='dark']) .subtable-panel-header {
  background: var(--dt-surface-soft) !important;
  border-color: var(--dt-border) !important;
}

:global(html[data-theme='dark']) .subtable-group-title,
:global(html[data-theme='dark']) .subtable-title {
  color: var(--dt-text) !important;
}

:global(html[data-theme='dark']) .subtable-group-subtitle,
:global(html[data-theme='dark']) .subtable-meta,
:global(html[data-theme='dark']) .subtable-empty-text {
  color: var(--dt-text-muted) !important;
}
</style>
