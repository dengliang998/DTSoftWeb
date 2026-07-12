<template>
  <div class="crud-config-container">
    <!-- 配置列表卡片 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20" style="margin-bottom: 15px">
        <el-col :span="6">
          <el-input v-model="queryInfo.query" clearable placeholder="请输入配置名称" @clear="getMicroApps">
            <template #append>
              <el-button icon="Search" @click="getMicroApps"></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="addMicroApp">创建微应用</el-button>
        </el-col>
      </el-row>

      <!-- 配置列表 -->
      <el-table
        :data="MicroAppList"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        border
        stripe
        class="table-wrapper"
      >
        <el-table-column type="index" label="序号" width="80"></el-table-column>
        <el-table-column label="配置名称" prop="ConfigName"></el-table-column>
        <el-table-column label="数据模型" prop="ModelName"></el-table-column>
        <el-table-column label="微应用路径" prop="MicroAppPath"></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.Status === 1 ? 'success' : 'danger'">
              {{ scope.row.Status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">{{ $filters.dateFormat(scope.row.CreateTime) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">{{ $filters.dateFormat(scope.row.UpdateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" icon="Edit" @click="editMicroApp(scope.row)"></el-button>
              <el-button type="primary" size="small" icon="Setting" @click="visualConfig(scope.row)"></el-button>
              <el-button type="success" size="small" icon="Document" @click="generateApiDoc(scope.row)"></el-button>
              <el-button type="danger" size="small" icon="Delete" @click="deleteMicroApp(scope.row.ItemId)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="queryInfo.pagesize"
        :current-page="queryInfo.pagenum"
        style="margin-top: 15px"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </el-card>

    <!-- 配置基本信息对话框 -->
    <MicroAppConfigDialog
      ref="MicroAppFormRef"
      v-model="dialogVisible"
      :title="dialogTitle"
      :form="MicroAppForm"
      :rules="rules"
      @submit="submitForm"
    />

    <!-- 可视化配置对话框 -->
    <el-dialog
      v-model="visualConfigVisible"
      title="可视化配置"
      width="90%"
      :close-on-click-modal="false"
      fullscreen
      class="visual-config-dialog"
    >
      <div class="visual-config-container">
        <aside class="field-sidebar">
          <div class="sidebar-head">
            <div>
              <div class="section-kicker">字段模型</div>
              <div class="section-title">模型字段配置</div>
            </div>
            <el-button type="primary" size="small" icon="Plus" @click="addField">新增</el-button>
          </div>

          <div class="field-metrics">
            <div class="metric-item">
              <span class="metric-value">{{ MicroAppForm.Fields.length }}</span>
              <span class="metric-label">字段</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ queryConfigCount }}</span>
              <span class="metric-label">查询</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ listConfigCount }}</span>
              <span class="metric-label">列表</span>
            </div>
          </div>

          <el-tree
            class="field-tree"
            :data="MicroAppForm.Fields"
            :props="{ label: 'label', children: 'children' }"
            node-key="fieldName"
            :expand-on-click-node="false"
            :current-node-key="selectedFieldKey"
            :default-expanded-keys="expandedKeys"
            draggable
            :allow-drop="allowFieldDrop"
            @node-drop="handleFieldDrop"
            @node-click="selectField"
          >
            <template #default="{ data }">
              <div class="field-tree-node">
                <span class="field-tree-node__main">
                  <el-icon class="field-tree-node__drag"><Rank /></el-icon>
                  <span class="field-tree-node__text">
                    <span class="field-tree-node__label">{{ data.label || '未命名字段' }}</span>
                    <span class="field-tree-node__meta">{{ data.fieldName || 'field_name' }}</span>
                  </span>
                </span>
                <span class="field-tree-node__side">
                  <el-tag size="small" effect="plain" :type="getFieldTypeTagType(data.fieldType)">
                    {{ getFieldTypeLabel(data.fieldType) }}
                  </el-tag>
                  <button class="field-tree-node__delete" type="button" @click.stop="deleteField(data.fieldName)">
                    删除
                  </button>
                </span>
              </div>
            </template>
          </el-tree>
        </aside>

        <main class="visual-workspace">
          <section class="workspace-panel app-settings-panel">
            <div class="panel-head">
              <div>
                <div class="section-kicker">生成策略</div>
                <div class="section-title">页面能力</div>
              </div>
              <div class="visual-config-actions">
                <el-button @click="visualConfigVisible = false">取消</el-button>
                <el-button type="primary" @click="saveVisualConfig">保存配置</el-button>
              </div>
            </div>

            <el-form :model="MicroAppForm" class="compact-form" label-position="top">
              <div class="switch-matrix">
                <label class="switch-tile">
                  <span>新增</span>
                  <el-switch v-model="MicroAppForm.SupportCreate"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>修改</span>
                  <el-switch v-model="MicroAppForm.SupportUpdate"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>删除</span>
                  <el-switch v-model="MicroAppForm.SupportDelete"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>批量删除</span>
                  <el-switch v-model="MicroAppForm.SupportBatchDelete"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>导入</span>
                  <el-switch v-model="MicroAppForm.SupportImport"></el-switch>
                </label>
                <label class="switch-tile">
                  <span>导出</span>
                  <el-switch v-model="MicroAppForm.SupportExport"></el-switch>
                </label>
              </div>

              <div class="settings-grid">
                <el-form-item label="数据范围">
                  <el-select v-model="MicroAppForm.DataScope" placeholder="请选择数据范围">
                    <el-option label="全部数据" value="all"></el-option>
                    <el-option label="本人数据" value="self"></el-option>
                    <el-option label="部门数据" value="department"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="表单列数">
                  <el-select v-model="MicroAppForm.FormColumns" placeholder="请选择每行列数">
                    <el-option label="1 列" :value="1"></el-option>
                    <el-option label="2 列" :value="2"></el-option>
                    <el-option label="3 列" :value="3"></el-option>
                    <el-option label="4 列" :value="4"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="搜索列数">
                  <el-select v-model="MicroAppForm.QueryColumns" placeholder="请选择每行搜索字段数">
                    <el-option label="1 列" :value="1"></el-option>
                    <el-option label="2 列" :value="2"></el-option>
                    <el-option label="3 列" :value="3"></el-option>
                    <el-option label="4 列" :value="4"></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </el-form>
          </section>

          <section class="workspace-panel field-editor-panel">
            <template v-if="selectedFieldData">
              <div class="field-editor-head">
                <div>
                  <div class="section-kicker">字段属性</div>
                  <div class="field-editor-title">
                    {{ selectedFieldData.label || '未命名字段' }}
                    <el-tag size="small" effect="plain" :type="getFieldTypeTagType(selectedFieldData.fieldType)">
                      {{ getFieldTypeLabel(selectedFieldData.fieldType) }}
                    </el-tag>
                  </div>
                </div>
                <div class="field-editor-meta">{{ selectedFieldData.fieldName || 'field_name' }}</div>
              </div>

              <el-form :model="selectedFieldData" class="field-config-form" label-position="top">
                <div class="config-section">
                  <div class="config-section-title">基础信息</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item label="字段名称">
                      <el-input v-model="selectedFieldData.label" placeholder="例如：客户名称"></el-input>
                    </el-form-item>
                    <el-form-item label="字段标识">
                      <el-input v-model="selectedFieldData.fieldName" placeholder="例如：customer_name"></el-input>
                    </el-form-item>
                    <el-form-item label="字段类型">
                      <el-select
                        v-model="selectedFieldData.fieldType"
                        placeholder="请选择字段类型"
                        @change="handleFieldTypeChange"
                      >
                        <el-option label="文本" value="string"></el-option>
                        <el-option label="数字" value="number"></el-option>
                        <el-option label="日期时间" value="datetime"></el-option>
                        <el-option label="布尔值" value="boolean"></el-option>
                        <el-option label="文本域" value="textarea"></el-option>
                        <el-option label="下拉选择" value="select"></el-option>
                        <el-option label="单选" value="radio"></el-option>
                        <el-option label="多选" value="checkbox"></el-option>
                        <el-option label="附件上传" value="attachment"></el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </div>

                <div class="config-section">
                  <div class="config-section-title">展示与编辑</div>
                  <div class="switch-matrix switch-matrix--field">
                    <label class="switch-tile">
                      <span>必填</span>
                      <el-switch v-model="selectedFieldData.required"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>列表显示</span>
                      <el-switch v-model="selectedFieldData.showInList"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>允许编辑</span>
                      <el-switch v-model="selectedFieldData.editable"></el-switch>
                    </label>
                    <label class="switch-tile">
                      <span>支持排序</span>
                      <el-switch
                        v-model="selectedFieldData.sortable"
                        :disabled="isAttachmentField(selectedFieldData)"
                      ></el-switch>
                    </label>
                  </div>
                  <div class="form-grid form-grid--3">
                    <el-form-item label="列表列宽">
                      <el-input-number
                        v-model="selectedFieldData.columnWidth"
                        :min="80"
                        :max="600"
                        :step="10"
                        placeholder="自动"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item label="固定列">
                      <el-select v-model="selectedFieldData.fixed" placeholder="请选择固定列位置">
                        <el-option label="不固定" value="none"></el-option>
                        <el-option label="固定在左侧" value="left"></el-option>
                        <el-option label="固定在右侧" value="right"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item v-if="!isAttachmentField(selectedFieldData)" label="默认值">
                      <el-input v-model="selectedFieldData.defaultValue" placeholder="请输入字段默认值"></el-input>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="isDateField(selectedFieldData)" class="config-section">
                  <div class="config-section-title">日期设置</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item label="日期格式">
                      <el-select v-model="selectedFieldData.dateFormat" placeholder="请选择日期格式">
                        <el-option label="年" value="year"></el-option>
                        <el-option label="年月" value="month"></el-option>
                        <el-option label="年月日" value="date"></el-option>
                        <el-option label="时间" value="datetime"></el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </div>

                <div class="config-section">
                  <div class="config-section-title">查询设置</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item label="查询方式">
                      <el-select v-model="selectedFieldData.queryMode" placeholder="请选择查询方式">
                        <el-option
                          v-for="option in getQueryModeOptions(selectedFieldData)"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        ></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item v-if="selectedFieldData.queryMode !== 'none'" label="查询宽度">
                      <el-input-number
                        v-model="selectedFieldData.queryWidth"
                        :min="100"
                        :max="600"
                        :step="10"
                        placeholder="150"
                      ></el-input-number>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="supportsColumnLength(selectedFieldData)" class="config-section">
                  <div class="config-section-title">数据库长度</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item label="字段长度">
                      <el-input-number
                        v-model="selectedFieldData.columnLength"
                        :min="1"
                        :max="2000"
                        :step="10"
                        :placeholder="getDefaultColumnLength(selectedFieldData)"
                      ></el-input-number>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="hasValidationConfig(selectedFieldData)" class="config-section">
                  <div class="config-section-title">校验规则</div>
                  <div class="form-grid form-grid--3">
                    <el-form-item v-if="supportsLengthRule(selectedFieldData)" label="最小长度">
                      <el-input-number
                        v-model="selectedFieldData.minLength"
                        :min="0"
                        :max="10000"
                        placeholder="最小长度"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsLengthRule(selectedFieldData)" label="最大长度">
                      <el-input-number
                        v-model="selectedFieldData.maxLength"
                        :min="0"
                        :max="10000"
                        placeholder="最大长度"
                      ></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsNumberRange(selectedFieldData)" label="最小值">
                      <el-input-number v-model="selectedFieldData.minValue" placeholder="最小值"></el-input-number>
                    </el-form-item>
                    <el-form-item v-if="supportsNumberRange(selectedFieldData)" label="最大值">
                      <el-input-number v-model="selectedFieldData.maxValue" placeholder="最大值"></el-input-number>
                    </el-form-item>
                    <el-form-item
                      v-if="supportsPatternRule(selectedFieldData)"
                      label="正则校验"
                      class="form-grid-span-2"
                    >
                      <el-input v-model="selectedFieldData.pattern" placeholder="请输入正则表达式"></el-input>
                    </el-form-item>
                  </div>
                </div>

                <div v-if="supportsOptions(selectedFieldData)" class="config-section">
                  <div class="config-section-head">
                    <div class="config-section-title">选项配置</div>
                    <el-button type="primary" size="small" icon="Plus" @click="addOption">添加选项</el-button>
                  </div>
                  <div class="options-container">
                    <div v-if="selectedFieldData.options && selectedFieldData.options.length > 0" class="option-list">
                      <div v-for="(option, index) in selectedFieldData.options" :key="index" class="option-item">
                        <el-input v-model="option.label" placeholder="选项标签"></el-input>
                        <el-input v-model="option.value" placeholder="选项值"></el-input>
                        <el-tooltip content="删除选项" placement="top">
                          <el-button
                            class="option-delete-button"
                            type="danger"
                            size="small"
                            icon="Delete"
                            @click="deleteOption(index)"
                          >
                            删除
                          </el-button>
                        </el-tooltip>
                      </div>
                    </div>
                    <div v-else class="empty-inline">还没有选项，添加后可用于下拉、单选或多选。</div>
                  </div>
                </div>
              </el-form>
            </template>
            <div v-else class="no-selection">
              <div class="no-selection-title">选择左侧字段开始配置</div>
              <div class="no-selection-subtitle">字段支持拖拽排序，配置会影响生成页面的列表、表单和查询区域。</div>
            </div>
          </section>
        </main>
      </div>
    </el-dialog>

    <!-- 接口文档对话框 -->
    <ApiDocDialog v-model="apiDocVisible" :apis="generatedApis" />
  </div>
</template>

<script>
import { addMicroAppConfig, deleteMicroAppConfig, getMicroAppConfigs, updateMicroAppConfig } from '@/api/microApp'
import MicroAppConfigDialog from './components/MicroAppConfigDialog.vue'
import ApiDocDialog from './components/ApiDocDialog.vue'

export default {
  name: 'MicroApp',
  components: {
    MicroAppConfigDialog,
    ApiDocDialog
  },
  data() {
    return {
      // 查询条件
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 10
      },
      // 微应用配置列表
      MicroAppList: [],
      // 总数
      total: 0,
      // 对话框显示状态
      dialogVisible: false,
      // 对话框标题
      dialogTitle: '',
      // 可视化配置对话框显示状态
      visualConfigVisible: false,
      // 接口文档对话框显示状态
      apiDocVisible: false,
      // 当前激活的 API 标签
      activeApiTab: 'api-list',
      // 选中的字段 key
      selectedFieldKey: '',
      // 展开的节点 keys
      expandedKeys: [],
      // 选中的字段数据
      selectedFieldData: null,
      // 生成的API列表
      generatedApis: [],
      // 微应用配置表单
      MicroAppForm: {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        MicroAppPath: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportBatchDelete: false,
        SupportImport: false,
        SupportExport: false,
        DataScope: 'all',
        FormColumns: 1,
        QueryColumns: 1,
        Fields: []
      },
      // 表单验证规则
      rules: {
        ConfigName: [
          { required: true, message: '请输入配置名称', trigger: 'blur' },
          { min: 2, max: 20, message: '配置名称长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        ModelName: [
          { required: true, message: '请输入数据模型名称', trigger: 'blur' },
          {
            pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            message: '数据模型名称只能包含英文、数字和下划线，且以英文开头',
            trigger: 'blur'
          }
        ],
        MicroAppPath: [
          { required: true, message: '请输入微应用路径', trigger: 'blur' },
          {
            pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
            message: '微应用路径只能包含英文、数字、中划线和下划线，且以英文开头',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    queryConfigCount() {
      return this.MicroAppForm.Fields.filter((field) => field.queryMode && field.queryMode !== 'none').length
    },
    listConfigCount() {
      return this.MicroAppForm.Fields.filter((field) => field.showInList).length
    }
  },
  created() {
    this.getMicroApps()
  },
  methods: {
    isTextField(field) {
      return ['string', 'textarea'].includes(field?.fieldType)
    },
    isNumberField(field) {
      return field?.fieldType === 'number'
    },
    isDateField(field) {
      return field?.fieldType === 'datetime'
    },
    isAttachmentField(field) {
      return field?.fieldType === 'attachment'
    },
    supportsOptions(field) {
      return ['select', 'radio', 'checkbox'].includes(field?.fieldType)
    },
    supportsColumnLength(field) {
      return ['string', 'select', 'radio', 'checkbox'].includes(field?.fieldType)
    },
    getDefaultColumnLength(field) {
      return field?.fieldType === 'select' ? 200 : 500
    },
    supportsLengthRule(field) {
      return this.isTextField(field)
    },
    supportsNumberRange(field) {
      return this.isNumberField(field)
    },
    supportsPatternRule(field) {
      return this.isTextField(field)
    },
    hasValidationConfig(field) {
      return this.supportsLengthRule(field) || this.supportsNumberRange(field) || this.supportsPatternRule(field)
    },
    getFieldTypeLabel(fieldType) {
      const typeMap = {
        string: '文本',
        number: '数字',
        datetime: '日期',
        boolean: '布尔',
        textarea: '文本域',
        select: '下拉',
        radio: '单选',
        checkbox: '多选',
        attachment: '附件'
      }

      return typeMap[fieldType] || '字段'
    },
    getFieldTypeTagType(fieldType) {
      const tagMap = {
        string: '',
        textarea: '',
        number: 'success',
        datetime: 'warning',
        boolean: 'info',
        select: '',
        radio: '',
        checkbox: '',
        attachment: 'info'
      }

      return tagMap[fieldType] || ''
    },
    getQueryModeOptions(field) {
      const options = [{ label: '不参与查询', value: 'none' }]

      if (this.isTextField(field)) {
        return options.concat([
          { label: '精确查询', value: 'exact' },
          { label: '模糊查询', value: 'fuzzy' }
        ])
      }

      if (this.isNumberField(field) || this.isDateField(field)) {
        return options.concat([
          { label: '精确查询', value: 'exact' },
          { label: '范围查询', value: 'range' }
        ])
      }

      if (this.supportsOptions(field) || field?.fieldType === 'boolean') {
        return options.concat([{ label: '精确查询', value: 'exact' }])
      }

      return options
    },
    normalizeFieldByType(field) {
      if (!field) return

      const allowedQueryModes = this.getQueryModeOptions(field).map((option) => option.value)
      if (!allowedQueryModes.includes(field.queryMode)) {
        field.queryMode = 'none'
      }

      if (!this.isDateField(field)) {
        field.dateFormat = 'datetime'
      }

      if (this.isAttachmentField(field)) {
        field.defaultValue = ''
        field.sortable = false
      }

      if (this.supportsColumnLength(field)) {
        const defaultLength = this.getDefaultColumnLength(field)
        const parsedLength = Number(field.columnLength)
        field.columnLength = Number.isInteger(parsedLength) && parsedLength > 0 ? parsedLength : defaultLength
      } else {
        field.columnLength = null
      }

      if (!this.supportsOptions(field)) {
        field.options = []
      }

      if (!this.supportsLengthRule(field)) {
        field.minLength = null
        field.maxLength = null
      }

      if (!this.supportsNumberRange(field)) {
        field.minValue = null
        field.maxValue = null
      }

      if (!this.supportsPatternRule(field)) {
        field.pattern = ''
      }
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
    normalizeFormColumns(formColumns) {
      const value = Number(formColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
    },
    normalizeQueryColumns(queryColumns) {
      const value = Number(queryColumns)
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : 1
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
    normalizeFields(fields) {
      let normalized = fields || []

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

      const normalizedFields = this.normalizeFieldOrder(
        normalized.map((field, index) => ({
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
            field.Required !== undefined ? field.Required : field.required !== undefined ? field.required : false,
          showInList:
            field.ShowInList !== undefined
              ? field.ShowInList
              : field.showInList !== undefined
                ? field.showInList
                : true,
          editable:
            field.Editable !== undefined ? field.Editable : field.editable !== undefined ? field.editable : true,
          validation: field.Validation || field.validation || '',
          columnWidth: field.ColumnWidth || field.columnWidth || null,
          columnLength:
            field.ColumnLength !== undefined
              ? field.ColumnLength
              : field.columnLength !== undefined
                ? field.columnLength
                : null,
          sortable:
            field.Sortable !== undefined ? field.Sortable : field.sortable !== undefined ? field.sortable : false,
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
          options: this.normalizeFieldOptions(field.Options || field.options || [])
        }))
      )

      normalizedFields.forEach((field) => this.normalizeFieldByType(field))
      return normalizedFields
    },
    // 获取微应用配置列表
    async getMicroApps() {
      try {
        const params = {
          PageNum: this.queryInfo.pagenum,
          PageSize: this.queryInfo.pagesize
        }
        // 只有当 query 不为空时才添加 Keyword 参数
        if (this.queryInfo.query) {
          params.Keyword = this.queryInfo.query
        }
        const { data: res } = await getMicroAppConfigs(params)
        if (res.success) {
          // 兼容旧返回字段，并统一映射到微应用路径
          this.MicroAppList = res.data.map((item) => ({
            ...item,
            MicroAppPath: item.MicroAppPath || item.ApiPrefix || item.ModelName || '',
            DataScope: item.DataScope || item.dataScope || 'all',
            FormColumns: this.normalizeFormColumns(item.FormColumns || item.formColumns),
            QueryColumns: this.normalizeQueryColumns(item.QueryColumns || item.queryColumns),
            configDesc: item.ConfigDesc || item.configDesc || ''
          }))
          this.total = res.total
        } else {
          this.$message.error(res.msg || '获取微应用配置列表失败')
        }
      } catch (error) {
        this.$message.error('获取微应用配置列表失败：' + error.message)
      }
    },
    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getMicroApps()
    },
    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getMicroApps()
    },
    // 添加微应用
    addMicroApp() {
      this.dialogTitle = '创建微应用'
      this.MicroAppForm = {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        MicroAppPath: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportBatchDelete: false,
        SupportImport: false,
        SupportExport: false,
        DataScope: 'all',
        FormColumns: 1,
        QueryColumns: 1,
        Fields: []
      }
      this.dialogVisible = true
    },
    // 编辑微应用
    editMicroApp(row) {
      this.dialogTitle = '编辑微应用'
      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        configDesc: row.ConfigDesc || row.configDesc || ''
      }
      this.dialogVisible = true
    },
    // 删除微应用
    deleteMicroApp(ItemId) {
      this.$confirm('确定要删除该微应用吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const { data: res } = await deleteMicroAppConfig(ItemId)
            if (res.success) {
              this.$message.success(res.msg || '删除成功')
              this.getMicroApps()
            } else {
              this.$message.error(res.msg || '删除失败')
            }
          } catch (error) {
            this.$message.error('删除失败：' + error.message)
          }
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },
    // 提交表单
    async submitForm() {
      this.$refs.MicroAppFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const submitData = {
            ...this.MicroAppForm,
            ConfigDesc: this.MicroAppForm.configDesc || this.MicroAppForm.ConfigDesc || '',
            MicroAppPath: this.MicroAppForm.MicroAppPath || this.MicroAppForm.ModelName,
            FormColumns: this.normalizeFormColumns(this.MicroAppForm.FormColumns),
            QueryColumns: this.normalizeQueryColumns(this.MicroAppForm.QueryColumns)
          }
          let res
          if (this.MicroAppForm.ItemId) {
            res = await updateMicroAppConfig(submitData)
          } else {
            res = await addMicroAppConfig(submitData)
          }
          if (res.data.success) {
            this.$message.success(res.data.msg || (this.MicroAppForm.id ? '更新成功' : '添加成功'))
            this.dialogVisible = false
            this.getMicroApps()
          } else {
            this.$message.error(res.data.msg || '操作失败')
          }
        } catch (error) {
          this.$message.error('操作失败：' + error.message)
        }
      })
    },
    // 可视化配置
    visualConfig(row) {
      console.log('原始行数据:', row)
      console.log('Fields 数据类型:', typeof row.Fields)
      console.log('Fields 数据:', row.Fields)

      const fields = this.normalizeFields(row.Fields)

      console.log('转换后的 Fields:', fields)

      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields
      }

      console.log('MicroAppForm.Fields:', this.MicroAppForm.Fields)

      // 初始化展开的节点
      this.expandedKeys = []
      // 重置选中状态
      this.selectedFieldKey = ''
      this.selectedFieldData = null
      this.visualConfigVisible = true
    },
    // 添加字段
    addField() {
      const newField = {
        label: '新字段',
        fieldName: 'new_field',
        fieldType: 'string',
        required: false,
        showInList: true,
        editable: true,
        validation: '',
        columnWidth: null,
        sortable: false,
        fixed: 'none',
        queryMode: 'none',
        queryWidth: 150,
        dateFormat: 'datetime',
        sortOrder: this.MicroAppForm.Fields.length + 1,
        minLength: null,
        maxLength: null,
        minValue: null,
        maxValue: null,
        pattern: '',
        defaultValue: '',
        columnLength: 500,
        options: []
      }
      this.MicroAppForm.Fields.push(newField)
    },
    // 添加选项
    addOption() {
      if (!this.selectedFieldData.options) {
        this.selectedFieldData.options = []
      }
      // 使用setTimeout避免ResizeObserver循环
      setTimeout(() => {
        this.selectedFieldData.options.push({
          label: '',
          value: ''
        })
      }, 0)
    },
    // 删除选项
    deleteOption(index) {
      if (this.selectedFieldData.options && this.selectedFieldData.options.length > 0) {
        // 使用setTimeout避免ResizeObserver循环
        setTimeout(() => {
          this.selectedFieldData.options.splice(index, 1)
        }, 0)
      }
    },
    // 选择字段
    selectField(data) {
      this.selectedFieldKey = data.fieldName
      this.selectedFieldData = data
    },
    allowFieldDrop(draggingNode, dropNode, type) {
      return type !== 'inner'
    },
    refreshFieldSortOrder() {
      this.MicroAppForm.Fields = this.MicroAppForm.Fields.map((field, index) => ({
        ...field,
        sortOrder: index + 1
      }))

      if (this.selectedFieldKey) {
        this.selectedFieldData =
          this.MicroAppForm.Fields.find((field) => field.fieldName === this.selectedFieldKey) || null
      }
    },
    handleFieldDrop() {
      this.refreshFieldSortOrder()
    },
    // 处理字段类型变化
    handleFieldTypeChange() {
      // 使用setTimeout避免ResizeObserver循环
      setTimeout(() => {
        if (this.selectedFieldData && this.supportsOptions(this.selectedFieldData)) {
          if (!this.selectedFieldData.options) {
            this.selectedFieldData.options = []
          }
        }
        if (this.selectedFieldData && this.selectedFieldData.fieldType === 'datetime') {
          this.selectedFieldData.dateFormat = this.selectedFieldData.dateFormat || 'datetime'
        }
        this.normalizeFieldByType(this.selectedFieldData)
      }, 0)
    },
    // 删除字段
    deleteField(fieldName) {
      const index = this.MicroAppForm.Fields.findIndex((item) => item.fieldName === fieldName)
      if (index > -1) {
        this.MicroAppForm.Fields.splice(index, 1)
        if (this.selectedFieldData && this.selectedFieldData.fieldName === fieldName) {
          this.selectedFieldKey = ''
          this.selectedFieldData = null
        }
        this.refreshFieldSortOrder()
      }
    },
    // 保存可视化配置
    async saveVisualConfig() {
      try {
        // 将小驼峰命名转换为大驼峰命名，以适配后台接口
        const submitData = {
          ...this.MicroAppForm,
          ConfigName: this.MicroAppForm.ConfigName,
          ModelName: this.MicroAppForm.ModelName,
          MicroAppPath: this.MicroAppForm.MicroAppPath,
          ConfigDesc: this.MicroAppForm.configDesc || this.MicroAppForm.ConfigDesc,
          DataScope: this.MicroAppForm.DataScope || 'all',
          FormColumns: this.normalizeFormColumns(this.MicroAppForm.FormColumns),
          QueryColumns: this.normalizeQueryColumns(this.MicroAppForm.QueryColumns),
          Fields: this.normalizeFieldOrder(this.MicroAppForm.Fields).map((field) => {
            this.normalizeFieldByType(field)
            return {
              Label: field.label,
              FieldName: field.fieldName,
              FieldType: field.fieldType,
              SortOrder: field.sortOrder,
              Required: field.required,
              ShowInList: field.showInList,
              Editable: field.editable,
              Validation: field.validation,
              ColumnWidth: field.columnWidth,
              ColumnLength: field.columnLength,
              Sortable: field.sortable,
              Fixed: field.fixed || 'none',
              QueryMode: field.queryMode || 'none',
              QueryWidth: field.queryMode && field.queryMode !== 'none' ? field.queryWidth || 150 : null,
              DateFormat: field.fieldType === 'datetime' ? field.dateFormat || 'datetime' : null,
              MinLength: field.minLength,
              MaxLength: field.maxLength,
              MinValue: field.minValue,
              MaxValue: field.maxValue,
              Pattern: field.pattern,
              DefaultValue: field.defaultValue,
              Options: this.normalizeFieldOptions(field.options)
            }
          })
        }

        console.log('提交的数据:', submitData)

        const res = await updateMicroAppConfig(submitData)
        if (res.data.success) {
          this.$message.success(res.data.msg || '保存成功')
          this.visualConfigVisible = false
          this.getMicroApps()
        } else {
          this.$message.error(res.data.msg || '保存失败')
        }
      } catch (error) {
        this.$message.error('保存失败：' + error.message)
      }
    },
    // 生成接口文档
    generateApiDoc(row) {
      console.log('生成接口文档 - 原始行数据:', row)
      console.log('生成接口文档 - Fields 数据类型:', typeof row.Fields)
      console.log('生成接口文档 - Fields 数据:', row.Fields)

      const fields = this.normalizeFields(row.Fields)

      console.log('转换后的 Fields:', fields)

      this.MicroAppForm = {
        ...row,
        MicroAppPath: row.MicroAppPath || row.ApiPrefix || row.ModelName || '',
        DataScope: row.DataScope || row.dataScope || 'all',
        FormColumns: this.normalizeFormColumns(row.FormColumns || row.formColumns),
        QueryColumns: this.normalizeQueryColumns(row.QueryColumns || row.queryColumns),
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields
      }

      console.log('MicroAppForm.Fields:', this.MicroAppForm.Fields)

      this.generateApis()
      this.apiDocVisible = true
    },
    // 生成API列表
    generateApis() {
      const { ModelName, Fields, SupportCreate, SupportUpdate, SupportDelete } = this.MicroAppForm
      const basePath = `/api/${ModelName.toLowerCase()}`

      this.generatedApis = []

      // 确保Fields是数组
      const fields = Array.isArray(Fields) ? Fields : []

      // 查询列表接口
      this.generatedApis.push({
        method: 'GET',
        path: `${basePath}`,
        description: '获取' + this.MicroAppForm.ConfigName + '列表',
        requestParams: [
          { name: 'pageNum', type: 'int', required: true, description: '页码' },
          { name: 'pageSize', type: 'int', required: true, description: '每页条数' },
          { name: 'keyword', type: 'string', required: false, description: '搜索关键词' }
        ],
        responseExample: JSON.stringify(
          {
            success: true,
            msg: '获取成功',
            data: {
              list: [
                fields.reduce(
                  (obj, field) => {
                    if (field.fieldName) obj[field.fieldName] = ''
                    return obj
                  },
                  { ItemId: 3175191353393221 }
                )
              ],
              total: 1
            }
          },
          null,
          2
        )
      })

      // 详情接口
      this.generatedApis.push({
        method: 'GET',
        path: `${basePath}/:id`,
        description: '获取' + this.MicroAppForm.ConfigName + '详情',
        requestParams: [{ name: 'id', type: 'long', required: true, description: 'ID' }],
        responseExample: JSON.stringify(
          {
            success: true,
            msg: '获取成功',
            data: fields.reduce(
              (obj, field) => {
                if (field.fieldName) obj[field.fieldName] = ''
                return obj
              },
              { ItemId: 3175191353393221 }
            )
          },
          null,
          2
        )
      })

      // 添加接口
      if (SupportCreate) {
        this.generatedApis.push({
          method: 'POST',
          path: `${basePath}`,
          description: '添加' + this.MicroAppForm.ConfigName,
          requestParams: fields
            .filter((f) => f.fieldName)
            .map((field) => ({
              name: field.fieldName,
              type: field.fieldType || 'string',
              required: field.required || false,
              description: field.label || field.fieldName
            })),
          responseExample: JSON.stringify(
            {
              success: true,
              msg: '添加成功',
              data: fields.reduce(
                (obj, field) => {
                  if (field.fieldName) obj[field.fieldName] = ''
                  return obj
                },
                { ItemId: 3175191353393221 }
              )
            },
            null,
            2
          )
        })
      }

      // 更新接口
      if (SupportUpdate) {
        this.generatedApis.push({
          method: 'PUT',
          path: `${basePath}/:id`,
          description: '更新' + this.MicroAppForm.ConfigName,
          requestParams: [
            { name: 'id', type: 'long', required: true, description: 'ID' },
            ...fields
              .filter((f) => f.fieldName)
              .map((field) => ({
                name: field.fieldName,
                type: field.fieldType || 'string',
                required: field.required || false,
                description: field.label || field.fieldName
              }))
          ],
          responseExample: JSON.stringify(
            {
              success: true,
              msg: '更新成功',
              data: null
            },
            null,
            2
          )
        })
      }

      // 删除接口
      if (SupportDelete) {
        this.generatedApis.push({
          method: 'DELETE',
          path: `${basePath}/:id`,
          description: '删除' + this.MicroAppForm.ConfigName,
          requestParams: [{ name: 'id', type: 'long', required: true, description: 'ID' }],
          responseExample: JSON.stringify(
            {
              success: true,
              msg: '删除成功',
              data: null
            },
            null,
            2
          )
        })
      }
    }
  }
}
</script>

<style scoped>
.crud-config-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

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
}

.table-wrapper {
  flex: 1;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

/* 可视化配置容器 */
:deep(.visual-config-dialog) {
  display: flex;
  height: 100vh;
  max-height: 100vh;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
}

:deep(.visual-config-dialog .el-dialog__header) {
  flex: 0 0 auto;
}

:deep(.visual-config-dialog .el-dialog__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 18px 0;
  background: #f6f8fb;
}

:deep(.visual-config-dialog .el-dialog__footer) {
  display: none;
}

.visual-config-container {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.field-sidebar,
.workspace-panel {
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(31, 56, 88, 0.06);
}

.field-sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow: hidden;
}

.sidebar-head,
.panel-head,
.field-editor-head,
.config-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.visual-config-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.visual-config-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.section-kicker {
  margin-bottom: 3px;
  color: #6b7c93;
  font-size: 12px;
  line-height: 16px;
}

.section-title {
  color: #1f2d3d;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.field-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0 12px;
}

.metric-item {
  position: relative;
  min-width: 0;
  padding: 10px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
}

.metric-item::before {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 5px;
  height: 20px;
  border-radius: 999px;
  background: #2f6bff;
  content: '';
}

.metric-value {
  display: block;
  color: #1f2d3d;
  font-size: 20px;
  font-weight: 700;
  line-height: 24px;
}

.metric-label {
  display: block;
  margin-top: 2px;
  color: #8a98aa;
  font-size: 12px;
}

.field-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.field-tree :deep(.el-tree-node__content) {
  height: 52px;
  margin: 4px 0;
  border-radius: 8px;
  padding-right: 8px;
}

.field-tree :deep(.el-tree-node__content:hover),
.field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #eef4ff;
}

.field-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  box-shadow: inset 3px 0 0 #2f6bff;
}

.field-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 8px;
  padding-right: 10px;
}

.field-tree-node__main {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.field-tree-node__drag {
  color: #8a98aa;
  cursor: grab;
  flex-shrink: 0;
}

.field-tree-node__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.field-tree-node__label,
.field-tree-node__meta {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-tree-node__label {
  color: #1f2d3d;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.field-tree-node__meta {
  color: #8a98aa;
  font-size: 12px;
  line-height: 16px;
}

.field-tree-node__side {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.field-tree-node__delete {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.field-tree-node__delete:hover,
.field-tree-node__delete:focus {
  color: #f56c6c;
}

.visual-workspace {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.workspace-panel {
  padding: 14px;
}

.app-settings-panel {
  flex: 0 0 auto;
}

.field-editor-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.compact-form :deep(.el-form-item),
.field-config-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.compact-form :deep(.el-form-item__label),
.field-config-form :deep(.el-form-item__label) {
  margin-bottom: 4px;
  color: #5d6f85;
  font-size: 12px;
  line-height: 18px;
}

.compact-form :deep(.el-select),
.compact-form :deep(.el-input-number),
.field-config-form :deep(.el-select),
.field-config-form :deep(.el-input),
.field-config-form :deep(.el-input-number) {
  width: 100%;
}

.switch-matrix {
  display: grid;
  grid-template-columns: repeat(6, minmax(92px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.switch-matrix--field {
  grid-template-columns: repeat(4, minmax(112px, 1fr));
  margin: 0 0 12px;
}

.switch-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: #fbfdff;
  color: #344563;
  font-size: 13px;
  line-height: 20px;
}

.settings-grid,
.form-grid {
  display: grid;
  gap: 12px;
}

.settings-grid {
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  margin-top: 12px;
}

.form-grid--3 {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.form-grid-span-2 {
  grid-column: span 2;
}

.field-editor-head {
  position: sticky;
  top: -14px;
  z-index: 1;
  margin: -14px -14px 0;
  padding: 14px;
  border-bottom: 1px solid #e6edf7;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
}

.field-editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2d3d;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
}

.field-editor-meta {
  max-width: 260px;
  overflow: hidden;
  color: #6b7c93;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-config-form {
  padding-top: 14px;
}

.config-section {
  padding: 14px 0;
  border-bottom: 1px solid #edf2f7;
}

.config-section:first-child {
  padding-top: 0;
}

.config-section:last-child {
  border-bottom: 0;
}

.config-section-title {
  margin-bottom: 10px;
  color: #1f2d3d;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.inline-control-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 选项容器样式 */
.options-container {
  width: 100%;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.option-delete-button {
  width: 72px !important;
  height: 32px !important;
  padding: 0 12px !important;
  border: 0 !important;
  border-radius: 8px !important;
  background: #e5484d !important;
  color: #ffffff !important;
  font-size: 13px !important;
}

.option-delete-button:hover,
.option-delete-button:focus {
  background: #c73338 !important;
  color: #ffffff !important;
  box-shadow: none !important;
}

.option-delete-button :deep(.el-icon),
.option-delete-button :deep(span) {
  color: #ffffff !important;
}

.empty-inline {
  padding: 12px;
  border: 1px dashed #d9e3f0;
  border-radius: 8px;
  background: #fbfdff;
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}

.no-selection {
  display: flex;
  height: 100%;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed #d9e3f0;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

.no-selection-title {
  color: #1f2d3d;
  font-size: 16px;
  font-weight: 600;
}

.no-selection-subtitle {
  max-width: 360px;
  margin-top: 8px;
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}

@media (max-width: 1180px) {
  .visual-config-container {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .switch-matrix,
  .switch-matrix--field,
  .settings-grid,
  .form-grid--3 {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 860px) {
  .visual-config-container {
    grid-template-columns: 1fr;
  }

  .field-sidebar {
    max-height: 280px;
  }

  .settings-grid,
  .form-grid--3,
  .option-item {
    grid-template-columns: 1fr;
  }

  .option-delete-button {
    justify-self: end;
  }

  .form-grid-span-2 {
    grid-column: auto;
  }
}

/* API文档容器 */
.api-doc-container {
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 10px;
}

/* 滚动条样式优化 */
.api-doc-container::-webkit-scrollbar {
  width: 6px;
}

.api-doc-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.api-doc-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.api-doc-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 防止对话框打开时页面滚动 */
body:has(.el-overlay) {
  overflow: hidden;
}

.api-card {
  margin-bottom: 15px;
}

.api-header {
  display: flex;
  align-items: center;
}

.api-content {
  padding: 10px 0;
}

.response-format {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.json-preview {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  max-height: 500px;
}

.json-preview pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>
