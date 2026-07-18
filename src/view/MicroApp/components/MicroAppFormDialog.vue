<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog
    v-model="dialogVisible"
    class="micro-app-form-dialog"
    custom-class="micro-app-form-dialog"
    :title="title"
    :width="formDialogWidth"
    :top="'8vh'"
    :close-on-click-modal="false"
  >
    <div class="dialog-form-container">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="16">
          <el-col v-for="(field, index) in orderedFields" :key="index" :span="formFieldSpan">
            <el-form-item :label="field.label || field.fieldName" :prop="field.fieldName" :rules="getFieldRules(field)">
              <el-input
                v-if="field.fieldType === 'string'"
                v-model="formData[field.fieldName]"
                :placeholder="'请输入' + (field.label || field.fieldName)"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
              <el-input-number
                v-else-if="field.fieldType === 'number'"
                v-model="formData[field.fieldName]"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input-number>
              <el-date-picker
                v-else-if="field.fieldType === 'datetime'"
                v-model="formData[field.fieldName]"
                :type="getDatePickerType(field)"
                :value-format="getDateValueFormat(field)"
                :format="getDateDisplayFormat(field)"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-date-picker>
              <el-switch
                v-else-if="field.fieldType === 'boolean'"
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-switch>
              <el-input
                v-else-if="field.fieldType === 'textarea'"
                v-model="formData[field.fieldName]"
                type="textarea"
                :rows="4"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
              <el-select
                v-else-if="field.fieldType === 'select'"
                v-model="formData[field.fieldName]"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
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
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <el-radio v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
              <el-checkbox-group
                v-else-if="field.fieldType === 'checkbox'"
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <el-checkbox v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
              <el-input
                v-else-if="field.fieldType === 'lookup'"
                v-model="formData[field.fieldName]"
                readonly
                :placeholder="'请选择' + (field.label || field.fieldName)"
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <template #append>
                  <el-button
                    icon="Search"
                    :disabled="dialogType === 'edit' && !field.editable"
                    @click="openLookupDialog(field)"
                  ></el-button>
                </template>
              </el-input>
              <div v-else-if="field.fieldType === 'attachment'" class="attachment-field">
                <el-upload
                  class="attachment-upload"
                  :action="uploadActionUrl"
                  name="Files"
                  multiple
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :disabled="dialogType === 'edit' && !field.editable"
                  :on-success="(response, file) => handleAttachmentUploadSuccess(response, file, field)"
                  :on-error="handleAttachmentUploadError"
                >
                  <el-button
                    type="primary"
                    size="small"
                    icon="Upload"
                    :disabled="dialogType === 'edit' && !field.editable"
                  >
                    上传附件
                  </el-button>
                </el-upload>
                <div v-if="getAttachmentList(field).length > 0" class="attachment-list">
                  <div
                    v-for="(attachment, attachmentIndex) in getAttachmentList(field)"
                    :key="getAttachmentKey(attachment, attachmentIndex)"
                    class="attachment-item"
                  >
                    <span class="attachment-name" :title="getAttachmentName(attachment)">
                      {{ getAttachmentName(attachment) }}
                    </span>
                    <el-button
                      v-if="!(dialogType === 'edit' && !field.editable)"
                      class="attachment-remove-button"
                      text
                      type="danger"
                      size="small"
                      icon="Delete"
                      title="移除附件"
                      @click="removeAttachment(field, attachmentIndex)"
                    ></el-button>
                  </div>
                </div>
                <div v-else class="attachment-empty">暂无附件</div>
              </div>
              <el-input
                v-else
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <div v-if="orderedSubTables.length > 0" class="subtable-form-sections">
          <div class="subtable-group-heading">
            <span class="subtable-group-title">关联子表</span>
            <span class="subtable-group-count">{{ orderedSubTables.length }} 个子表</span>
          </div>
          <section v-for="subTable in orderedSubTables" :key="subTable.tableName" class="subtable-panel">
            <div class="subtable-panel-header">
              <div class="subtable-title-area">
                <span class="subtable-title-marker"></span>
                <div>
                  <div class="subtable-title">{{ subTable.label || subTable.tableName }}</div>
                  <div class="subtable-meta">
                    {{ getSubTableRows(subTable).length }} 行
                    <template v-if="subTable.maxRows">/ 最多 {{ subTable.maxRows }} 行</template>
                  </div>
                </div>
              </div>
              <div class="subtable-actions">
                <el-button
                  v-if="subTable.enableLookup"
                  size="small"
                  icon="Search"
                  :disabled="isSubTableMaxReached(subTable)"
                  @click="openSubTableLookupDialog(subTable)"
                >
                  选择数据
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  icon="Plus"
                  :disabled="isSubTableMaxReached(subTable)"
                  @click="addSubTableRow(subTable)"
                >
                  新增行
                </el-button>
              </div>
            </div>
            <div class="subtable-editor-wrap">
              <el-table :data="getSubTableRows(subTable)" border stripe class="subtable-editor" max-height="320">
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
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-input>
                      <el-input-number
                        v-else-if="field.fieldType === 'number'"
                        v-model="row[field.fieldName]"
                        style="width: 100%"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-input-number>
                      <el-date-picker
                        v-else-if="field.fieldType === 'datetime'"
                        v-model="row[field.fieldName]"
                        :type="getDatePickerType(field)"
                        :value-format="getDateValueFormat(field)"
                        :format="getDateDisplayFormat(field)"
                        style="width: 100%"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-date-picker>
                      <el-switch
                        v-else-if="field.fieldType === 'boolean'"
                        v-model="row[field.fieldName]"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-switch>
                      <el-input
                        v-else-if="field.fieldType === 'textarea'"
                        v-model="row[field.fieldName]"
                        type="textarea"
                        :rows="2"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-input>
                      <el-select
                        v-else-if="field.fieldType === 'select'"
                        v-model="row[field.fieldName]"
                        style="width: 100%"
                        :disabled="dialogType === 'edit' && !field.editable"
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
                        :disabled="dialogType === 'edit' && !field.editable"
                      >
                        <el-radio v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                          {{ opt.label }}
                        </el-radio>
                      </el-radio-group>
                      <el-checkbox-group
                        v-else-if="field.fieldType === 'checkbox'"
                        v-model="row[field.fieldName]"
                        :disabled="dialogType === 'edit' && !field.editable"
                      >
                        <el-checkbox v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                          {{ opt.label }}
                        </el-checkbox>
                      </el-checkbox-group>
                      <el-input
                        v-else
                        v-model="row[field.fieldName]"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-input>
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
                      @click="removeSubTableRow(subTable, $index)"
                    ></el-button>
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="subtable-empty">
                    <div class="subtable-empty-title">暂无明细</div>
                    <el-button
                      type="primary"
                      size="small"
                      icon="Plus"
                      :disabled="isSubTableMaxReached(subTable)"
                      @click="addSubTableRow(subTable)"
                    >
                      新增第一行
                    </el-button>
                  </div>
                </template>
              </el-table>
            </div>
          </section>
        </div>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog
    v-model="lookupDialogVisible"
    :title="lookupDialogTitle"
    width="760px"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-table
      v-loading="lookupLoading"
      :data="lookupRows"
      border
      stripe
      height="360"
      @selection-change="handleLookupSelectionChange"
      @row-dblclick="handleLookupRowDoubleClick"
    >
      <el-table-column v-if="lookupDialogMode === 'subTable'" type="selection" width="48"></el-table-column>
      <el-table-column
        v-for="column in activeLookupColumns"
        :key="column.field"
        :prop="column.field"
        :label="column.label"
        :width="column.width || undefined"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column v-if="lookupDialogMode === 'field'" label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="selectLookupRow(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="lookup-pagination">
      <el-pagination
        layout="total, prev, pager, next"
        :total="lookupTotal"
        :page-size="lookupQuery.pageSize"
        :current-page="lookupQuery.pageNum"
        @current-change="handleLookupPageChange"
      ></el-pagination>
    </div>
    <template v-if="lookupDialogMode === 'subTable'" #footer>
      <span class="dialog-footer">
        <el-button @click="lookupDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="lookupSelectedRows.length === 0" @click="confirmSubTableLookupRows">
          确定选择
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { getFileDownloadUrl, getFileUploadUrl, getUploadHeaders } from '@/api/file'
import { executeEsbDataSource } from '@/api/esb'
import { createMicroRuntimeData, updateMicroRuntimeData } from '@/api/microApp'

export default {
  name: 'MicroAppFormDialog',
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
    lookupDialogTitle() {
      if (this.lookupDialogMode === 'subTable') {
        return this.activeLookupSubTable
          ? `选择${this.activeLookupSubTable.label || this.activeLookupSubTable.tableName}`
          : '选择数据'
      }
      return this.activeLookupField
        ? `选择${this.activeLookupField.label || this.activeLookupField.fieldName}`
        : '开窗查询'
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
    }
  },
  methods: {
    normalizeFieldOrder(fields) {
      return Array.isArray(fields)
        ? [...fields]
            .map((field, index) => ({
              ...field,
              sortOrder:
                field.sortOrder !== undefined && field.sortOrder !== null && field.sortOrder !== ''
                  ? Number(field.sortOrder)
                  : index + 1
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : []
    },
    getFieldRules(field) {
      const rules = []
      if (field.fieldType === 'attachment') {
        if (field.required) {
          rules.push({
            validator: (rule, value, callback) => {
              if (this.normalizeAttachmentValue(value).length === 0) {
                callback(new Error(`${field.label || field.fieldName}不能为空`))
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
        rules.push({ required: true, message: `${field.label || field.fieldName}不能为空`, trigger: 'blur' })
      }
      if (field.minLength || field.maxLength) {
        rules.push({
          min: field.minLength || 0,
          max: field.maxLength || 99999,
          message: `长度${field.minLength || 0}-${field.maxLength || 99999}个字符`,
          trigger: 'blur'
        })
      }
      if (field.fieldType === 'number') {
        rules.push({
          validator: (rule, value, callback) => {
            if (value === null || value === undefined) return callback()
            if (isNaN(Number(value))) return callback(new Error('请输入数字'))
            if (field.minValue !== null && field.minValue !== undefined && Number(value) < Number(field.minValue))
              return callback(new Error(`不能小于${field.minValue}`))
            if (field.maxValue !== null && field.maxValue !== undefined && Number(value) > Number(field.maxValue))
              return callback(new Error(`不能大于${field.maxValue}`))
            callback()
          },
          trigger: 'blur'
        })
      }
      if (field.pattern) {
        try {
          rules.push({ pattern: new RegExp(field.pattern), message: '格式不正确', trigger: 'blur' })
        } catch (e) {}
      }
      return rules
    },
    normalizeAttachmentValue(value) {
      let normalized = value
      if (!normalized) return []
      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          return []
        }
      }
      if (!Array.isArray(normalized)) {
        return []
      }
      return normalized.filter((item) => item && typeof item === 'object')
    },
    getAttachmentList(field) {
      return this.normalizeAttachmentValue(this.formData[field.fieldName])
    },
    getAttachmentKey(attachment, index) {
      return attachment.FileID || attachment.fileId || attachment.FileId || attachment.id || index
    },
    getAttachmentFileId(attachment) {
      return attachment.FileID || attachment.fileId || attachment.FileId || attachment.id || ''
    },
    getAttachmentName(attachment) {
      return (
        attachment.FileName ||
        attachment.fileName ||
        attachment.name ||
        this.getAttachmentFileId(attachment) ||
        '未命名附件'
      )
    },
    normalizeUploadedAttachment(item, file) {
      return {
        FileID: item.FileID || item.fileId || item.FileId || '',
        FileName: item.FileName || item.fileName || file?.name || '未命名附件',
        Ext: item.Ext || item.ext || '',
        Size: item.Size || item.size || file?.size || 0
      }
    },
    handleAttachmentUploadSuccess(response, file, field) {
      if (!response?.success) {
        this.$message.error(response?.Msg || response?.message || '附件上传失败')
        return
      }

      const uploaded = Array.isArray(response.data) ? response.data : []
      const items = uploaded.map((item) => this.normalizeUploadedAttachment(item, file)).filter((item) => item.FileID)
      if (items.length === 0) {
        this.$message.error('附件上传失败：未返回文件编号')
        return
      }

      const current = this.getAttachmentList(field)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current.concat(items)
      this.$refs.formRef?.validateField(field.fieldName)
      this.$message.success('附件上传成功')
    },
    handleAttachmentUploadError() {
      this.$message.error('附件上传失败')
    },
    removeAttachment(field, index) {
      const current = this.getAttachmentList(field)
      current.splice(index, 1)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current
      this.$refs.formRef?.validateField(field.fieldName)
    },
    downloadAttachment(attachment) {
      const fileId = this.getAttachmentFileId(attachment)
      if (!fileId) {
        this.$message.warning('无法获取文件编号')
        return
      }
      window.location.href = getFileDownloadUrl(fileId)
    },
    parseLookupParams(value) {
      if (!value) return {}
      if (typeof value === 'object') return value
      try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
      } catch (error) {
        return {}
      }
    },
    normalizeLookupColumns(columns) {
      if (!Array.isArray(columns)) return []
      return columns
        .filter((column) => column && typeof column === 'object')
        .map((column) => ({
          field: column.field || column.Field || '',
          label: column.label || column.Label || '',
          width: column.width || column.Width || null
        }))
        .filter((column) => column.field && column.label)
    },
    normalizeLookupMappings(mappings) {
      if (!Array.isArray(mappings)) return []
      return mappings
        .filter((mapping) => mapping && typeof mapping === 'object')
        .map((mapping) => ({
          sourceField: mapping.sourceField || mapping.SourceField || '',
          targetField: mapping.targetField || mapping.TargetField || ''
        }))
        .filter((mapping) => mapping.sourceField && mapping.targetField)
    },
    getRowValue(row, fieldName) {
      if (!row || !fieldName) return undefined
      if (Object.prototype.hasOwnProperty.call(row, fieldName)) return row[fieldName]
      const matchedKey = Object.keys(row).find((key) => key.toLowerCase() === fieldName.toLowerCase())
      return matchedKey ? row[matchedKey] : undefined
    },
    getActiveLookupConfig() {
      return this.lookupDialogMode === 'subTable' ? this.activeLookupSubTable : this.activeLookupField
    },
    async openLookupDialog(field) {
      if (!field.lookupDataSourceCode) {
        this.$message.warning('请先配置开窗查询数据源')
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
        this.$message.warning('请先配置子表开窗查询数据源')
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
        this.$message.error(error.message || '查询失败')
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
        this.$message.warning('已达到子表最大行数')
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
        this.$message.warning(`已按最大行数限制新增 ${selectedRows.length} 行`)
      }
      this.lookupDialogVisible = false
      this.lookupSelectedRows = []
    },
    getDateFormatType(field) {
      return ['year', 'month', 'date', 'datetime'].includes(field?.dateFormat) ? field.dateFormat : 'datetime'
    },
    getDatePickerType(field) {
      const t = this.getDateFormatType(field)
      return t === 'datetime' ? 'datetime' : t
    },
    getDateValueFormat(field) {
      const map = { year: 'YYYY', month: 'YYYY-MM', date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:mm:ss' }
      return map[this.getDateFormatType(field)]
    },
    getDateDisplayFormat(field) {
      const map = { year: 'YYYY', month: 'YYYY-MM', date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:mm:ss' }
      return map[this.getDateFormatType(field)]
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
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
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
              this.$message.error('更新失败：无法获取数据ID')
              return
            }
            res = await updateMicroRuntimeData({ modelName: this.appConfig.modelName, id, data: submitData })
          }
          if (res.data.success) {
            this.$message.success(this.dialogType === 'create' ? '新增成功' : '更新成功')
            this.dialogVisible = false
            this.$emit('success')
          } else {
            this.$message.error(res.data.msg || '操作失败')
          }
        } catch (error) {
          this.$message.error(error.message || '网络错误')
        }
      })
    }
  }
}
</script>

<style scoped>
:deep(.micro-app-form-dialog) {
  display: flex;
  max-height: 84vh;
  flex-direction: column;
  margin-bottom: 0;
}

:deep(.micro-app-form-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

:deep(.micro-app-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  border-top: 1px solid #e7edf6;
}

.dialog-form-container {
  max-height: calc(84vh - 132px);
  overflow-y: auto;
  padding-right: 10px;
  padding-bottom: 16px;
}
.dialog-form-container::-webkit-scrollbar {
  width: 6px;
}
.dialog-form-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.dialog-form-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.lookup-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.subtable-form-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e7edf6;
}

.subtable-group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.subtable-group-title {
  color: #182235;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.subtable-group-count {
  color: #7b8798;
  font-size: 12px;
  line-height: 18px;
}

.subtable-panel {
  overflow: hidden;
  border: 1px solid #dce5f2;
  border-radius: 8px;
  background: #ffffff;
}

.subtable-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e7edf6;
  background: #f7faff;
}

.subtable-title-area {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.subtable-title-marker {
  width: 4px;
  height: 30px;
  flex: 0 0 4px;
  border-radius: 4px;
  background: #1683ff;
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
  color: #7b8798;
  font-size: 12px;
  line-height: 18px;
}

.subtable-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.subtable-editor-wrap {
  overflow-x: auto;
  padding: 12px;
  background: #ffffff;
}

.subtable-editor {
  width: 100%;
}

.subtable-editor :deep(.el-table__header th) {
  background: #f1f5fb;
  color: #26344d;
  font-weight: 700;
}

.subtable-editor :deep(.el-table__cell) {
  padding: 8px 0;
}

.subtable-empty {
  display: flex;
  min-height: 92px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: #8a98aa;
  font-size: 13px;
}

.subtable-empty-title {
  color: #7b8798;
  font-size: 13px;
}

.subtable-form-item {
  margin-bottom: 0;
}

.subtable-delete-button {
  width: 30px !important;
  height: 30px !important;
  padding: 0 !important;
}

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
</style>
