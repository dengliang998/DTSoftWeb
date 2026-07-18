<template>
  <div class="dynamic-app-container">
    <!-- 动态加载的微应用内容 -->
    <div v-if="!loading && appConfig" class="app-content">
      <!-- 列表页面 -->
      <div class="list-page">
        <el-card class="table-card">
          <!-- 搜索与添加区域 -->
          <div class="list-toolbar">
            <div class="toolbar-actions">
              <el-button v-if="appConfig.supportCreate" type="primary" icon="Plus" @click="openCreateDialog">
                新增
              </el-button>
              <el-button v-if="appConfig.supportExport" type="primary" icon="Download" @click="exportData">
                导出Excel
              </el-button>
              <el-button v-if="appConfig.supportImport" type="primary" icon="Upload" @click="openImportDialog">
                导入Excel
              </el-button>
              <el-button
                v-if="appConfig.supportDelete && appConfig.supportBatchDelete"
                type="danger"
                icon="Delete"
                :disabled="selectedRows.length === 0"
                @click="batchDeleteData"
              >
                批量删除
              </el-button>
            </div>
            <el-input
              v-model="searchKeyword"
              class="toolbar-search"
              clearable
              placeholder="请输入关键词搜索"
              @clear="getAppData"
            >
              <template #append>
                <el-button icon="Search" @click="getAppData"></el-button>
              </template>
            </el-input>
          </div>
          <div v-if="queryableFields.length > 0" class="advanced-query-row">
            <div v-for="(row, rowIndex) in queryFieldRows" :key="rowIndex" class="advanced-query-line">
              <div v-for="field in row" :key="field.fieldName" class="query-field">
                <span class="query-label">{{ field.label || field.fieldName }}</span>
                <template v-if="field.queryMode === 'range'">
                  <div class="range-query" :style="getQueryRangeStyle(field)">
                    <template v-if="field.fieldType === 'datetime' && getDateFormatType(field) === 'year'">
                      <el-date-picker
                        v-model="queryFilters[field.fieldName][0]"
                        type="year"
                        value-format="YYYY"
                        format="YYYY"
                        placeholder="开始"
                        style="width: 50%"
                      ></el-date-picker>
                      <el-date-picker
                        v-model="queryFilters[field.fieldName][1]"
                        type="year"
                        value-format="YYYY"
                        format="YYYY"
                        placeholder="结束"
                        style="width: 50%"
                      ></el-date-picker>
                    </template>
                    <el-date-picker
                      v-else-if="field.fieldType === 'datetime'"
                      v-model="queryFilters[field.fieldName]"
                      :type="getDateRangePickerType(field)"
                      :value-format="getDateValueFormat(field)"
                      :format="getDateDisplayFormat(field)"
                      range-separator="至"
                      start-placeholder="开始"
                      end-placeholder="结束"
                      style="width: 100%"
                    ></el-date-picker>
                    <template v-else>
                      <el-input v-model="queryFilters[field.fieldName].start" clearable placeholder="最小值"></el-input>
                      <el-input v-model="queryFilters[field.fieldName].end" clearable placeholder="最大值"></el-input>
                    </template>
                  </div>
                </template>
                <el-select
                  v-else-if="['select', 'radio', 'checkbox'].includes(field.fieldType)"
                  v-model="queryFilters[field.fieldName]"
                  class="query-control"
                  :style="getQueryControlStyle(field)"
                  clearable
                  :placeholder="'请选择' + (field.label || field.fieldName)"
                >
                  <el-option
                    v-for="option in field.options || []"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  ></el-option>
                </el-select>
                <el-date-picker
                  v-else-if="field.fieldType === 'datetime'"
                  v-model="queryFilters[field.fieldName]"
                  class="query-control"
                  :style="getQueryControlStyle(field)"
                  :type="getDatePickerType(field)"
                  :value-format="getDateValueFormat(field)"
                  :format="getDateDisplayFormat(field)"
                  clearable
                  :placeholder="'请选择' + (field.label || field.fieldName)"
                ></el-date-picker>
                <el-input
                  v-else
                  v-model="queryFilters[field.fieldName]"
                  class="query-control"
                  :style="getQueryControlStyle(field)"
                  clearable
                  :placeholder="field.queryMode === 'exact' ? '精确查询' : '模糊查询'"
                ></el-input>
              </div>
              <div v-if="rowIndex === queryFieldRows.length - 1" class="query-actions">
                <el-button type="primary" icon="Search" @click="applyQueryFilters">查询</el-button>
                <el-button icon="RefreshLeft" @click="resetQueryFilters">重置</el-button>
              </div>
            </div>
          </div>

          <!-- 数据列表 -->
          <div class="table-container">
            <el-table
              :data="appData.list"
              :row-style="{ height: '40px' }"
              :cell-style="{ padding: '0px' }"
              border
              stripe
              class="table-wrapper"
              height="100%"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column
                v-if="appConfig.supportDelete && appConfig.supportBatchDelete"
                type="selection"
                width="50"
                fixed="left"
              ></el-table-column>
              <!-- 序号列 -->
              <el-table-column type="index" label="序号" width="80" fixed="left"></el-table-column>
              <!-- 渲染所有有效的字段 -->
              <template v-for="field in orderedFields" :key="field.fieldName">
                <el-table-column
                  v-if="field?.showInList && field?.fieldName"
                  :prop="field.fieldName"
                  :label="field.label || field.fieldName || '未知字段'"
                  :width="field.columnWidth || undefined"
                  :fixed="normalizeFixedColumn(field.fixed)"
                  :sortable="field.sortable ? 'custom' : false"
                >
                  <template #default="scope">
                    <div v-if="field.fieldType === 'attachment'" class="attachment-cell">
                      <template v-if="getAttachmentList(scope.row[field.fieldName]).length > 0">
                        <div
                          v-for="(attachment, attachmentIndex) in getAttachmentList(scope.row[field.fieldName])"
                          :key="getAttachmentKey(attachment, attachmentIndex)"
                          class="attachment-cell-item"
                        >
                          <span class="attachment-type-badge">{{ getAttachmentExtLabel(attachment) }}</span>
                          <button
                            class="attachment-download-link"
                            type="button"
                            :title="getAttachmentName(attachment)"
                            @click="downloadAttachment(attachment)"
                          >
                            {{ getAttachmentName(attachment) }}
                          </button>
                          <button
                            v-if="isPreviewableAttachment(attachment)"
                            class="attachment-preview-link"
                            type="button"
                            @click="previewAttachment(attachment)"
                          >
                            预览
                          </button>
                        </div>
                      </template>
                      <span v-else class="attachment-empty-cell">-</span>
                    </div>
                    <template v-else>
                      {{ formatFieldValue(scope.row[field.fieldName], field) }}
                    </template>
                  </template>
                </el-table-column>
              </template>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <div class="operation-buttons">
                    <el-button
                      v-if="appConfig.supportUpdate"
                      type="primary"
                      size="small"
                      icon="Edit"
                      @click="openEditDialog(scope.row)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="appConfig.supportDelete"
                      type="danger"
                      size="small"
                      icon="Delete"
                      @click="deleteData(scope.row)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="appData.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.currentPage"
            style="margin-top: 15px"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </el-card>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container" element-loading-text="加载微应用配置中..."></div>
    <!-- 微应用配置未找到 -->
    <div v-else-if="!loading && !appConfig" class="loading-container">
      <div style="text-align: center; color: #909399">
        <el-icon size="48" style="margin-bottom: 10px"><WarningFilled /></el-icon>
        <div>微应用配置未找到</div>
      </div>
    </div>

    <!-- 新增/编辑数据对话框 -->
    <MicroAppFormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :dialog-type="dialogType"
      :form-data="formData"
      :form-rules="formRules"
      :ordered-fields="orderedFields"
      :app-config="appConfig"
      :form-dialog-width="getFormDialogWidth()"
      :form-field-span="getFormFieldSpan()"
      @success="onFormDialogSuccess"
    />

    <!-- 导入对话框 -->
    <MicroAppImportDialog v-model="importDialogVisible" :app-config="appConfig" @success="onImportDialogSuccess" />
    <VideoPreviewDialog v-model="attachmentVideoPreviewVisible" :video-url="attachmentVideoUrl" />
    <el-image-viewer
      v-if="attachmentImagePreviewVisible"
      :url-list="attachmentImageUrlList"
      @close="attachmentImagePreviewVisible = false"
    ></el-image-viewer>
  </div>
</template>

<script>
import { ElImageViewer } from 'element-plus'
import { getFileDownloadUrl } from '@/api/file'
import { getDictionaryItemsByCode } from '@/api/dictionary'
import { executeEsbDataSource } from '@/api/esb'
import {
  batchDeleteMicroRuntimeData,
  createMicroRuntimeData,
  deleteMicroRuntimeData,
  exportMicroRuntimeData,
  getMicroAppConfigs,
  getMicroRuntimeList,
  updateMicroRuntimeData
} from '@/api/microApp'
import MicroAppFormDialog from './components/MicroAppFormDialog.vue'
import MicroAppImportDialog from './components/MicroAppImportDialog.vue'
import VideoPreviewDialog from '../attachment/components/VideoPreviewDialog.vue'
export default {
  name: 'MicroAppPage',
  components: {
    ElImageViewer,
    MicroAppFormDialog,
    MicroAppImportDialog,
    VideoPreviewDialog
  },
  data() {
    return {
      // 微应用配置
      appConfig: null,
      // 加载状态
      loading: false,
      // 当前激活的菜单
      activeMenu: 'list',
      // 搜索关键词
      searchKeyword: '',
      // 分页配置
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      // 应用数据
      appData: {
        list: [],
        total: 0
      },
      selectedRows: [],
      queryFilters: {},
      sortInfo: {
        prop: '',
        order: ''
      },
      // 表单数据
      formData: {},
      // 表单验证规则
      formRules: {},
      // 对话框显示状态
      dialogVisible: false,
      // 对话框标题
      dialogTitle: '',
      // 对话框类型：create/edit
      dialogType: '',
      // 导入对话框
      importDialogVisible: false,
      // 导入文件列表
      importFileList: [],
      // 导入加载状态
      importLoading: false,
      attachmentImagePreviewVisible: false,
      attachmentImageUrlList: [],
      attachmentVideoPreviewVisible: false,
      attachmentVideoUrl: ''
    }
  },
  computed: {
    orderedFields() {
      const fields = Array.isArray(this.appConfig?.fields) ? this.appConfig.fields : []
      return this.normalizeFieldOrder(fields)
    },
    queryableFields() {
      return this.orderedFields.filter((field) => field?.fieldName && field.queryMode && field.queryMode !== 'none')
    },
    queryFieldRows() {
      const columns = this.normalizeQueryColumns(this.appConfig?.queryColumns)
      const rows = []

      for (let index = 0; index < this.queryableFields.length; index += columns) {
        rows.push(this.queryableFields.slice(index, index + columns))
      }

      return rows
    }
  },
  watch: {
    // 监听路由变化，重新初始化应用
    $route: {
      handler: function (to) {
        // 只有当路由是微应用路由时才重新初始化
        if (to.path.startsWith('/app/')) {
          this.initApp()
        }
      },
      immediate: true
    }
  },
  created() {
    // 初始化应用
    this.initApp()
  },
  methods: {
    getRowPrimaryKey(row) {
      return row?.ItemId || row?.itemId || row?.id || row?.Id || row?.ID || row?.idField
    },
    normalizeFieldOptions(options) {
      let normalized = options

      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          normalized = []
        }
      }

      if (!Array.isArray(normalized)) {
        return []
      }

      return normalized
        .filter((option) => option && typeof option === 'object')
        .map((option) => ({
          label: option.Label || option.label || '',
          value: option.Value || option.value || ''
        }))
    },
    async loadDictionaryOptionsForFields(fields) {
      const dictionaryFields = (fields || []).filter((field) => field?.optionSource === 'dictionary' && field?.dictCode)
      if (dictionaryFields.length === 0) return

      const dictCodes = [...new Set(dictionaryFields.map((field) => field.dictCode))]
      const optionMap = {}
      await Promise.all(
        dictCodes.map(async (dictCode) => {
          try {
            const { data: res } = await getDictionaryItemsByCode(dictCode)
            optionMap[dictCode] = res?.success ? this.normalizeFieldOptions(res.data || []) : []
          } catch (error) {
            optionMap[dictCode] = []
          }
        })
      )

      dictionaryFields.forEach((field) => {
        field.options = optionMap[field.dictCode] || []
      })
    },
    parseEsbParams(value) {
      if (!value) return {}
      if (typeof value === 'object') return value
      try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
      } catch (error) {
        return {}
      }
    },
    async loadEsbOptionsForFields(fields) {
      const esbFields = (fields || []).filter((field) => field?.optionSource === 'esb' && field?.esbDataSourceCode)
      if (esbFields.length === 0) return

      await Promise.all(
        esbFields.map(async (field) => {
          try {
            const { data: res } = await executeEsbDataSource({
              code: field.esbDataSourceCode,
              parameters: this.parseEsbParams(field.esbParams)
            })
            const rows = res?.success && Array.isArray(res.data) ? res.data : []
            const labelField = field.esbLabelField || 'label'
            const valueField = field.esbValueField || 'value'
            field.options = rows.map((row) => ({
              label: row[labelField] ?? row.Label ?? row.label ?? '',
              value: row[valueField] ?? row.Value ?? row.value ?? ''
            }))
          } catch (error) {
            field.options = []
          }
        })
      )
    },
    normalizeFormColumns(formColumns) {
      const value = Number(formColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
    },
    normalizeQueryColumns(queryColumns) {
      const value = Number(queryColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
    },
    getFormFieldSpan() {
      return 24 / this.normalizeFormColumns(this.appConfig?.formColumns)
    },
    getFormDialogWidth() {
      const widthMap = {
        1: '50%',
        2: '65%',
        3: '80%',
        4: '90%'
      }
      return widthMap[this.normalizeFormColumns(this.appConfig?.formColumns)]
    },
    normalizeQueryWidth(queryWidth) {
      const value = Number(queryWidth)
      return Number.isInteger(value) && value >= 100 && value <= 600 ? value : 150
    },
    normalizeNumberFormValue(value) {
      if (value === '' || value === null || value === undefined) {
        return null
      }

      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : null
    },
    getQueryControlStyle(field) {
      const width = this.normalizeQueryWidth(field?.queryWidth)
      return {
        width: `${width}px`,
        flex: `0 1 ${width}px`,
        maxWidth: 'calc(100% - 60px)'
      }
    },
    getQueryRangeStyle(field) {
      const width = Math.max(this.normalizeQueryWidth(field?.queryWidth), 220)
      return {
        width: `${width}px`,
        flex: `0 1 ${width}px`,
        maxWidth: 'calc(100% - 60px)'
      }
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
    // 初始化微应用
    async initApp() {
      this.loading = true
      try {
        // 获取微应用路径
        const appPath = this.$route.params.appPath

        // 优先按微应用路径加载，兼容旧数据时回退到模型名称
        const { data: res } = await getMicroAppConfigs({
          PageNum: 1,
          PageSize: 1,
          microAppPath: appPath
        })
        if (res.success) {
          let config = res.data && res.data.length > 0 ? res.data[0] : null

          if (!config) {
            const fallbackRes = await getMicroAppConfigs({
              PageNum: 1,
              PageSize: 1,
              modelName: appPath
            })
            if (fallbackRes.data.success) {
              config = fallbackRes.data.data && fallbackRes.data.data.length > 0 ? fallbackRes.data.data[0] : null
            }
          }

          if (config) {
            // 将大驼峰命名转换为小驼峰命名，并过滤fields中的undefined值
            this.appConfig = {
              configName: config.ConfigName || config.configName || '',
              modelName: config.ModelName || config.modelName || '',
              microAppPath: config.MicroAppPath || config.ApiPrefix || config.ModelName || config.modelName || '',
              configDesc: config.ConfigDesc || config.configDesc || '',
              status: config.Status !== undefined ? config.Status : config.status !== undefined ? config.status : 1,
              supportCreate:
                config.SupportCreate !== undefined
                  ? config.SupportCreate
                  : config.supportCreate !== undefined
                    ? config.supportCreate
                    : true,
              supportUpdate:
                config.SupportUpdate !== undefined
                  ? config.SupportUpdate
                  : config.supportUpdate !== undefined
                    ? config.supportUpdate
                    : true,
              supportDelete:
                config.SupportDelete !== undefined
                  ? config.SupportDelete
                  : config.supportDelete !== undefined
                    ? config.supportDelete
                    : true,
              supportBatchDelete:
                config.SupportBatchDelete !== undefined
                  ? config.SupportBatchDelete
                  : config.supportBatchDelete !== undefined
                    ? config.supportBatchDelete
                    : false,
              supportImport:
                config.SupportImport !== undefined
                  ? config.SupportImport
                  : config.supportImport !== undefined
                    ? config.supportImport
                    : false,
              supportExport:
                config.SupportExport !== undefined
                  ? config.SupportExport
                  : config.supportExport !== undefined
                    ? config.supportExport
                    : false,
              dataScope: config.DataScope || config.dataScope || 'all',
              formColumns: this.normalizeFormColumns(config.FormColumns || config.formColumns),
              queryColumns: this.normalizeQueryColumns(config.QueryColumns || config.queryColumns),
              fields: Array.isArray(config.Fields)
                ? this.normalizeFieldOrder(
                    config.Fields.filter((field) => field && typeof field === 'object').map((field, index) => ({
                      label: field.Label || field.label || '',
                      fieldName: field.FieldName || field.fieldName || '',
                      fieldType: field.FieldType || field.fieldType || 'string',
                      sortOrder:
                        field.SortOrder !== undefined && field.SortOrder !== null
                          ? field.SortOrder
                          : field.sortOrder !== undefined && field.sortOrder !== null
                            ? field.sortOrder
                            : index + 1,
                      required:
                        field.Required !== undefined
                          ? field.Required
                          : field.required !== undefined
                            ? field.required
                            : false,
                      showInList:
                        field.ShowInList !== undefined
                          ? field.ShowInList
                          : field.showInList !== undefined
                            ? field.showInList
                            : true,
                      editable:
                        field.Editable !== undefined
                          ? field.Editable
                          : field.editable !== undefined
                            ? field.editable
                            : true,
                      validation: field.Validation || field.validation || '',
                      columnWidth: field.ColumnWidth || field.columnWidth || null,
                      sortable:
                        field.Sortable !== undefined
                          ? field.Sortable
                          : field.sortable !== undefined
                            ? field.sortable
                            : false,
                      fixed: field.Fixed || field.fixed || 'none',
                      queryMode: field.QueryMode || field.queryMode || 'none',
                      queryWidth:
                        field.QueryWidth !== undefined && field.QueryWidth !== null
                          ? field.QueryWidth
                          : field.queryWidth !== undefined && field.queryWidth !== null
                            ? field.queryWidth
                            : 150,
                      dateFormat: field.DateFormat || field.dateFormat || 'datetime',
                      minLength: field.MinLength !== undefined ? field.MinLength : field.minLength || null,
                      maxLength: field.MaxLength !== undefined ? field.MaxLength : field.maxLength || null,
                      minValue: field.MinValue !== undefined ? field.MinValue : field.minValue || null,
                      maxValue: field.MaxValue !== undefined ? field.MaxValue : field.maxValue || null,
                      pattern: field.Pattern || field.pattern || '',
                      defaultValue: field.DefaultValue || field.defaultValue || '',
                      optionSource: field.OptionSource || field.optionSource || 'manual',
                      dictCode: field.DictCode || field.dictCode || '',
                      esbDataSourceCode: field.EsbDataSourceCode || field.esbDataSourceCode || '',
                      esbLabelField: field.EsbLabelField || field.esbLabelField || '',
                      esbValueField: field.EsbValueField || field.esbValueField || '',
                      esbParams: field.EsbParams || field.esbParams || '',
                      options: this.normalizeFieldOptions(field.Options || field.options || [])
                    }))
                  )
                : []
            }

            await this.loadDictionaryOptionsForFields(this.appConfig.fields)
            await this.loadEsbOptionsForFields(this.appConfig.fields)

            // 初始化表单数据
            this.initFormData()
            this.initQueryFilters()

            // 获取应用数据
            this.getAppData()
          } else {
            this.$message.error('未找到对应的微应用配置')
          }
        } else {
          this.$message.error('加载微应用配置失败：' + (res.msg || '未知错误'))
        }
      } catch (error) {
        this.$message.error('加载微应用配置失败：' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },

    // 初始化表单数据
    initFormData() {
      this.formData = {}
      // 为每个字段设置默认值，确保fields是数组
      const fields = this.orderedFields
      fields.forEach((field) => {
        // 多选字段默认值应为数组
        if (field.fieldType === 'checkbox') {
          this.formData[field.fieldName] = field.defaultValue
            ? Array.isArray(field.defaultValue)
              ? field.defaultValue
              : []
            : []
        } else if (field.fieldType === 'attachment') {
          this.formData[field.fieldName] = this.normalizeAttachmentValue(field.defaultValue)
        } else if (field.fieldType === 'number') {
          this.formData[field.fieldName] = this.normalizeNumberFormValue(field.defaultValue)
        } else {
          this.formData[field.fieldName] = field.defaultValue || ''
        }
      })
    },

    initQueryFilters() {
      const filters = {}
      this.queryableFields.forEach((field) => {
        if (field.queryMode === 'range') {
          filters[field.fieldName] = field.fieldType === 'datetime' ? [] : { start: '', end: '' }
        } else {
          filters[field.fieldName] = ''
        }
      })
      this.queryFilters = filters
    },

    // 获取字段验证规则
    getFieldRules(field) {
      const rules = []
      // 必填验证
      if (field.required) {
        rules.push({ required: true, message: '请输入' + field.label, trigger: 'blur' })
      }
      if (field.minLength !== null && field.minLength !== undefined) {
        rules.push({ min: field.minLength, message: `${field.label}不能少于${field.minLength}个字符`, trigger: 'blur' })
      }
      if (field.maxLength !== null && field.maxLength !== undefined) {
        rules.push({ max: field.maxLength, message: `${field.label}不能超过${field.maxLength}个字符`, trigger: 'blur' })
      }
      if (field.fieldType === 'number' && (field.minValue !== null || field.maxValue !== null)) {
        rules.push({
          validator: (rule, value, callback) => {
            if (value === null || value === undefined || value === '') {
              callback()
              return
            }
            if (field.minValue !== null && field.minValue !== undefined && Number(value) < Number(field.minValue)) {
              callback(new Error(`${field.label}不能小于${field.minValue}`))
              return
            }
            if (field.maxValue !== null && field.maxValue !== undefined && Number(value) > Number(field.maxValue)) {
              callback(new Error(`${field.label}不能大于${field.maxValue}`))
              return
            }
            callback()
          },
          trigger: 'blur'
        })
      }
      if (field.pattern) {
        try {
          rules.push({
            pattern: new RegExp(field.pattern),
            message: `${field.label}格式不正确`,
            trigger: 'blur'
          })
        } catch (error) {
          console.error('字段正则校验解析失败：', error)
        }
      }
      // 自定义验证规则
      if (field.validation) {
        try {
          const validation = JSON.parse(field.validation)
          if (validation && Array.isArray(validation)) {
            rules.push(...validation)
          }
        } catch (e) {
          console.error('字段验证规则解析失败：', e)
        }
      }
      return rules
    },

    buildRuntimeQueryParams() {
      const params = {
        PageNum: this.pagination.currentPage,
        PageSize: this.pagination.pageSize,
        Keyword: this.searchKeyword
      }

      const filters = this.buildQueryFilters()
      if (filters.length > 0) {
        params.Filters = JSON.stringify(filters)
      }
      if (this.sortInfo.prop) {
        params.SortField = this.sortInfo.prop
        params.SortOrder = this.sortInfo.order
      }

      return params
    },

    buildQueryFilters() {
      return this.queryableFields
        .map((field) => {
          const value = this.queryFilters[field.fieldName]
          if (field.queryMode === 'range') {
            if (field.fieldType === 'datetime' && Array.isArray(value)) {
              return {
                FieldName: field.fieldName,
                Mode: 'range',
                StartValue: this.normalizeDateValueForSubmit(value[0], field, 'start'),
                EndValue: this.normalizeDateValueForSubmit(value[1], field, 'end')
              }
            }
            return {
              FieldName: field.fieldName,
              Mode: 'range',
              StartValue: value?.start || '',
              EndValue: value?.end || ''
            }
          }

          return {
            FieldName: field.fieldName,
            Mode: field.queryMode,
            Value: field.fieldType === 'datetime' ? this.normalizeDateValueForSubmit(value, field) : value
          }
        })
        .filter((filter) => {
          if (filter.Mode === 'range') {
            return Boolean(filter.StartValue || filter.EndValue)
          }
          return filter.Value !== null && filter.Value !== undefined && filter.Value !== ''
        })
    },

    // 获取应用数据
    async getAppData() {
      try {
        const params = this.buildRuntimeQueryParams()

        // 调用应用对应的API获取数据
        const { data: res } = await getMicroRuntimeList({
          modelName: this.appConfig.modelName,
          params
        })
        if (res.success) {
          this.appData = res.data || { list: [], total: 0 }
        } else {
          this.$message.error('获取数据失败：' + (res.msg || '未知错误'))
        }
      } catch (error) {
        this.$message.error('获取数据失败：' + (error.message || '网络错误'))
      }
    },

    // 打开新增对话框
    openCreateDialog() {
      this.dialogType = 'create'
      this.dialogTitle = '新增' + this.appConfig.configName
      this.initFormData()
      this.dialogVisible = true
    },
    // 打开编辑对话框
    openEditDialog(row) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑' + this.appConfig.configName
      this.formData = { ...row }

      // 确保多选字段的值是数组类型
      const fields = this.orderedFields
      fields.forEach((field) => {
        if (field.fieldType === 'checkbox') {
          const fieldValue = this.formData[field.fieldName]
          if (fieldValue !== undefined && fieldValue !== null) {
            // 如果是字符串类型，尝试按逗号分隔转换为数组
            if (typeof fieldValue === 'string') {
              this.formData[field.fieldName] = fieldValue.split(',').map((item) => item.trim())
            } else if (!Array.isArray(fieldValue)) {
              // 如果不是数组，转换为数组
              this.formData[field.fieldName] = [fieldValue]
            }
          } else {
            // 如果值为空，设置为空数组
            this.formData[field.fieldName] = []
          }
        } else if (field.fieldType === 'attachment') {
          this.formData[field.fieldName] = this.normalizeAttachmentValue(this.formData[field.fieldName])
        } else if (field.fieldType === 'number') {
          this.formData[field.fieldName] = this.normalizeNumberFormValue(this.formData[field.fieldName])
        }
      })

      this.dialogVisible = true
    },

    // 删除数据
    deleteData(row) {
      this.$confirm('确定要删除这条数据吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const id = this.getRowPrimaryKey(row)
            if (!id) {
              this.$message.error('删除失败：无法获取数据ID')
              return
            }

            const { data: res } = await deleteMicroRuntimeData({
              modelName: this.appConfig.modelName,
              id
            })
            if (res.success) {
              this.$message.success(res.msg || '删除成功')
              this.getAppData()
            } else {
              this.$message.error('删除失败：' + (res.msg || '未知错误'))
            }
          } catch (error) {
            this.$message.error('删除失败：' + (error.message || '网络错误'))
          }
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },

    batchDeleteData() {
      const ids = this.selectedRows.map((row) => this.getRowPrimaryKey(row)).filter(Boolean)
      if (ids.length === 0) {
        this.$message.warning('请选择要删除的数据')
        return
      }

      this.$confirm(`确定要删除选中的 ${ids.length} 条数据吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const { data: res } = await batchDeleteMicroRuntimeData({
              modelName: this.appConfig.modelName,
              ids
            })
            if (res.success) {
              this.$message.success(res.msg || '批量删除成功')
              this.selectedRows = []
              this.getAppData()
            } else {
              this.$message.error('批量删除失败：' + (res.msg || '未知错误'))
            }
          } catch (error) {
            this.$message.error('批量删除失败：' + (error.message || '网络错误'))
          }
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },

    // 提交表单
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        try {
          // 移除不需要的字段
          const submitData = { ...this.formData }
          delete submitData.ItemId
          delete submitData.itemId
          delete submitData.CreateTime
          delete submitData.UpdateTime
          delete submitData.createTime
          delete submitData.updateTime
          delete submitData.created_time
          delete submitData.updated_time
          delete submitData.created_by
          delete submitData.updated_by

          // 处理多选字段，将数组转换为逗号分隔的字符串
          const fields = this.orderedFields
          fields.forEach((field) => {
            if (field.fieldType === 'checkbox') {
              const fieldValue = submitData[field.fieldName]
              // 如果是数组，转换为逗号分隔的字符串
              if (Array.isArray(fieldValue)) {
                submitData[field.fieldName] = fieldValue.join(',')
              }
            } else if (field.fieldType === 'datetime') {
              submitData[field.fieldName] = this.normalizeDateValueForSubmit(submitData[field.fieldName], field)
            }
          })

          let res
          if (this.dialogType === 'create') {
            // 新增数据
            res = await createMicroRuntimeData({
              modelName: this.appConfig.modelName,
              data: submitData
            })
          } else {
            // 更新数据
            const id = this.getRowPrimaryKey(this.formData)
            if (!id) {
              this.$message.error('更新失败：无法获取数据ID')
              return
            }
            res = await updateMicroRuntimeData({
              modelName: this.appConfig.modelName,
              id,
              data: submitData
            })
          }

          const result = res.data
          if (result.success) {
            this.$message.success(result.msg || (this.dialogType === 'create' ? '新增成功' : '更新成功'))
            this.dialogVisible = false
            this.getAppData()
            this.initFormData()
          } else {
            this.$message.error(
              (this.dialogType === 'create' ? '新增' : '更新') + '失败：' + (result.msg || '未知错误')
            )
          }
        } catch (error) {
          this.$message.error(
            (this.dialogType === 'create' ? '新增' : '更新') + '失败：' + (error.message || '网络错误')
          )
        }
      })
    },

    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize
      this.getAppData()
    },

    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage
      this.getAppData()
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    handleSortChange({ prop, order }) {
      this.sortInfo = {
        prop: prop || '',
        order: order || ''
      }
      this.pagination.currentPage = 1
      this.getAppData()
    },
    applyQueryFilters() {
      this.pagination.currentPage = 1
      this.getAppData()
    },
    resetQueryFilters() {
      this.searchKeyword = ''
      this.initQueryFilters()
      this.pagination.currentPage = 1
      this.getAppData()
    },
    normalizeFixedColumn(fixed) {
      return fixed === 'left' || fixed === 'right' ? fixed : false
    },
    getDateFormatType(field) {
      return ['year', 'month', 'date', 'datetime'].includes(field?.dateFormat) ? field.dateFormat : 'datetime'
    },
    getDatePickerType(field) {
      const formatType = this.getDateFormatType(field)
      return formatType === 'datetime' ? 'datetime' : formatType
    },
    getDateRangePickerType(field) {
      const formatType = this.getDateFormatType(field)
      return formatType === 'datetime' ? 'datetimerange' : `${formatType}range`
    },
    getDateValueFormat(field) {
      const formatType = this.getDateFormatType(field)
      const formatMap = {
        year: 'YYYY',
        month: 'YYYY-MM',
        date: 'YYYY-MM-DD',
        datetime: 'YYYY-MM-DD HH:mm:ss'
      }
      return formatMap[formatType]
    },
    getDateDisplayFormat(field) {
      const formatType = this.getDateFormatType(field)
      const formatMap = {
        year: 'YYYY',
        month: 'YYYY-MM',
        date: 'YYYY-MM-DD',
        datetime: 'YYYY-MM-DD HH:mm:ss'
      }
      return formatMap[formatType]
    },
    normalizeDateValueForSubmit(value, field, boundary = '') {
      if (!value) {
        return ''
      }

      const text = String(value)
      switch (this.getDateFormatType(field)) {
        case 'year':
          return boundary === 'end' ? `${text}-12-31 23:59:59` : `${text}-01-01 00:00:00`
        case 'month':
          if (boundary === 'end') {
            const [year, month] = text.split('-').map(Number)
            if (year && month) {
              const lastDay = new Date(year, month, 0).getDate()
              return `${text}-${String(lastDay).padStart(2, '0')} 23:59:59`
            }
          }
          return `${text}-01 00:00:00`
        case 'date':
          return boundary === 'end' ? `${text} 23:59:59` : `${text} 00:00:00`
        default:
          return text
      }
    },
    formatFieldValue(value, field) {
      if (value === null || value === undefined || value === '') {
        return ''
      }
      if (field?.fieldType === 'attachment') {
        return this.normalizeAttachmentValue(value)
          .map((attachment) => this.getAttachmentName(attachment))
          .join('、')
      }
      if (['select', 'radio', 'checkbox'].includes(field?.fieldType)) {
        const values = Array.isArray(value)
          ? value
          : String(value)
              .split(',')
              .map((item) => item.trim())
        const labels = values
          .filter((item) => item !== '')
          .map((item) => {
            const option = (field.options || []).find((opt) => String(opt.value) === String(item))
            return option?.label || item
          })
        return field.fieldType === 'checkbox' ? labels.join('、') : labels[0] || ''
      }
      if (field?.fieldType !== 'datetime') {
        return Array.isArray(value) ? value.join(',') : value
      }

      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        return value
      }

      const pad = (num) => String(num).padStart(2, '0')
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())

      switch (this.getDateFormatType(field)) {
        case 'year':
          return `${year}`
        case 'month':
          return `${year}-${month}`
        case 'date':
          return `${year}-${month}-${day}`
        default:
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
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
        return normalized && typeof normalized === 'object' ? [normalized] : []
      }
      return normalized.filter((item) => item && typeof item === 'object')
    },
    getAttachmentList(value) {
      return this.normalizeAttachmentValue(value)
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
    getAttachmentExt(attachment) {
      const ext = attachment.Ext || attachment.ext || ''
      if (ext) return String(ext).toLowerCase()

      const name = this.getAttachmentName(attachment)
      const dotIndex = name.lastIndexOf('.')
      return dotIndex > -1 ? name.slice(dotIndex).toLowerCase() : ''
    },
    getAttachmentExtLabel(attachment) {
      const ext = this.getAttachmentExt(attachment).replace(/^\./, '')
      return ext ? ext.toUpperCase() : 'FILE'
    },
    isImageAttachment(attachment) {
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(this.getAttachmentExt(attachment))
    },
    isVideoAttachment(attachment) {
      return ['.mp4', '.mov', '.webm', '.ogg'].includes(this.getAttachmentExt(attachment))
    },
    isPreviewableAttachment(attachment) {
      return this.isImageAttachment(attachment) || this.isVideoAttachment(attachment)
    },
    getAttachmentUrl(attachment) {
      const fileId = this.getAttachmentFileId(attachment)
      return fileId ? getFileDownloadUrl(fileId) : ''
    },
    previewAttachment(attachment) {
      const url = this.getAttachmentUrl(attachment)
      if (!url) {
        this.$message.warning('无法获取文件编号')
        return
      }

      if (this.isImageAttachment(attachment)) {
        this.attachmentImageUrlList = [url]
        this.attachmentImagePreviewVisible = true
        return
      }

      if (this.isVideoAttachment(attachment)) {
        this.attachmentVideoUrl = url
        this.attachmentVideoPreviewVisible = true
        return
      }

      this.downloadAttachment(attachment)
    },
    downloadAttachment(attachment) {
      const url = this.getAttachmentUrl(attachment)
      if (!url) {
        this.$message.warning('无法获取文件编号')
        return
      }
      window.location.href = url
    },
    // 导出Excel数据
    async exportData() {
      // 检查列表数据是否为空
      if (!this.appData.list || this.appData.list.length === 0) {
        this.$message.warning('当前列表为空，无法导出数据')
        return
      }

      try {
        // 构建查询参数
        const params = this.buildRuntimeQueryParams()
        delete params.PageNum
        delete params.PageSize

        // 发起导出请求
        const { data: res } = await exportMicroRuntimeData({
          modelName: this.appConfig.modelName,
          params
        })

        // 处理响应，生成下载链接
        const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${this.appConfig.configName}列表.xlsx`
        link.click()

        // 释放URL对象
        window.URL.revokeObjectURL(url)

        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error('导出失败：' + (error.message || '网络错误'))
      }
    },
    // 打开导入对话框
    openImportDialog() {
      this.importDialogVisible = true
    },
    onFormDialogSuccess() {
      this.dialogVisible = false
      this.getAppData()
      this.initFormData()
    },
    onImportDialogSuccess() {
      this.getAppData()
    }
    // 关闭导入对话框

    // 处理文件选择

    // importData handled by MicroAppImportDialog component
  }
}
</script>

<style scoped>
.dynamic-app-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
}
/* 应用内容 */
.app-content {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

/* 列表页面 */
.list-page {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  min-height: 0;
}

/* 表单页面 */
.form-page {
  width: 100%;
  overflow: hidden;
}

/* 加载中 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  text-align: center;
}

/* 表格卡片样式 */
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-actions :deep(.el-button + .el-button),
.query-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.toolbar-search {
  width: 240px;
  flex: 0 0 240px;
}

.advanced-query-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  max-width: 100%;
}

.advanced-query-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.query-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.query-label {
  flex: 0 0 52px;
  font-size: 12px;
  color: #606266;
  line-height: 18px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-control {
  width: 150px;
  flex: 0 1 150px;
  max-width: calc(100% - 60px);
}

.range-query {
  display: flex;
  gap: 6px;
  width: 220px;
  flex: 0 1 220px;
  max-width: calc(100% - 60px);
}

.range-query :deep(.el-input),
.range-query :deep(.el-date-editor) {
  flex: 1;
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  margin-left: auto;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

.attachment-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 6px 8px;
}

.attachment-cell-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 30px;
  padding: 4px 8px 4px 6px;
  border: 1px solid #e3e9f4;
  border-radius: 6px;
  background: #ffffff;
}

.attachment-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 20px;
  overflow: hidden;
  border-radius: 4px;
  background: #eef4ff;
  color: #3156a6;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-download-link,
.attachment-preview-link {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1f2d3d;
  cursor: pointer;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
}

.attachment-download-link {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-download-link:hover,
.attachment-download-link:focus,
.attachment-preview-link:hover,
.attachment-preview-link:focus {
  color: #2f6bff;
  text-decoration: underline;
}

.attachment-preview-link {
  flex-shrink: 0;
  color: #2f6bff;
  font-weight: 600;
}

.attachment-empty-cell {
  color: #8a98aa;
}

/* 表格样式优化 */
:deep(.el-table) {
  width: 100%;
  min-width: auto;
  table-layout: auto;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

/* 表格列样式优化 */
:deep(.el-table-column) {
  min-width: 80px;
}

/* 操作列固定宽度 */
:deep(.el-table-column--name__操作) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  flex: none !important;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow: hidden;
  padding-bottom: 10px;
}

/* 对话框表单容器样式 */
.dialog-form-container {
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 10px;
}

/* 防止对话框打开时页面滚动 */
:deep(.el-overlay) {
  overflow: hidden;
}

/* 滚动条样式优化 */
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

.dialog-form-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 导入说明样式 */
.import-tips {
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.import-tips p {
  margin: 0;
  padding: 2px 0;
}
</style>
