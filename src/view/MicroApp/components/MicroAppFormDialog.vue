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
              <div class="rail-kicker">{{ dialogType === 'create' ? '新增记录' : '编辑记录' }}</div>
              <div class="rail-title">{{ appConfig?.configName || appConfig?.modelName || '微应用数据' }}</div>
              <div class="rail-progress">
                <span class="rail-progress__value">{{ completedRequiredFieldCount }}/{{ requiredFieldCount }}</span>
                <span class="rail-progress__label">必填完成</span>
              </div>
            </div>
            <div class="rail-card">
              <div class="rail-card-title">操作位置</div>
              <button
                class="rail-nav-item"
                :class="{ 'is-active': activeWorkSection === 'main' }"
                type="button"
                @click="scrollToMainFields"
              >
                <span>
                  <strong>基础信息</strong>
                  <em>{{ orderedFields.length }} 个字段</em>
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
                    {{ getSubTableRows(subTable).length }} 行
                    <template v-if="subTable.maxRows">/ {{ subTable.maxRows }}</template>
                  </em>
                </span>
                <b>{{ getSubTableRows(subTable).length }}</b>
              </button>
            </div>
          </aside>

          <main class="form-canvas">
            <section
              v-show="activeWorkSection === 'main'"
              ref="mainFieldsSection"
              class="form-section form-section--main"
            >
              <div class="form-section-head">
                <div>
                  <div class="section-kicker">主表</div>
                  <h3 class="form-section-title">基础信息</h3>
                </div>
                <span class="section-pill">{{ completedRequiredFieldCount }}/{{ requiredFieldCount }} 必填</span>
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
                    <div
                      v-else-if="field.fieldType === 'lookup'"
                      class="lookup-field"
                      :class="{ 'is-disabled': dialogType === 'edit' && !field.editable }"
                    >
                      <el-input
                        v-model="formData[field.fieldName]"
                        readonly
                        :placeholder="'请选择' + (field.label || field.fieldName)"
                        :disabled="dialogType === 'edit' && !field.editable"
                      ></el-input>
                      <button
                        class="lookup-field__button"
                        type="button"
                        :disabled="dialogType === 'edit' && !field.editable"
                        @click="openLookupDialog(field)"
                      >
                        <el-icon><Search /></el-icon>
                      </button>
                    </div>
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
            </section>

            <section
              v-if="orderedSubTables.length > 0"
              v-show="activeWorkSection === 'subtable'"
              ref="subtableSection"
              class="form-section subtable-form-sections"
            >
              <div class="subtable-group-heading">
                <div>
                  <div class="section-kicker">明细</div>
                  <div class="subtable-group-title">明细信息</div>
                  <div class="subtable-group-subtitle">维护当前记录的关联明细</div>
                </div>
                <span class="subtable-group-count">
                  {{ orderedSubTables.length }} 个子表 / {{ totalSubTableRows }} 行
                </span>
              </div>
              <el-tabs v-model="activeSubTableName" class="subtable-tabs" @tab-click="activeWorkSection = 'subtable'">
                <el-tab-pane v-for="subTable in orderedSubTables" :key="subTable.tableName" :name="subTable.tableName">
                  <template #label>
                    <span class="subtable-tab-label">
                      {{ subTable.label || subTable.tableName }}
                      <em>{{ getSubTableRows(subTable).length }}</em>
                    </span>
                  </template>
                  <section class="subtable-panel">
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
                          class="subtable-action-button"
                          size="small"
                          icon="Search"
                          :disabled="isSubTableMaxReached(subTable)"
                          @click="openSubTableLookupDialog(subTable)"
                        >
                          选择数据
                        </el-button>
                        <el-button
                          class="subtable-action-button subtable-action-button--primary"
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
                    <div v-if="getSubTableRows(subTable).length === 0" class="subtable-empty-state">
                      <div class="subtable-empty-title">暂无明细</div>
                      <div class="subtable-empty-text">可以新增空白行，也可以从配置的数据源带入</div>
                      <div class="subtable-empty-actions">
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
                          新增第一行
                        </el-button>
                      </div>
                    </div>
                    <div v-else class="subtable-editor-wrap">
                      <el-table
                        :data="getSubTableRows(subTable)"
                        border
                        stripe
                        class="subtable-editor"
                        :height="subTableEditorHeight"
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
                      </el-table>
                    </div>
                  </section>
                </el-tab-pane>
              </el-tabs>
            </section>
          </main>
        </div>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <span class="footer-status">
          必填 {{ completedRequiredFieldCount }}/{{ requiredFieldCount }}
          <template v-if="orderedSubTables.length > 0">，明细 {{ totalSubTableRows }} 行</template>
        </span>
        <span class="footer-actions">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
        </span>
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
import { Search } from '@element-plus/icons-vue'
import { getFileDownloadUrl, getFileUploadUrl, getUploadHeaders } from '@/api/file'
import { executeEsbDataSource } from '@/api/esb'
import { createMicroRuntimeData, updateMicroRuntimeData } from '@/api/microApp'

export default {
  name: 'MicroAppFormDialog',
  components: {
    Search
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
  flex: 0 0 auto;
  margin-right: 0;
  padding: 12px 24px 10px;
  border-bottom: 1px solid #e6ebf2;
}

:deep(.micro-app-form-dialog .el-dialog__title) {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  color: #172033;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

:deep(.micro-app-form-dialog .el-dialog__title::before) {
  width: 4px;
  height: 24px;
  margin-right: 12px;
  border-radius: 4px;
  background: #16a6a0;
  content: '';
}

:deep(.micro-app-form-dialog .el-dialog__headerbtn) {
  top: 12px;
  right: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f6fb;
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
  flex: 0 0 auto;
  padding: 10px 24px;
  border-top: 1px solid #e6ebf2;
  background: #f8fafc;
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
  color: #0f766e;
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

.form-section + .form-section {
  margin-top: 14px;
}

.form-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 4px;
}

.form-section-title {
  margin: 2px 0 0;
  color: #172033;
  font-size: 18px;
  font-weight: 800;
  line-height: 26px;
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
  padding: 10px 18px 8px;
}

.runtime-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.main-form-item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  margin-bottom: 12px !important;
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
  grid-template-columns: minmax(0, 1fr) 40px;
  align-items: center;
  overflow: hidden;
  line-height: 32px;
}

.lookup-field :deep(.el-input) {
  height: 32px;
  max-height: 32px;
  line-height: 32px;
}

.lookup-field :deep(.el-input__wrapper) {
  height: 32px !important;
  min-height: 32px !important;
  border-radius: 4px 0 0 4px !important;
}

.lookup-field :deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
}

.lookup-field__button {
  appearance: none;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 40px !important;
  min-width: 40px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  box-sizing: border-box;
  margin: 0;
  padding: 0 !important;
  border: 0;
  border-radius: 0 4px 4px 0 !important;
  background: #1677ff;
  color: #ffffff;
  cursor: pointer;
  line-height: 32px !important;
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

.lookup-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

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

  .main-form-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .main-form-item :deep(.el-form-item__label) {
    padding-top: 0 !important;
  }

  .form-section-head,
  .subtable-group-heading,
  .subtable-panel-header,
  .dialog-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .footer-actions,
  .footer-actions :deep(.el-button) {
    width: 100%;
  }

  .subtable-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
