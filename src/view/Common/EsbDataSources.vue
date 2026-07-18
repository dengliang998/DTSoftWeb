<template>
  <div class="esb-container">
    <el-card class="esb-card">
      <template #header>
        <div class="card-header">
          <span>ESB 数据源</span>
          <div class="header-actions">
            <el-input
              v-model="query.keyword"
              class="keyword-input"
              clearable
              placeholder="搜索编码或名称"
              @clear="loadDataSources"
              @keyup.enter="loadDataSources"
            >
              <template #append>
                <el-button icon="Search" @click="loadDataSources"></el-button>
              </template>
            </el-input>
            <el-select
              v-model="query.connectionId"
              class="connection-filter"
              placeholder="服务连接"
              clearable
              @change="loadDataSources"
            >
              <el-option
                v-for="connection in databaseConnectionOptions"
                :key="connection.ItemId"
                :label="connection.Name"
                :value="connection.ItemId"
              ></el-option>
            </el-select>
            <el-button type="primary" icon="Plus" @click="openCreateDialog">新增数据源</el-button>
          </div>
        </div>
      </template>

      <div class="table-container">
        <el-table :data="dataSources" border stripe class="table-wrapper">
          <el-table-column type="index" label="序号" width="70"></el-table-column>
          <el-table-column prop="Code" label="编码" min-width="150"></el-table-column>
          <el-table-column prop="Name" label="名称" min-width="150"></el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">
              <el-tag effect="plain">{{ row.SourceType || row.sourceType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="服务连接" min-width="150">
            <template #default="{ row }">{{ row.ConnectionName || getConnectionName(row.ConnectionId) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="normalizeStatus(row) === 1 ? 'success' : 'danger'">
                {{ normalizeStatus(row) === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ formatDate(row.UpdateTime || row.updateTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <div class="operation-buttons">
                <el-button type="primary" size="small" icon="Edit" @click="openEditDialog(row)"></el-button>
                <el-button type="success" size="small" icon="Document" @click="openTestDialog(row)"></el-button>
                <el-button type="danger" size="small" icon="Delete" @click="removeDataSource(row)"></el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.pageNum"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <el-dialog v-model="formDialogVisible" :title="form.ItemId ? '编辑数据源' : '新增数据源'" width="860px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="form-grid">
          <el-form-item label="数据源编码" prop="Code">
            <el-input v-model="form.Code" placeholder="例如 customer_options"></el-input>
          </el-form-item>
          <el-form-item label="数据源名称" prop="Name">
            <el-input v-model="form.Name" placeholder="请输入名称"></el-input>
          </el-form-item>
          <el-form-item label="数据源类型">
            <el-select v-model="form.SourceType" disabled>
              <el-option label="SQL" value="sql"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="服务连接" prop="ConnectionId">
            <el-select v-model="form.ConnectionId" filterable placeholder="请选择服务连接">
              <el-option
                v-for="connection in databaseConnectionOptions"
                :key="connection.ItemId"
                :label="connection.Name"
                :value="connection.ItemId"
              >
                <span>{{ connection.Name }}</span>
                <span class="connection-option-extra">{{ connection.DbType }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="最大行数">
            <el-input-number v-model="form.MaxRows" :min="1" :max="1000"></el-input-number>
          </el-form-item>
          <el-form-item label="超时秒数">
            <el-input-number v-model="form.TimeoutSeconds" :min="1" :max="120"></el-input-number>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </div>

        <el-form-item label="SQL" prop="SqlText">
          <el-input
            v-model="form.SqlText"
            type="textarea"
            :rows="8"
            placeholder="仅支持单条 SELECT 查询，参数使用 @paramName"
          ></el-input>
        </el-form-item>

        <el-form-item label="参数">
          <div class="parameter-editor">
            <div v-for="(parameter, index) in form.Parameters" :key="index" class="parameter-row">
              <el-input v-model="parameter.Name" placeholder="参数名"></el-input>
              <el-input v-model="parameter.Label" placeholder="显示名"></el-input>
              <el-select v-model="parameter.Type">
                <el-option label="文本" value="string"></el-option>
                <el-option label="数字" value="number"></el-option>
                <el-option label="布尔" value="boolean"></el-option>
                <el-option label="日期时间" value="datetime"></el-option>
              </el-select>
              <el-switch v-model="parameter.Required" active-text="必填"></el-switch>
              <el-input v-model="parameter.DefaultValue" placeholder="默认值"></el-input>
              <el-button type="danger" icon="Delete" @click="removeParameter(index)"></el-button>
            </div>
            <el-button icon="Plus" @click="addParameter">添加参数</el-button>
          </div>
        </el-form-item>

        <el-form-item label="返回映射">
          <div class="mapping-row">
            <el-input v-model="form.ResultMapping.LabelField" placeholder="label 字段"></el-input>
            <el-input v-model="form.ResultMapping.ValueField" placeholder="value 字段"></el-input>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.Remark" type="textarea" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveDataSource">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" title="测试执行" width="760px">
      <el-form label-width="100px">
        <el-form-item
          v-for="parameter in testParameters"
          :key="parameter.Name"
          :label="parameter.Label || parameter.Name"
        >
          <el-input v-model="testForm[parameter.Name]" :placeholder="parameter.Name"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="primary" :loading="testing" @click="executeTest">执行测试</el-button>
      <pre class="test-result">{{ testResult }}</pre>
    </el-dialog>
  </div>
</template>

<script>
import {
  addEsbDataSource,
  deleteEsbDataSource,
  executeEsbDataSource,
  getEsbDataSources,
  getEsbServiceConnectionOptions,
  updateEsbDataSource
} from '@/api/esb'

const createDefaultForm = () => ({
  ItemId: null,
  Code: '',
  Name: '',
  ConnectionId: 0,
  SourceType: 'sql',
  ExecuteMode: 'query',
  SqlText: '',
  Parameters: [],
  ResultMapping: {
    LabelField: '',
    ValueField: ''
  },
  Status: 1,
  MaxRows: 500,
  TimeoutSeconds: 30,
  Remark: ''
})

export default {
  name: 'EsbDataSources',
  data() {
    return {
      query: {
        keyword: '',
        connectionId: null,
        pageNum: 1,
        pageSize: 10
      },
      dataSources: [],
      connectionOptions: [],
      total: 0,
      formDialogVisible: false,
      testDialogVisible: false,
      form: createDefaultForm(),
      saving: false,
      testing: false,
      currentTestDataSource: null,
      testParameters: [],
      testForm: {},
      testResult: '',
      rules: {
        Code: [{ required: true, message: '请输入数据源编码', trigger: 'blur' }],
        Name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
        ConnectionId: [{ required: true, message: '请选择服务连接', trigger: 'change' }],
        SqlText: [{ required: true, message: '请输入 SQL', trigger: 'blur' }]
      }
    }
  },
  computed: {
    databaseConnectionOptions() {
      return this.connectionOptions.filter((item) => item.ServiceType === 'database')
    }
  },
  created() {
    this.initializePage()
  },
  methods: {
    async initializePage() {
      await this.loadConnectionOptions()
      await this.loadDataSources()
    },
    normalizeStatus(row) {
      return row.Status !== undefined ? row.Status : row.status
    },
    normalizeConnection(row) {
      return {
        ItemId: row.ItemId ?? row.itemId ?? 0,
        Code: row.Code || row.code || '',
        Name: row.Name || row.name || '',
        ServiceType: row.ServiceType || row.serviceType || 'database',
        DbType: row.DbType || row.dbType || '',
        ConnectionString: row.ConnectionString || row.connectionString || '',
        WebApiConfig: row.WebApiConfig || row.webApiConfig || '',
        Status: row.Status !== undefined ? row.Status : row.status !== undefined ? row.status : 1,
        TimeoutSeconds: row.TimeoutSeconds || row.timeoutSeconds || 30,
        Remark: row.Remark || row.remark || '',
        IsDefault: row.IsDefault !== undefined ? row.IsDefault : row.isDefault || false,
        UpdateTime: row.UpdateTime || row.updateTime || null
      }
    },
    normalizeRow(row) {
      return {
        ItemId: row.ItemId || row.itemId || null,
        Code: row.Code || row.code || '',
        Name: row.Name || row.name || '',
        ConnectionId: row.ConnectionId ?? row.connectionId ?? 0,
        ConnectionName: row.ConnectionName || row.connectionName || '',
        SourceType: row.SourceType || row.sourceType || 'sql',
        ExecuteMode: row.ExecuteMode || row.executeMode || 'query',
        SqlText: row.SqlText || row.sqlText || '',
        Parameters: this.normalizeParameters(row.Parameters || row.parameters || []),
        ResultMapping: row.ResultMapping || row.resultMapping || { LabelField: '', ValueField: '' },
        Status: row.Status !== undefined ? row.Status : row.status !== undefined ? row.status : 1,
        MaxRows: row.MaxRows || row.maxRows || 500,
        TimeoutSeconds: row.TimeoutSeconds || row.timeoutSeconds || 30,
        Remark: row.Remark || row.remark || '',
        CreateTime: row.CreateTime || row.createTime || null,
        UpdateTime: row.UpdateTime || row.updateTime || null
      }
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? '-' : this.$filters.dateFormat(value)
    },
    normalizeParameters(parameters) {
      if (!Array.isArray(parameters)) return []
      return parameters.map((item) => ({
        Name: item.Name || item.name || '',
        Label: item.Label || item.label || '',
        Type: item.Type || item.type || 'string',
        Required: item.Required !== undefined ? item.Required : item.required || false,
        DefaultValue: item.DefaultValue ?? item.defaultValue ?? ''
      }))
    },
    async loadDataSources() {
      const { data: res } = await getEsbDataSources({
        keyword: this.query.keyword,
        connectionId: this.query.connectionId,
        pageNum: this.query.pageNum,
        pageSize: this.query.pageSize
      })
      if (res?.success) {
        this.dataSources = (res.data || []).map((item) => this.normalizeRow(item))
        this.total = res.total || 0
      } else {
        this.$message.error(res?.msg || '获取 ESB 数据源失败')
      }
    },
    async loadConnectionOptions() {
      const { data: res } = await getEsbServiceConnectionOptions()
      if (res?.success) {
        this.connectionOptions = (res.data || []).map((item) => this.normalizeConnection(item))
      } else {
        this.$message.error(res?.msg || '获取 ESB 服务连接失败')
      }
    },
    getConnectionName(connectionId) {
      const value = connectionId ?? 0
      const connection = this.connectionOptions.find((item) => item.ItemId === value)
      return connection?.Name || '默认系统库'
    },
    handleSizeChange(size) {
      this.query.pageSize = size
      this.query.pageNum = 1
      this.loadDataSources()
    },
    handleCurrentChange(page) {
      this.query.pageNum = page
      this.loadDataSources()
    },
    openCreateDialog() {
      this.form = createDefaultForm()
      this.formDialogVisible = true
    },
    openEditDialog(row) {
      this.form = this.normalizeRow(row)
      this.formDialogVisible = true
    },
    addParameter() {
      this.form.Parameters.push({
        Name: '',
        Label: '',
        Type: 'string',
        Required: false,
        DefaultValue: ''
      })
    },
    removeParameter(index) {
      this.form.Parameters.splice(index, 1)
    },
    buildSubmitData() {
      return {
        ...this.form,
        ConnectionId: this.form.ConnectionId === 0 ? null : this.form.ConnectionId,
        Parameters: this.form.Parameters.filter((item) => item.Name).map((item) => ({
          Name: item.Name,
          Label: item.Label,
          Type: item.Type,
          Required: item.Required,
          DefaultValue: item.DefaultValue === '' ? null : item.DefaultValue
        })),
        ResultMapping: {
          LabelField: this.form.ResultMapping?.LabelField || '',
          ValueField: this.form.ResultMapping?.ValueField || ''
        }
      }
    },
    saveDataSource() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        this.saving = true
        try {
          const submitData = this.buildSubmitData()
          const { data: res } = submitData.ItemId
            ? await updateEsbDataSource(submitData)
            : await addEsbDataSource(submitData)
          if (res?.success) {
            this.$message.success(res.msg || '保存成功')
            this.formDialogVisible = false
            await this.loadDataSources()
          } else {
            this.$message.error(res?.msg || '保存失败')
          }
        } catch (error) {
          const msg =
            error.response?.data?.msg ||
            error.response?.data?.message ||
            error.response?.data?.title ||
            error.message ||
            '保存失败'
          this.$message.error(msg)
        } finally {
          this.saving = false
        }
      })
    },
    removeDataSource(row) {
      this.$confirm('确认删除该 ESB 数据源？', '提示', { type: 'warning' })
        .then(async () => {
          const { data: res } = await deleteEsbDataSource(row.ItemId || row.itemId)
          if (res?.success) {
            this.$message.success(res.msg || '删除成功')
            await this.loadDataSources()
          } else {
            this.$message.error(res?.msg || '删除失败')
          }
        })
        .catch(() => {})
    },
    openTestDialog(row) {
      const dataSource = this.normalizeRow(row)
      this.currentTestDataSource = dataSource
      this.testParameters = dataSource.Parameters
      this.testForm = {}
      this.testParameters.forEach((item) => {
        this.testForm[item.Name] = item.DefaultValue || ''
      })
      this.testResult = ''
      this.testDialogVisible = true
    },
    async executeTest() {
      if (!this.currentTestDataSource) return
      this.testing = true
      try {
        const { data: res } = await executeEsbDataSource({
          code: this.currentTestDataSource.Code,
          parameters: this.testForm
        })
        this.testResult = JSON.stringify(res, null, 2)
      } finally {
        this.testing = false
      }
    }
  }
}
</script>

<style scoped>
.esb-container {
  height: 100%;
}

.esb-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.esb-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.card-header,
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.keyword-input {
  width: 280px;
}

.connection-filter {
  width: 180px;
}

.connection-option-extra {
  float: right;
  margin-left: 16px;
  color: #909399;
  font-size: 12px;
}

.table-wrapper {
  height: 100%;
}

.table-container {
  flex: 1;
  min-height: 0;
  margin-top: 4px;
  overflow: auto;
}

.pagination-container {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.parameter-editor {
  display: grid;
  gap: 10px;
  width: 100%;
}

.parameter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px 110px 1fr 44px;
  gap: 8px;
  align-items: center;
}

.mapping-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.test-result {
  min-height: 220px;
  max-height: 360px;
  margin: 14px 0 0;
  padding: 12px;
  overflow: auto;
  color: #1f2937;
  background: #f8fafc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}
</style>
