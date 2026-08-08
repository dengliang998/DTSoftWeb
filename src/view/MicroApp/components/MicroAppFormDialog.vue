<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog
    v-model="dialogVisible"
    class="micro-app-form-dialog"
    custom-class="micro-app-form-dialog"
    :title="title"
    :width="runtimeDialogWidth"
    :style="runtimeDialogStyle"
    :top="'5vh'"
    :close-on-click-modal="false"
  >
    <div class="dialog-form-container">
      <el-form ref="formRef" class="runtime-form" :model="formData" :rules="formRules" label-position="top">
        <div class="form-workspace">
          <aside class="form-rail">
            <div class="rail-card rail-card--summary">
              <div class="rail-kicker">
                {{ dialogType === 'create' ? $t('microRuntime.createRecord') : $t('microRuntime.editRecord') }}
              </div>
              <div class="rail-title">
                {{ appConfig?.configName || appConfig?.modelName || $t('microRuntime.appDataFallback') }}
              </div>
              <div class="rail-progress">
                <span class="rail-progress__value">{{ completedRequiredFieldCount }}/{{ requiredFieldCount }}</span>
                <span class="rail-progress__label">{{ $t('microRuntime.requiredComplete') }}</span>
              </div>
            </div>
            <div class="rail-card">
              <div class="rail-card-title">{{ $t('microRuntime.operationPosition') }}</div>
              <button
                class="rail-nav-item"
                :class="{ 'is-active': activeWorkSection === 'main' }"
                type="button"
                @click="scrollToMainFields"
              >
                <span>
                  <strong>{{ $t('microRuntime.baseInfo') }}</strong>
                  <em>{{ $t('microRuntime.fieldCount', { count: orderedFields.length }) }}</em>
                </span>
                <b>{{ completedRequiredFieldCount }}/{{ requiredFieldCount }}</b>
              </button>
              <button
                v-for="subTable in orderedSubTables"
                :key="subTable.tableName"
                class="rail-nav-item"
                :class="{ 'is-active': activeSubTableName === subTable.tableName && activeWorkSection === 'subtable' }"
                type="button"
                @click="switchSubTable(subTable)"
              >
                <span>
                  <strong>{{ subTable.label || subTable.tableName }}</strong>
                  <em>
                    {{ $t('microRuntime.rowCount', { count: getSubTableRows(subTable).length }) }}
                    <template v-if="subTable.maxRows">/ {{ subTable.maxRows }}</template>
                  </em>
                </span>
                <b>{{ getSubTableRows(subTable).length }}</b>
              </button>
            </div>
          </aside>

          <main class="form-canvas">
            <MicroAppMainFields
              v-show="activeWorkSection === 'main'"
              ref="mainFieldsSection"
              :form-data="formData"
              :ordered-fields="orderedFields"
              :form-field-span="formFieldSpan"
              :dialog-type="dialogType"
              :required-field-count="requiredFieldCount"
              :completed-required-field-count="completedRequiredFieldCount"
              :upload-action-url="uploadActionUrl"
              :upload-headers="uploadHeaders"
              :get-field-rules="getFieldRules"
              :get-attachment-list="getAttachmentList"
              @open-lookup="openLookupDialog"
              @attachment-upload-success="handleAttachmentUploadSuccess"
              @attachment-upload-error="handleAttachmentUploadError"
              @remove-attachment="removeAttachment"
            />

            <MicroAppSubTableEditor
              v-if="orderedSubTables.length > 0"
              v-show="activeWorkSection === 'subtable'"
              ref="subtableSection"
              v-model="activeSubTableName"
              :sub-tables="orderedSubTables"
              :total-sub-table-rows="totalSubTableRows"
              :editor-height="subTableEditorHeight"
              :dialog-type="dialogType"
              :get-rows="getSubTableRows"
              :is-max-reached="isSubTableMaxReached"
              :get-field-rules="getFieldRules"
              @activate="activeWorkSection = 'subtable'"
              @open-lookup="openSubTableLookupDialog"
              @add-row="addSubTableRow"
              @remove-row="removeSubTableRow"
            />
          </main>
        </div>
      </el-form>
    </div>
    <template #footer>
      <MicroAppFormFooter
        :completed-required-field-count="completedRequiredFieldCount"
        :required-field-count="requiredFieldCount"
        :sub-table-count="orderedSubTables.length"
        :total-sub-table-rows="totalSubTableRows"
        :submit-loading="submitLoading"
        @cancel="dialogVisible = false"
        @submit="submitForm"
      />
    </template>
  </el-dialog>

  <MicroAppLookupDialog
    v-model="lookupDialogVisible"
    :title="lookupDialogTitle"
    :loading="lookupLoading"
    :rows="lookupRows"
    :columns="activeLookupColumns"
    :mode="lookupDialogMode"
    :total="lookupTotal"
    :query="lookupQuery"
    :selected-count="lookupSelectedRows.length"
    @selection-change="handleLookupSelectionChange"
    @row-dblclick="handleLookupRowDoubleClick"
    @select-row="selectLookupRow"
    @page-change="handleLookupPageChange"
    @confirm="confirmSubTableLookupRows"
  />
</template>

<script>
import { getFileUploadUrl, getUploadHeaders } from '@/api/file'
import { executeEsbDataSource } from '@/api/esb'
import { createMicroRuntimeData, updateMicroRuntimeData } from '@/api/microApp'
import MicroAppFormFooter from './MicroAppFormFooter.vue'
import MicroAppLookupDialog from './MicroAppLookupDialog.vue'
import MicroAppMainFields from './MicroAppMainFields.vue'
import MicroAppSubTableEditor from './MicroAppSubTableEditor.vue'
import {
  getRowValue,
  normalizeAttachmentValue,
  normalizeFieldOrder,
  normalizeLookupColumns,
  normalizeLookupMappings,
  parseJsonObject
} from '../utils/microAppField'

export default {
  name: 'MicroAppFormDialog',
  components: {
    MicroAppFormFooter,
    MicroAppLookupDialog,
    MicroAppMainFields,
    MicroAppSubTableEditor
  },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    dialogType: { type: String, default: 'create' },
    formData: { type: Object, default: () => ({}) },
    formRules: { type: Object, default: () => ({}) },
    orderedFields: { type: Array, default: () => [] },
    appConfig: { type: Object, default: () => ({}) },
    formDialogWidth: { type: String, default: '50%' },
    formFieldSpan: { type: Number, default: 24 }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      uploadActionUrl: getFileUploadUrl(),
      uploadHeaders: getUploadHeaders(),
      lookupDialogVisible: false,
      lookupLoading: false,
      lookupDialogMode: 'field',
      activeLookupField: null,
      activeLookupSubTable: null,
      lookupSelectedRows: [],
      submitLoading: false,
      activeWorkSection: 'main',
      activeSubTableName: '',
      lookupRows: [],
      lookupTotal: 0,
      lookupQuery: {
        pageNum: 1,
        pageSize: 10
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    },
    runtimeDialogWidth() {
      return '80vw'
    },
    runtimeDialogStyle() {
      return {
        height: '90vh',
        maxHeight: '90vh'
      }
    },
    subTableEditorHeight() {
      return '100%'
    },
    lookupDialogTitle() {
      if (this.lookupDialogMode === 'subTable') {
        return this.activeLookupSubTable
          ? this.$t('microRuntime.selectPlaceholder', {
              label: this.activeLookupSubTable.label || this.activeLookupSubTable.tableName
            })
          : this.$t('microRuntime.selectData')
      }
      return this.activeLookupField
        ? this.$t('microRuntime.selectPlaceholder', {
            label: this.activeLookupField.label || this.activeLookupField.fieldName
          })
        : this.$t('microRuntime.lookupTitle')
    },
    activeLookupColumns() {
      const configured = this.normalizeLookupColumns(this.getActiveLookupConfig()?.lookupColumns)
      if (configured.length > 0) return configured

      const firstRow = this.lookupRows[0] || {}
      return Object.keys(firstRow).map((key) => ({ field: key, label: key, width: null }))
    },
    orderedSubTables() {
      const subTables = Array.isArray(this.appConfig?.subTables) ? this.appConfig.subTables : []
      return [...subTables].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },
    requiredFields() {
      return this.orderedFields.filter((field) => field?.fieldName && field.required)
    },
    requiredFieldCount() {
      return this.requiredFields.length
    },
    completedRequiredFieldCount() {
      return this.requiredFields.filter((field) => this.isFieldFilled(field)).length
    },
    totalSubTableRows() {
      return this.orderedSubTables.reduce((total, subTable) => total + this.getSubTableRows(subTable).length, 0)
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(visible) {
        if (visible) {
          this.activeWorkSection = 'main'
          this.ensureActiveSubTable()
        }
      }
    },
    orderedSubTables: {
      immediate: true,
      handler() {
        this.ensureActiveSubTable()
      }
    }
  },
  methods: {
    ensureActiveSubTable() {
      if (this.orderedSubTables.length === 0) {
        this.activeSubTableName = ''
        return
      }
      const exists = this.orderedSubTables.some((subTable) => subTable.tableName === this.activeSubTableName)
      if (!exists) {
        this.activeSubTableName = this.orderedSubTables[0].tableName
      }
    },
    isFieldFilled(field) {
      const value = this.formData[field.fieldName]
      if (field.fieldType === 'attachment') {
        return this.normalizeAttachmentValue(value).length > 0
      }
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== '' && value !== null && value !== undefined
    },
    scrollToMainFields() {
      this.activeWorkSection = 'main'
      this.$nextTick(() => {
        this.$refs.mainFieldsSection?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      })
    },
    switchSubTable(subTable) {
      this.activeWorkSection = 'subtable'
      this.activeSubTableName = subTable.tableName
      this.$nextTick(() => {
        this.$refs.subtableSection?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      })
    },
    normalizeFieldOrder(fields) {
      return normalizeFieldOrder(fields)
    },
    getFieldRules(field) {
      const rules = []
      if (field.fieldType === 'attachment') {
        if (field.required) {
          rules.push({
            validator: (rule, value, callback) => {
              if (this.normalizeAttachmentValue(value).length === 0) {
                callback(new Error(this.$t('microRuntime.requiredMessage', { label: field.label || field.fieldName })))
                return
              }
              callback()
            },
            trigger: 'change'
          })
        }
        return rules
      }
      if (field.required) {
        rules.push({
          required: true,
          message: this.$t('microRuntime.requiredMessage', { label: field.label || field.fieldName }),
          trigger: 'blur'
        })
      }
      if (field.minLength || field.maxLength) {
        rules.push({
          min: field.minLength || 0,
          max: field.maxLength || 99999,
          message: this.$t('microRuntime.lengthRange', {
            min: field.minLength || 0,
            max: field.maxLength || 99999
          }),
          trigger: 'blur'
        })
      }
      if (field.fieldType === 'number') {
        rules.push({
          validator: (rule, value, callback) => {
            if (value === null || value === undefined) return callback()
            if (isNaN(Number(value))) return callback(new Error(this.$t('microRuntime.inputNumber')))
            if (field.minValue !== null && field.minValue !== undefined && Number(value) < Number(field.minValue))
              return callback(new Error(this.$t('microRuntime.minMessage', { min: field.minValue })))
            if (field.maxValue !== null && field.maxValue !== undefined && Number(value) > Number(field.maxValue))
              return callback(new Error(this.$t('microRuntime.maxMessage', { max: field.maxValue })))
            callback()
          },
          trigger: 'blur'
        })
      }
      if (field.pattern) {
        try {
          rules.push({
            pattern: new RegExp(field.pattern),
            message: this.$t('microRuntime.invalidFormat'),
            trigger: 'blur'
          })
        } catch (e) {}
      }
      return rules
    },
    normalizeAttachmentValue(value) {
      return normalizeAttachmentValue(value)
    },
    getAttachmentList(field) {
      return this.normalizeAttachmentValue(this.formData[field.fieldName])
    },
    normalizeUploadedAttachment(item, file) {
      return {
        FileID: item.FileID || item.fileId || item.FileId || '',
        FileName: item.FileName || item.fileName || file?.name || this.$t('microRuntime.unnamedAttachment'),
        Ext: item.Ext || item.ext || '',
        Size: item.Size || item.size || file?.size || 0
      }
    },
    handleAttachmentUploadSuccess(response, file, field) {
      if (!response?.success) {
        this.$message.error(response?.Msg || response?.message || this.$t('microRuntime.uploadFailed'))
        return
      }

      const uploaded = Array.isArray(response.data) ? response.data : []
      const items = uploaded.map((item) => this.normalizeUploadedAttachment(item, file)).filter((item) => item.FileID)
      if (items.length === 0) {
        this.$message.error(this.$t('microRuntime.uploadMissingFileId'))
        return
      }

      const current = this.getAttachmentList(field)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current.concat(items)
      this.$refs.formRef?.validateField(field.fieldName)
      this.$message.success(this.$t('microRuntime.uploadSuccess'))
    },
    handleAttachmentUploadError() {
      this.$message.error(this.$t('microRuntime.uploadFailed'))
    },
    removeAttachment(field, index) {
      const current = this.getAttachmentList(field)
      current.splice(index, 1)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current
      this.$refs.formRef?.validateField(field.fieldName)
    },
    parseLookupParams(value) {
      return parseJsonObject(value)
    },
    normalizeLookupColumns(columns) {
      return normalizeLookupColumns(columns, { dropIncomplete: true })
    },
    normalizeLookupMappings(mappings) {
      return normalizeLookupMappings(mappings, { dropIncomplete: true })
    },
    getRowValue(row, fieldName) {
      return getRowValue(row, fieldName)
    },
    getActiveLookupConfig() {
      return this.lookupDialogMode === 'subTable' ? this.activeLookupSubTable : this.activeLookupField
    },
    async openLookupDialog(field) {
      if (!field.lookupDataSourceCode) {
        this.$message.warning(this.$t('microRuntime.configLookupFirst'))
        return
      }

      this.lookupDialogMode = 'field'
      this.activeLookupField = field
      this.activeLookupSubTable = null
      this.lookupSelectedRows = []
      this.lookupQuery = {
        pageNum: 1,
        pageSize: Number(field.lookupPageSize) || 10
      }
      this.lookupDialogVisible = true
      await this.loadLookupData()
    },
    async openSubTableLookupDialog(subTable) {
      if (!subTable.lookupDataSourceCode) {
        this.$message.warning(this.$t('microRuntime.configSubTableLookupFirst'))
        return
      }

      this.lookupDialogMode = 'subTable'
      this.activeLookupField = null
      this.activeLookupSubTable = subTable
      this.lookupSelectedRows = []
      this.lookupQuery = {
        pageNum: 1,
        pageSize: Number(subTable.lookupPageSize) || 10
      }
      this.lookupDialogVisible = true
      await this.loadLookupData()
    },
    async loadLookupData() {
      const lookupConfig = this.getActiveLookupConfig()
      if (!lookupConfig) return

      this.lookupLoading = true
      try {
        const { data: res } = await executeEsbDataSource({
          code: lookupConfig.lookupDataSourceCode,
          parameters: this.parseLookupParams(lookupConfig.lookupParams),
          pageNum: this.lookupQuery.pageNum,
          pageSize: this.lookupQuery.pageSize
        })
        this.applyLookupPayload(res?.data)
      } catch (error) {
        this.lookupRows = []
        this.lookupTotal = 0
        this.$message.error(error.message || this.$t('microRuntime.queryFailed'))
      } finally {
        this.lookupLoading = false
      }
    },
    applyLookupPayload(payload) {
      if (Array.isArray(payload)) {
        this.lookupRows = payload
        this.lookupTotal = payload.length
        return
      }

      const data = payload || {}
      this.lookupRows = Array.isArray(data.List || data.list) ? data.List || data.list : []
      this.lookupTotal = data.Total || data.total || this.lookupRows.length
    },
    handleLookupPageChange(page) {
      this.lookupQuery.pageNum = page
      this.loadLookupData()
    },
    handleLookupSelectionChange(rows) {
      this.lookupSelectedRows = rows || []
    },
    handleLookupRowDoubleClick(row) {
      if (this.lookupDialogMode === 'subTable') return
      this.selectLookupRow(row)
    },
    selectLookupRow(row) {
      if (!this.activeLookupField) return

      const valueField = this.activeLookupField.lookupValueField || 'Value'
      const currentValue = this.getRowValue(row, valueField)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[this.activeLookupField.fieldName] = currentValue ?? ''

      this.normalizeLookupMappings(this.activeLookupField.lookupMappings).forEach((mapping) => {
        const mappedValue = this.getRowValue(row, mapping.sourceField)
        // eslint-disable-next-line vue/no-mutating-props
        this.formData[mapping.targetField] = mappedValue ?? ''
        this.$refs.formRef?.validateField(mapping.targetField)
      })

      this.$refs.formRef?.validateField(this.activeLookupField.fieldName)
      this.lookupDialogVisible = false
    },
    confirmSubTableLookupRows() {
      if (!this.activeLookupSubTable || this.lookupSelectedRows.length === 0) return

      const rows = this.getSubTableRows(this.activeLookupSubTable)
      const maxRows = Number(this.activeLookupSubTable.maxRows) || 0
      const availableCount = maxRows > 0 ? Math.max(maxRows - rows.length, 0) : this.lookupSelectedRows.length
      if (availableCount <= 0) {
        this.$message.warning(this.$t('microRuntime.subTableMaxReached'))
        return
      }

      const selectedRows = this.lookupSelectedRows.slice(0, availableCount)
      const mappings = this.normalizeLookupMappings(this.activeLookupSubTable.lookupMappings)
      selectedRows.forEach((selectedRow) => {
        const newRow = this.createSubTableRow(this.activeLookupSubTable)
        mappings.forEach((mapping) => {
          newRow[mapping.targetField] = this.getRowValue(selectedRow, mapping.sourceField) ?? ''
        })
        rows.push(newRow)
      })

      if (selectedRows.length < this.lookupSelectedRows.length) {
        this.$message.warning(this.$t('microRuntime.maxLimitAdded', { count: selectedRows.length }))
      }
      this.lookupDialogVisible = false
      this.lookupSelectedRows = []
    },
    ensureSubTablesModel() {
      if (!this.formData.__subTables || typeof this.formData.__subTables !== 'object') {
        // eslint-disable-next-line vue/no-mutating-props
        this.formData.__subTables = {}
      }
      this.orderedSubTables.forEach((subTable) => {
        if (!Array.isArray(this.formData.__subTables[subTable.tableName])) {
          // eslint-disable-next-line vue/no-mutating-props
          this.formData.__subTables[subTable.tableName] = []
        }
      })
    },
    getSubTableRows(subTable) {
      this.ensureSubTablesModel()
      return this.formData.__subTables[subTable.tableName]
    },
    isSubTableMaxReached(subTable) {
      return subTable.maxRows && this.getSubTableRows(subTable).length >= Number(subTable.maxRows)
    },
    createSubTableRow(subTable) {
      const row = {}
      this.normalizeFieldOrder(subTable.fields).forEach((field) => {
        if (field.fieldType === 'checkbox') {
          row[field.fieldName] = []
        } else if (field.fieldType === 'number') {
          row[field.fieldName] = field.defaultValue ? Number(field.defaultValue) : null
        } else if (field.fieldType === 'boolean') {
          row[field.fieldName] = Boolean(field.defaultValue)
        } else {
          row[field.fieldName] = field.defaultValue || ''
        }
      })
      return row
    },
    addSubTableRow(subTable) {
      if (this.isSubTableMaxReached(subTable)) return
      this.getSubTableRows(subTable).push(this.createSubTableRow(subTable))
    },
    removeSubTableRow(subTable, index) {
      this.getSubTableRows(subTable).splice(index, 1)
    },
    buildSubTableSubmitData() {
      this.ensureSubTablesModel()
      const result = {}
      this.orderedSubTables.forEach((subTable) => {
        result[subTable.tableName] = this.getSubTableRows(subTable).map((row) => {
          const submitRow = { ...row }
          delete submitRow.ItemId
          delete submitRow.itemId
          delete submitRow.ParentId
          delete submitRow.parentId
          delete submitRow.row_no
          delete submitRow.created_time
          delete submitRow.updated_time
          delete submitRow.created_by
          delete submitRow.updated_by

          this.normalizeFieldOrder(subTable.fields).forEach((field) => {
            if (field.fieldType === 'checkbox' && Array.isArray(submitRow[field.fieldName])) {
              submitRow[field.fieldName] = submitRow[field.fieldName].join(',')
            } else if (field.fieldType === 'datetime') {
              submitRow[field.fieldName] = submitRow[field.fieldName] || ''
            } else if (field.fieldType === 'attachment') {
              submitRow[field.fieldName] = JSON.stringify(this.normalizeAttachmentValue(submitRow[field.fieldName]))
            }
          })
          return submitRow
        })
      })
      return result
    },
    submitForm() {
      if (this.submitLoading) return
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        this.submitLoading = true
        try {
          const submitData = { ...this.formData }
          delete submitData.ItemId
          delete submitData.itemId
          delete submitData.CreateTime
          delete submitData.UpdateTime
          delete submitData.createTime
          delete submitData.updateTime
          delete submitData.created_time
          delete submitData.updated_time

          let res
          this.orderedFields.forEach((field) => {
            if (field.fieldType === 'attachment') {
              submitData[field.fieldName] = JSON.stringify(this.normalizeAttachmentValue(submitData[field.fieldName]))
            }
          })
          submitData.__subTables = this.buildSubTableSubmitData()

          if (this.dialogType === 'create') {
            res = await createMicroRuntimeData({ modelName: this.appConfig.modelName, data: submitData })
          } else {
            const id = this.formData.ItemId || this.formData.itemId || this.formData.id || this.formData.Id
            if (!id) {
              this.$message.error(this.$t('microRuntime.updateMissingId'))
              return
            }
            res = await updateMicroRuntimeData({ modelName: this.appConfig.modelName, id, data: submitData })
          }
          if (res.data.success) {
            this.$message.success(
              this.dialogType === 'create'
                ? this.$t('microRuntime.createSuccess')
                : this.$t('microRuntime.updateSuccess')
            )
            this.dialogVisible = false
            this.$emit('success')
          } else {
            this.$message.error(res.data.msg || this.$t('microRuntime.operationFailed'))
          }
        } catch (error) {
          this.$message.error(error.message || this.$t('microRuntime.networkError'))
        } finally {
          this.submitLoading = false
        }
      })
    }
  }
}
</script>

<style scoped>
:deep(.micro-app-form-dialog) {
  display: flex;
  width: 80vw !important;
  max-width: none;
  height: 90vh !important;
  max-height: 90vh !important;
  flex-direction: column;
  margin-bottom: 0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 18px 56px rgba(21, 34, 57, 0.24);
}

:deep(.micro-app-form-dialog .el-dialog__header) {
  position: relative;
  flex: 0 0 auto;
  margin-right: 0;
  padding: 6px 16px 5px;
  border-bottom: 1px solid #e6ebf2;
  background: var(--dt-surface);
}

:deep(.micro-app-form-dialog .el-dialog__title) {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  color: #172033;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}

:deep(.micro-app-form-dialog .el-dialog__title::before) {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  border-radius: 4px;
  background: #16a6a0;
  content: '';
}

:deep(.micro-app-form-dialog .el-dialog__headerbtn) {
  top: 50%;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f3f6fb;
  transform: translateY(-50%);
}

:deep(.micro-app-form-dialog .el-dialog__headerbtn:hover) {
  background: #e8eef7;
}

:deep(.micro-app-form-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  padding: 0;
}

:deep(.micro-app-form-dialog .el-dialog__footer) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  padding: 0 16px;
  border-top: 1px solid #e6ebf2;
  background: var(--dt-surface);
}

.dialog-form-container {
  box-sizing: border-box;
  height: 100% !important;
  max-height: none !important;
  overflow: hidden;
  padding: 12px 16px 16px;
  background: #f5f7fb;
}
.dialog-form-container::-webkit-scrollbar {
  width: 6px;
}
.dialog-form-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.dialog-form-container::-webkit-scrollbar-thumb {
  background: #c4cfdd;
  border-radius: 3px;
}

.runtime-form {
  --el-component-size: 32px;
  --el-input-height: 32px;

  width: 100%;
  height: 100%;
  min-height: 0;
}

.form-workspace {
  display: grid;
  align-items: stretch;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 18px;
  height: 100%;
  min-height: 0;
}

.form-rail {
  display: flex;
  min-height: 0;
  overflow-y: auto;
  flex-direction: column;
  gap: 12px;
}

.rail-card {
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(26, 42, 68, 0.05);
}

.rail-card--summary {
  padding: 16px;
  border-color: #c9e8e3;
  background: linear-gradient(180deg, #f7fffd 0%, #ffffff 78%);
}

.rail-kicker,
.section-kicker {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.rail-title {
  margin-top: 4px;
  overflow: hidden;
  color: #172033;
  font-size: 18px;
  font-weight: 800;
  line-height: 26px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-progress {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #d9eee9;
}

.rail-progress__value {
  color: var(--dt-primary);
  font-size: 30px;
  font-weight: 800;
  line-height: 34px;
}

.rail-progress__label {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.rail-card-title {
  padding: 12px 14px 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  line-height: 20px;
}

.rail-nav-item {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 0;
  border-top: 1px solid #eef2f7;
  background: #ffffff;
  color: #26344d;
  cursor: pointer;
  text-align: left;
}

.rail-nav-item:hover,
.rail-nav-item:focus {
  background: #f6fafc;
  outline: none;
}

.rail-nav-item.is-active {
  background: #eefaf8;
  box-shadow: 3px 0 0 #16a6a0 inset;
}

.rail-nav-item span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.rail-nav-item strong,
.rail-nav-item em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-nav-item strong {
  color: #172033;
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
  line-height: 19px;
}

.rail-nav-item em {
  color: #78879a;
  font-size: 12px;
  font-style: normal;
  line-height: 18px;
}

.rail-nav-item b {
  min-width: 28px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #42526b;
  font-size: 12px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.rail-nav-item.is-active b {
  background: #16a6a0;
  color: #ffffff;
}

.form-canvas {
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.runtime-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.runtime-form :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 0 5px;
  color: #4c5566;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.runtime-form :deep(.el-input__wrapper),
.runtime-form :deep(.el-input-number .el-input__wrapper),
.runtime-form :deep(.el-select .el-input__wrapper),
.runtime-form :deep(.el-date-editor.el-input__wrapper) {
  height: 32px;
  min-height: 32px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #d7deea inset;
}

.runtime-form :deep(.el-textarea__inner) {
  min-height: 32px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #d7deea inset;
}

.runtime-form :deep(.el-input__inner) {
  height: 30px;
  line-height: 30px;
}

.runtime-form :deep(.el-input__wrapper:hover),
.runtime-form :deep(.el-textarea__inner:hover),
.runtime-form :deep(.el-input-number .el-input__wrapper:hover),
.runtime-form :deep(.el-select .el-input__wrapper:hover),
.runtime-form :deep(.el-date-editor.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #9fb0c8 inset;
}

.runtime-form :deep(.el-input__wrapper.is-focus),
.runtime-form :deep(.el-textarea__inner:focus),
.runtime-form :deep(.el-select .el-input__wrapper.is-focus),
.runtime-form :deep(.el-date-editor.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #1677ff inset,
    0 0 0 3px rgba(22, 119, 255, 0.12);
}

.runtime-form :deep(.el-input-group__append) {
  overflow: hidden;
  border-radius: 0 6px 6px 0;
  background: #1677ff;
  box-shadow: none;
}

.runtime-form :deep(.el-input-group__append .el-button) {
  min-width: 52px;
  border: 0;
  background: #1677ff;
  color: #ffffff;
}

.runtime-form :deep(.el-input-group__append .el-button:hover) {
  background: #0f67dc;
}

@media (max-width: 1100px) {
  .form-workspace {
    grid-template-columns: 1fr;
  }

  .form-rail {
    position: static;
  }

  .rail-card:not(.rail-card--summary) {
    display: none;
  }
}

@media (max-width: 900px) {
  :deep(.micro-app-form-dialog) {
    width: calc(100vw - 16px) !important;
  }

  :deep(.micro-app-form-dialog .el-dialog__header),
  :deep(.micro-app-form-dialog .el-dialog__footer) {
    padding-right: 16px;
    padding-left: 16px;
  }

  .dialog-form-container {
    padding: 12px;
  }
}

html[data-theme='dark'] :deep(.micro-app-form-dialog) {
  background: var(--dt-surface) !important;
  box-shadow: var(--dt-shadow) !important;
}

html[data-theme='dark'] .dialog-form-container,
html[data-theme='dark'] .rail-card {
  background: var(--dt-surface) !important;
  border-color: var(--dt-border) !important;
  box-shadow: var(--dt-shadow-soft);
}

html[data-theme='dark'] .rail-card__header {
  background: var(--dt-surface-soft) !important;
  border-color: var(--dt-border) !important;
}

html[data-theme='dark'] .rail-card__title {
  color: var(--dt-text) !important;
}

html[data-theme='dark'] .rail-card__desc,
html[data-theme='dark'] .form-section-desc {
  color: var(--dt-text-muted) !important;
}
</style>
