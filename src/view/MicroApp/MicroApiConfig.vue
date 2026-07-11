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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="MicroAppFormRef" :model="MicroAppForm" :rules="rules" label-width="100px">
        <el-form-item label="配置名称" prop="ConfigName">
          <el-input v-model="MicroAppForm.ConfigName" placeholder="请输入配置名称"></el-input>
        </el-form-item>
        <el-form-item label="数据模型" prop="ModelName">
          <el-input
            v-model="MicroAppForm.ModelName"
            placeholder="请输入数据模型名称（英文）"
            :disabled="Boolean(MicroAppForm.ItemId)"
          ></el-input>
        </el-form-item>
        <el-form-item label="微应用路径" prop="MicroAppPath">
          <el-input v-model="MicroAppForm.MicroAppPath" placeholder="请输入微应用路径，例如 customer_center"></el-input>
        </el-form-item>
        <el-form-item label="配置描述" prop="configDesc">
          <el-input v-model="MicroAppForm.configDesc" type="textarea" placeholder="请输入配置描述" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="MicroAppForm.Status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 可视化配置对话框 -->
    <el-dialog v-model="visualConfigVisible" title="可视化配置" width="90%" :close-on-click-modal="false" fullscreen>
      <div class="visual-config-container">
        <!-- 左侧配置面板 -->
        <div class="config-panel">
          <el-card class="panel-card">
            <template #header>
              <div class="card-header">
                <span>模型字段配置</span>
              </div>
            </template>

            <!-- 字段列表 -->
            <div class="field-list">
              <el-button type="primary" size="small" icon="Plus" style="margin-bottom: 10px" @click="addField">
                添加字段
              </el-button>
              <el-tree
                :data="MicroAppForm.Fields"
                :props="{ label: 'label', children: 'children' }"
                node-key="fieldName"
                :expand-on-click-node="false"
                :current-node-key="selectedFieldKey"
                :default-expanded-keys="expandedKeys"
                @node-click="selectField"
              >
                <template #default="{ data }">
                  <span>{{ data.label }}</span>
                  <el-button
                    type="text"
                    size="small"
                    style="margin-left: 10px"
                    @click.stop="deleteField(data.fieldName)"
                  >
                    删除
                  </el-button>
                </template>
              </el-tree>
            </div>
          </el-card>
        </div>

        <!-- 中间字段属性配置 -->
        <div class="property-panel">
          <el-card class="panel-card">
            <template #header>
              <div class="card-header">
                <span>字段属性配置</span>
              </div>
            </template>

            <div v-if="selectedFieldData" class="property-form">
              <el-form :model="selectedFieldData" label-width="120px">
                <el-form-item label="字段名称">
                  <el-input v-model="selectedFieldData.label" placeholder="请输入字段显示名称"></el-input>
                </el-form-item>
                <el-form-item label="字段标识">
                  <el-input v-model="selectedFieldData.fieldName" placeholder="请输入字段标识（英文）"></el-input>
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
                  </el-select>
                </el-form-item>
                <!-- 下拉选择/单选/多选值配置 -->
                <el-form-item
                  v-show="
                    selectedFieldData.fieldType === 'select' ||
                    selectedFieldData.fieldType === 'radio' ||
                    selectedFieldData.fieldType === 'checkbox'
                  "
                  label="选项配置"
                >
                  <div class="options-container">
                    <div v-if="selectedFieldData.options && selectedFieldData.options.length > 0">
                      <div v-for="(option, index) in selectedFieldData.options" :key="index" class="option-item">
                        <el-input
                          v-model="option.label"
                          placeholder="选项标签"
                          style="width: 40%; margin-right: 10px"
                        ></el-input>
                        <el-input
                          v-model="option.value"
                          placeholder="选项值"
                          style="width: 40%; margin-right: 10px"
                        ></el-input>
                        <el-button type="danger" size="small" icon="Delete" @click="deleteOption(index)">
                          删除
                        </el-button>
                      </div>
                    </div>
                    <div class="add-option-container">
                      <el-button type="primary" size="small" icon="Plus" @click="addOption">添加选项</el-button>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="是否必填">
                  <el-switch v-model="selectedFieldData.required"></el-switch>
                </el-form-item>
                <el-form-item label="是否显示在列表">
                  <el-switch v-model="selectedFieldData.showInList"></el-switch>
                </el-form-item>
                <el-form-item label="列宽">
                  <el-input-number
                    v-model="selectedFieldData.columnWidth"
                    :min="80"
                    :max="600"
                    :step="10"
                    placeholder="自动"
                  ></el-input-number>
                </el-form-item>
                <el-form-item label="支持排序">
                  <el-switch v-model="selectedFieldData.sortable"></el-switch>
                </el-form-item>
                <el-form-item label="固定列">
                  <el-select v-model="selectedFieldData.fixed" placeholder="请选择固定列位置">
                    <el-option label="不固定" value="none"></el-option>
                    <el-option label="固定在左侧" value="left"></el-option>
                    <el-option label="固定在右侧" value="right"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="查询方式">
                  <el-select v-model="selectedFieldData.queryMode" placeholder="请选择查询方式">
                    <el-option label="不参与查询" value="none"></el-option>
                    <el-option label="精确查询" value="exact"></el-option>
                    <el-option label="模糊查询" value="fuzzy"></el-option>
                    <el-option label="范围查询" value="range"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="是否可编辑">
                  <el-switch v-model="selectedFieldData.editable"></el-switch>
                </el-form-item>
                <el-form-item label="长度范围">
                  <div class="inline-control-row">
                    <el-input-number
                      v-model="selectedFieldData.minLength"
                      :min="0"
                      :max="10000"
                      placeholder="最小长度"
                    ></el-input-number>
                    <el-input-number
                      v-model="selectedFieldData.maxLength"
                      :min="0"
                      :max="10000"
                      placeholder="最大长度"
                    ></el-input-number>
                  </div>
                </el-form-item>
                <el-form-item label="数值范围">
                  <div class="inline-control-row">
                    <el-input-number v-model="selectedFieldData.minValue" placeholder="最小值"></el-input-number>
                    <el-input-number v-model="selectedFieldData.maxValue" placeholder="最大值"></el-input-number>
                  </div>
                </el-form-item>
                <el-form-item label="正则校验">
                  <el-input v-model="selectedFieldData.pattern" placeholder="请输入正则表达式"></el-input>
                </el-form-item>
                <el-form-item label="字段默认值">
                  <el-input v-model="selectedFieldData.defaultValue" placeholder="请输入字段默认值"></el-input>
                </el-form-item>
              </el-form>
            </div>
            <div v-else class="no-selection">请选择一个字段进行配置</div>
          </el-card>
        </div>

        <!-- 右侧生成选项配置 -->
        <div class="option-panel">
          <el-card class="panel-card">
            <template #header>
              <div class="card-header">
                <span>生成选项</span>
              </div>
            </template>

            <el-form :model="MicroAppForm" label-width="120px">
              <el-form-item label="支持新增">
                <el-switch v-model="MicroAppForm.SupportCreate"></el-switch>
              </el-form-item>
              <el-form-item label="支持修改">
                <el-switch v-model="MicroAppForm.SupportUpdate"></el-switch>
              </el-form-item>
              <el-form-item label="支持删除">
                <el-switch v-model="MicroAppForm.SupportDelete"></el-switch>
              </el-form-item>
              <el-form-item label="支持批量删除">
                <el-switch v-model="MicroAppForm.SupportBatchDelete"></el-switch>
              </el-form-item>
              <el-form-item label="支持导入">
                <el-switch v-model="MicroAppForm.SupportImport"></el-switch>
              </el-form-item>
              <el-form-item label="支持导出">
                <el-switch v-model="MicroAppForm.SupportExport"></el-switch>
              </el-form-item>
              <el-form-item label="数据范围">
                <el-select v-model="MicroAppForm.DataScope" placeholder="请选择数据范围">
                  <el-option label="全部数据" value="all"></el-option>
                  <el-option label="本人数据" value="self"></el-option>
                  <el-option label="部门数据" value="department"></el-option>
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="visualConfigVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveVisualConfig">保存配置</el-button>
      </template>
    </el-dialog>

    <!-- 接口文档对话框 -->
    <el-dialog v-model="apiDocVisible" title="接口文档" width="80%" :top="'20vh'" :close-on-click-modal="false">
      <div class="api-doc-container">
        <el-tabs v-model="activeApiTab">
          <el-tab-pane label="接口列表" name="api-list">
            <div class="api-list">
              <el-card v-for="api in generatedApis" :key="api.path" class="api-card">
                <template #header>
                  <div class="api-header">
                    <el-tag :type="api.method === 'GET' ? 'success' : 'primary'" style="margin-right: 10px">
                      {{ api.method }}
                    </el-tag>
                    <span>{{ api.path }}</span>
                    <span style="margin-left: 10px; color: #909399">{{ api.description }}</span>
                  </div>
                </template>
                <div class="api-content">
                  <h4>请求参数</h4>
                  <el-table :data="api.requestParams" size="small" border>
                    <el-table-column label="参数名" prop="name"></el-table-column>
                    <el-table-column label="类型" prop="type"></el-table-column>
                    <el-table-column label="必填" prop="required"></el-table-column>
                    <el-table-column label="说明" prop="description"></el-table-column>
                  </el-table>
                  <h4 style="margin-top: 15px">响应格式</h4>
                  <div class="response-format">
                    <pre>{{ api.responseExample }}</pre>
                  </div>
                </div>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="配置JSON" name="config-json">
            <div class="json-preview">
              <pre>{{ JSON.stringify(MicroAppForm, null, 2) }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="apiDocVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { addMicroAppConfig, deleteMicroAppConfig, getMicroAppConfigs, updateMicroAppConfig } from '@/api/microApp'

export default {
  name: 'MicroApp',
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
  created() {
    this.getMicroApps()
  },
  methods: {
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

      return normalized.map((field) => ({
        label: field.Label || field.label || '',
        fieldName: field.FieldName || field.fieldName || '',
        fieldType: field.FieldType || field.fieldType || 'string',
        required: field.Required !== undefined ? field.Required : field.required !== undefined ? field.required : false,
        showInList:
          field.ShowInList !== undefined ? field.ShowInList : field.showInList !== undefined ? field.showInList : true,
        editable: field.Editable !== undefined ? field.Editable : field.editable !== undefined ? field.editable : true,
        validation: field.Validation || field.validation || '',
        columnWidth: field.ColumnWidth || field.columnWidth || null,
        sortable: field.Sortable !== undefined ? field.Sortable : field.sortable !== undefined ? field.sortable : false,
        fixed: field.Fixed || field.fixed || 'none',
        queryMode: field.QueryMode || field.queryMode || 'none',
        minLength: field.MinLength !== undefined ? field.MinLength : field.minLength || null,
        maxLength: field.MaxLength !== undefined ? field.MaxLength : field.maxLength || null,
        minValue: field.MinValue !== undefined ? field.MinValue : field.minValue || null,
        maxValue: field.MaxValue !== undefined ? field.MaxValue : field.maxValue || null,
        pattern: field.Pattern || field.pattern || '',
        defaultValue: field.DefaultValue || field.defaultValue || '',
        options: this.normalizeFieldOptions(field.Options || field.options || [])
      }))
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
            MicroAppPath: this.MicroAppForm.MicroAppPath || this.MicroAppForm.ModelName
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
        minLength: null,
        maxLength: null,
        minValue: null,
        maxValue: null,
        pattern: '',
        defaultValue: '',
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
    // 处理字段类型变化
    handleFieldTypeChange() {
      // 使用setTimeout避免ResizeObserver循环
      setTimeout(() => {
        // 如果切换到需要选项的类型，确保options数组存在
        if (
          this.selectedFieldData &&
          (this.selectedFieldData.fieldType === 'select' ||
            this.selectedFieldData.fieldType === 'radio' ||
            this.selectedFieldData.fieldType === 'checkbox')
        ) {
          if (!this.selectedFieldData.options) {
            this.selectedFieldData.options = []
          }
        }
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
          Fields: this.MicroAppForm.Fields.map((field) => ({
            Label: field.label,
            FieldName: field.fieldName,
            FieldType: field.fieldType,
            Required: field.required,
            ShowInList: field.showInList,
            Editable: field.editable,
            Validation: field.validation,
            ColumnWidth: field.columnWidth,
            Sortable: field.sortable,
            Fixed: field.fixed || 'none',
            QueryMode: field.queryMode || 'none',
            MinLength: field.minLength,
            MaxLength: field.maxLength,
            MinValue: field.minValue,
            MaxValue: field.maxValue,
            Pattern: field.pattern,
            DefaultValue: field.defaultValue,
            Options: this.normalizeFieldOptions(field.options)
          }))
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
.visual-config-container {
  display: flex;
  height: calc(100vh - 210px);
  gap: 16px;
}

/* 配置面板 */
.config-panel {
  width: 300px;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 属性面板 */
.property-panel {
  flex: 1;
  overflow-y: auto;
  min-width: 500px;
}

/* 选项面板 */
.option-panel {
  width: 350px;
  overflow-y: auto;
}

.panel-card {
  margin-bottom: 16px;
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 字段列表 */
.field-list {
  padding: 10px 0;
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

/* 选项项样式 */
.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: nowrap;
}

/* 添加选项按钮容器样式 */
.add-option-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

/* 确保添加按钮与选项行对齐 */
.add-option-container .el-button {
  margin-left: 0;
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
