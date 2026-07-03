<template>
  <div class="crud-config-container">
    <!-- 配置列表卡片 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20" style="margin-bottom: 15px">
        <el-col :span="6">
          <el-input v-model="queryInfo.query" clearable placeholder="请输入配置名称" @clear="getDynamicApps">
            <template #append>
              <el-button icon="Search" @click="getDynamicApps"></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="addDynamicApp">创建动态API配置</el-button>
        </el-col>
      </el-row>

      <!-- 配置列表 -->
      <el-table
        :data="DynamicAppList"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        border
        stripe
        class="table-wrapper"
      >
        <el-table-column type="index" label="序号" width="80"></el-table-column>
        <el-table-column label="配置名称" prop="ConfigName"></el-table-column>
        <el-table-column label="数据模型" prop="ModelName"></el-table-column>
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
              <el-button type="primary" size="small" icon="Edit" @click="editDynamicApp(scope.row)"></el-button>
              <el-button type="primary" size="small" icon="Setting" @click="visualConfig(scope.row)"></el-button>
              <el-button type="success" size="small" icon="Document" @click="generateApiDoc(scope.row)"></el-button>
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click="deleteDynamicApp(scope.row.ItemId)"
              ></el-button>
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
      <el-form ref="DynamicAppFormRef" :model="DynamicAppForm" :rules="rules" label-width="100px">
        <el-form-item label="配置名称" prop="ConfigName">
          <el-input v-model="DynamicAppForm.ConfigName" placeholder="请输入配置名称"></el-input>
        </el-form-item>
        <el-form-item label="数据模型" prop="ModelName">
          <el-input v-model="DynamicAppForm.ModelName" placeholder="请输入数据模型名称（英文）"></el-input>
        </el-form-item>
        <el-form-item label="配置描述" prop="configDesc">
          <el-input
            v-model="DynamicAppForm.configDesc"
            type="textarea"
            placeholder="请输入配置描述"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="DynamicAppForm.Status" :active-value="1" :inactive-value="0"></el-switch>
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
                :data="DynamicAppForm.Fields"
                :props="{ label: 'label', children: 'children' }"
                node-key="fieldName"
                :expand-on-click-node="false"
                :current-node-key="selectedFieldKey"
                :default-expanded-keys="expandedKeys"
                @node-click="selectField"
              >
                <template #default="{ node, data }">
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
                <el-form-item label="是否可编辑">
                  <el-switch v-model="selectedFieldData.editable"></el-switch>
                </el-form-item>
                <el-form-item label="字段验证规则">
                  <el-input
                    v-model="selectedFieldData.validation"
                    type="textarea"
                    placeholder="请输入验证规则，JSON格式"
                    :rows="3"
                  ></el-input>
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

            <el-form :model="DynamicAppForm" label-width="120px">
              <el-form-item label="支持新增">
                <el-switch v-model="DynamicAppForm.SupportCreate"></el-switch>
              </el-form-item>
              <el-form-item label="支持修改">
                <el-switch v-model="DynamicAppForm.SupportUpdate"></el-switch>
              </el-form-item>
              <el-form-item label="支持删除">
                <el-switch v-model="DynamicAppForm.SupportDelete"></el-switch>
              </el-form-item>
              <el-form-item label="支持导入">
                <el-switch v-model="DynamicAppForm.SupportImport"></el-switch>
              </el-form-item>
              <el-form-item label="支持导出">
                <el-switch v-model="DynamicAppForm.SupportExport"></el-switch>
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
              <pre>{{ JSON.stringify(DynamicAppForm, null, 2) }}</pre>
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
import axios from '@/api/http'

export default {
  name: 'DynamicApp',
  data() {
    return {
      // 查询条件
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 10
      },
      // CRUD配置列表
      DynamicAppList: [],
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
      // CRUD配置表单
      DynamicAppForm: {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportImport: false,
        SupportExport: false,
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
        ]
      }
    }
  },
  created() {
    this.getDynamicApps()
  },
  methods: {
    // 获取动态API配置列表
    async getDynamicApps() {
      try {
        const params = {
          PageNum: this.queryInfo.pagenum,
          PageSize: this.queryInfo.pagesize
        }
        // 只有当 query 不为空时才添加 Keyword 参数
        if (this.queryInfo.query) {
          params.Keyword = this.queryInfo.query
        }
        const { data: res } = await axios.get('/api/DynamicApp/GetDynamicAppConfigs', { params })
        if (res.success) {
          // 确保返回的数据中ApiPrefix和configDesc字段不会是null，而是空字符串
          this.DynamicAppList = res.data.map((item) => ({
            ...item,
            ApiPrefix: item.ApiPrefix || '',
            configDesc: item.configDesc || ''
          }))
          this.total = res.total
        } else {
          this.$message.error(res.msg || '获取动态API配置列表失败')
        }
      } catch (error) {
        this.$message.error('获取动态API配置列表失败：' + error.message)
      }
    },
    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getDynamicApps()
    },
    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getDynamicApps()
    },
    // 添加动态API配置
    addDynamicApp() {
      this.dialogTitle = '添加动态API配置'
      this.DynamicAppForm = {
        ItemId: '',
        ConfigName: '',
        ModelName: '',
        configDesc: '',
        Status: 1,
        SupportCreate: true,
        SupportUpdate: true,
        SupportDelete: true,
        SupportImport: false,
        SupportExport: false,
        ApiPrefix: '',
        Fields: []
      }
      this.dialogVisible = true
    },
    // 编辑动态API配置
    editDynamicApp(row) {
      this.dialogTitle = '编辑动态API配置'
      // 确保ApiPrefix和configDesc字段不会是null，而是空字符串
      this.DynamicAppForm = {
        ...row,
        ApiPrefix: row.ApiPrefix || '',
        configDesc: row.configDesc || ''
      }
      this.dialogVisible = true
    },
    // 删除动态API配置
    deleteDynamicApp(ItemId) {
      this.$confirm('确定要删除该动态API配置吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const { data: res } = await axios.post('/api/DynamicApp/DeleteDynamicAppConfig', { ItemId })
            if (res.success) {
              this.$message.success(res.msg || '删除成功')
              this.getDynamicApps()
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
      this.$refs.DynamicAppFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          let res
          if (this.DynamicAppForm.ItemId) {
            res = await axios.post('/api/DynamicApp/UpdateDynamicAppConfig', this.DynamicAppForm)
          } else {
            res = await axios.post('/api/DynamicApp/AddDynamicAppConfig', this.DynamicAppForm)
          }
          if (res.data.success) {
            this.$message.success(res.data.msg || (this.DynamicAppForm.id ? '更新成功' : '添加成功'))
            this.dialogVisible = false
            this.getDynamicApps()
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

      // 确保 ApiPrefix 和 configDesc 字段不会是 null,而是空字符串
      let fields = row.Fields || []

      // 如果 Fields 是字符串,解析为数组
      if (typeof fields === 'string') {
        try {
          fields = JSON.parse(fields)
          console.log('解析后的 Fields:', fields)
        } catch (e) {
          console.error('Fields 解析失败:', e)
          fields = []
        }
      }

      // 确保 Fields 是数组
      if (!Array.isArray(fields)) {
        console.warn('Fields 不是数组,重置为空数组')
        fields = []
      }

      // 将大驼峰命名转换为小驼峰命名
      fields = fields.map((field) => ({
        label: field.Label || field.label || '',
        fieldName: field.FieldName || field.fieldName || '',
        fieldType: field.FieldType || field.fieldType || 'string',
        required: field.Required !== undefined ? field.Required : field.required !== undefined ? field.required : false,
        showInList:
          field.ShowInList !== undefined ? field.ShowInList : field.showInList !== undefined ? field.showInList : true,
        editable: field.Editable !== undefined ? field.Editable : field.editable !== undefined ? field.editable : true,
        validation: field.Validation || field.validation || '',
        defaultValue: field.DefaultValue || field.defaultValue || '',
        options: field.Options || field.options || []
      }))

      console.log('转换后的 Fields:', fields)

      this.DynamicAppForm = {
        ...row,
        ApiPrefix: row.ApiPrefix || '',
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields
      }

      console.log('DynamicAppForm.Fields:', this.DynamicAppForm.Fields)

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
        defaultValue: '',
        options: []
      }
      this.DynamicAppForm.Fields.push(newField)
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
      const index = this.DynamicAppForm.Fields.findIndex((item) => item.fieldName === fieldName)
      if (index > -1) {
        this.DynamicAppForm.Fields.splice(index, 1)
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
          ...this.DynamicAppForm,
          ConfigName: this.DynamicAppForm.ConfigName,
          ModelName: this.DynamicAppForm.ModelName,
          ConfigDesc: this.DynamicAppForm.configDesc || this.DynamicAppForm.ConfigDesc,
          Fields: this.DynamicAppForm.Fields.map((field) => ({
            Label: field.label,
            FieldName: field.fieldName,
            FieldType: field.fieldType,
            Required: field.required,
            ShowInList: field.showInList,
            Editable: field.editable,
            Validation: field.validation,
            DefaultValue: field.defaultValue,
            Options: field.options
          }))
        }

        console.log('提交的数据:', submitData)

        const res = await axios.post('/api/DynamicApp/UpdateDynamicAppConfig', submitData)
        if (res.data.success) {
          this.$message.success(res.data.msg || '保存成功')
          this.visualConfigVisible = false
          this.getDynamicApps()
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

      // 确保ApiPrefix和configDesc字段不会是null，而是空字符串
      let fields = row.Fields || []

      // 如果 Fields 是字符串，解析为数组
      if (typeof fields === 'string') {
        try {
          fields = JSON.parse(fields)
          console.log('解析后的 Fields:', fields)
        } catch (e) {
          console.error('Fields 解析失败:', e)
          fields = []
        }
      }

      // 确保 Fields 是数组
      if (!Array.isArray(fields)) {
        console.warn('Fields 不是数组，重置为空数组')
        fields = []
      }

      // 将大驼峰命名转换为小驼峰命名
      fields = fields.map((field) => ({
        label: field.Label || field.label || '',
        fieldName: field.FieldName || field.fieldName || '',
        fieldType: field.FieldType || field.fieldType || 'string',
        required: field.Required !== undefined ? field.Required : field.required !== undefined ? field.required : false,
        showInList:
          field.ShowInList !== undefined ? field.ShowInList : field.showInList !== undefined ? field.showInList : true,
        editable: field.Editable !== undefined ? field.Editable : field.editable !== undefined ? field.editable : true,
        validation: field.Validation || field.validation || '',
        defaultValue: field.DefaultValue || field.defaultValue || '',
        options: field.Options || field.options || []
      }))

      console.log('转换后的 Fields:', fields)

      this.DynamicAppForm = {
        ...row,
        ApiPrefix: row.ApiPrefix || '',
        configDesc: row.ConfigDesc || row.configDesc || '',
        Fields: fields
      }

      console.log('DynamicAppForm.Fields:', this.DynamicAppForm.Fields)

      this.generateApis()
      this.apiDocVisible = true
    },
    // 生成API列表
    generateApis() {
      const { ModelName, Fields, SupportCreate, SupportUpdate, SupportDelete } = this.DynamicAppForm
      const basePath = `/api/${ModelName.toLowerCase()}`

      this.generatedApis = []

      // 确保Fields是数组
      const fields = Array.isArray(Fields) ? Fields : []

      // 查询列表接口
      this.generatedApis.push({
        method: 'GET',
        path: `${basePath}`,
        description: '获取' + this.DynamicAppForm.ConfigName + '列表',
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
        description: '获取' + this.DynamicAppForm.ConfigName + '详情',
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
          description: '添加' + this.DynamicAppForm.ConfigName,
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
          description: '更新' + this.DynamicAppForm.ConfigName,
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
          description: '删除' + this.DynamicAppForm.ConfigName,
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
