<template>
  <div class="esb-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>ESB 服务连接</h1>
          <p>维护外部数据库和 WebApi 服务连接配置。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="loadServiceConnections">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增连接</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="query.keyword"
          class="dt-search"
          clearable
          placeholder="搜索连接编码或名称"
          @clear="loadServiceConnections"
          @keyup.enter="loadServiceConnections"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="dt-filter-tabs">
          <button
            v-for="item in serviceTypeFilters"
            :key="item.value"
            type="button"
            :class="['dt-filter-tab', { 'is-active': query.serviceType === item.value }]"
            @click="setServiceTypeFilter(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>连接列表</strong>
            <span>服务端总数 {{ total }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">本页 {{ serviceConnections.length }}</span>
            <span class="dt-chip dt-chip--success">数据库 {{ connectionStats.database }}</span>
            <span class="dt-chip">WebApi {{ connectionStats.webapi }}</span>
            <span class="dt-chip dt-chip--warning">禁用 {{ connectionStats.disabled }}</span>
          </div>
        </div>

        <el-table
          :data="serviceConnections"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无服务连接"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="Name" label="连接" min-width="220">
            <template #default="{ row }">
              <span class="dt-name-copy">
                <strong>{{ row.Name }}</strong>
                <small>{{ row.Code }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="Code" label="编码" min-width="170">
            <template #default="{ row }">
              <code class="dt-code">{{ row.Code }}</code>
            </template>
          </el-table-column>
          <el-table-column label="服务类型" width="116">
            <template #default="{ row }">
              <span :class="['dt-badge', row.ServiceType === 'database' ? 'dt-badge--success' : 'dt-badge--neutral']">
                {{ getServiceTypeLabel(row.ServiceType) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="数据库类型" width="130">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.DbType ? getDatabaseTypeLabel(row.DbType) : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96">
            <template #default="{ row }">
              <span :class="['dt-badge', normalizeStatus(row) === 1 ? 'dt-badge--success' : 'dt-badge--warning']">
                {{ normalizeStatus(row) === 1 ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ formatDate(row.UpdateTime || row.updateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="132" fixed="right" align="right">
            <template #default="{ row }">
              <div class="dt-operation-buttons esb-actions">
                <el-tooltip content="测试连接" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--add"
                    :icon="Document"
                    :disabled="row.ServiceType !== 'database'"
                    @click="testConnection(row)"
                  />
                </el-tooltip>
                <el-tooltip content="编辑连接" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--edit" :icon="Edit" @click="openEditDialog(row)" />
                </el-tooltip>
                <el-tooltip content="删除连接" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="removeConnection(row)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="dt-pagination"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.pageNum"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog v-model="formDialogVisible" :title="form.ItemId ? '编辑服务连接' : '新增服务连接'" width="760px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <div class="form-grid">
          <el-form-item label="连接编码" prop="Code">
            <el-input v-model="form.Code" placeholder="例如 external_crm"></el-input>
          </el-form-item>
          <el-form-item label="连接名称" prop="Name">
            <el-input v-model="form.Name" placeholder="请输入名称"></el-input>
          </el-form-item>
          <el-form-item label="服务类型">
            <el-select v-model="form.ServiceType">
              <el-option label="数据库" value="database"></el-option>
              <el-option label="WebApi" value="webapi"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.ServiceType === 'database'" label="数据库类型" prop="DbType">
            <el-select v-model="form.DbType" placeholder="请选择数据库类型">
              <el-option
                v-for="dbType in supportedDatabaseTypes"
                :key="dbType"
                :label="getDatabaseTypeLabel(dbType)"
                :value="dbType"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
          <el-form-item label="超时秒数">
            <el-input-number v-model="form.TimeoutSeconds" :min="1" :max="120"></el-input-number>
          </el-form-item>
        </div>

        <el-form-item v-if="form.ServiceType === 'database'" label="连接字符串" prop="ConnectionString">
          <el-input
            v-model="form.ConnectionString"
            type="textarea"
            :rows="4"
            placeholder="请输入数据库连接字符串"
          ></el-input>
        </el-form-item>

        <el-form-item v-if="form.ServiceType === 'webapi'" label="WebApi 配置" prop="WebApiConfig">
          <el-input
            v-model="form.WebApiConfig"
            type="textarea"
            :rows="6"
            placeholder='例如 {"baseUrl":"https://api.example.com","method":"GET"}'
          ></el-input>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.Remark" type="textarea" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="form.ServiceType !== 'database'" :loading="testing" @click="testCurrentForm">
          测试连接
        </el-button>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveConnection">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  addEsbServiceConnection,
  deleteEsbServiceConnection,
  getEsbServiceConnections,
  getEsbSupportedDatabaseTypes,
  testEsbServiceConnection,
  updateEsbServiceConnection
} from '@/api/esb'
import { Delete, Document, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

const createDefaultForm = () => ({
  ItemId: null,
  Code: '',
  Name: '',
  ServiceType: 'database',
  DbType: 'sqlserver',
  ConnectionString: '',
  WebApiConfig: '',
  Status: 1,
  TimeoutSeconds: 30,
  Remark: ''
})

export default {
  name: 'EsbServiceConnections',
  components: {
    Search
  },
  data() {
    return {
      Delete: markRaw(Delete),
      Document: markRaw(Document),
      Edit: markRaw(Edit),
      Plus: markRaw(Plus),
      Refresh: markRaw(Refresh),
      query: {
        keyword: '',
        serviceType: '',
        pageNum: 1,
        pageSize: 10
      },
      serviceTypeFilters: [
        { label: '全部', value: '' },
        { label: '数据库', value: 'database' },
        { label: 'WebApi', value: 'webapi' }
      ],
      serviceConnections: [],
      supportedDatabaseTypes: [],
      total: 0,
      formDialogVisible: false,
      form: createDefaultForm(),
      saving: false,
      testing: false,
      rules: {
        Code: [{ required: true, message: '请输入连接编码', trigger: 'blur' }],
        Name: [{ required: true, message: '请输入连接名称', trigger: 'blur' }],
        DbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
        ConnectionString: [{ required: true, message: '请输入连接字符串', trigger: 'blur' }],
        WebApiConfig: [{ required: true, message: '请输入 WebApi 配置', trigger: 'blur' }]
      }
    }
  },
  computed: {
    connectionStats() {
      return this.serviceConnections.reduce(
        (stats, row) => {
          if (row.ServiceType === 'webapi') {
            stats.webapi += 1
          } else {
            stats.database += 1
          }
          if (this.normalizeStatus(row) !== 1) stats.disabled += 1
          return stats
        },
        { database: 0, webapi: 0, disabled: 0 }
      )
    }
  },
  created() {
    this.initializePage()
  },
  methods: {
    async initializePage() {
      await Promise.all([this.loadSupportedDatabaseTypes(), this.loadServiceConnections()])
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
        CreateTime: row.CreateTime || row.createTime || null,
        UpdateTime: row.UpdateTime || row.updateTime || null
      }
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? '-' : this.$filters.dateFormat(value)
    },
    async loadSupportedDatabaseTypes() {
      const { data: res } = await getEsbSupportedDatabaseTypes()
      if (res?.success) {
        this.supportedDatabaseTypes = res.data || []
      }
    },
    async loadServiceConnections() {
      const { data: res } = await getEsbServiceConnections({
        keyword: this.query.keyword,
        serviceType: this.query.serviceType,
        pageNum: this.query.pageNum,
        pageSize: this.query.pageSize
      })
      if (res?.success) {
        this.serviceConnections = (res.data || []).map((item) => this.normalizeConnection(item))
        this.total = res.total || 0
      } else {
        this.$message.error(res?.msg || '获取 ESB 服务连接失败')
      }
    },
    getServiceTypeLabel(serviceType) {
      return serviceType === 'webapi' ? 'WebApi' : '数据库'
    },
    getDatabaseTypeLabel(dbType) {
      const labels = {
        sqlserver: 'SQL Server',
        mysql: 'MySQL',
        postgresql: 'PostgreSQL',
        oracle: 'Oracle'
      }
      return labels[dbType] || dbType
    },
    handleSizeChange(size) {
      this.query.pageSize = size
      this.query.pageNum = 1
      this.loadServiceConnections()
    },
    handleCurrentChange(page) {
      this.query.pageNum = page
      this.loadServiceConnections()
    },
    setServiceTypeFilter(value) {
      this.query.serviceType = value
      this.query.pageNum = 1
      this.loadServiceConnections()
    },
    openCreateDialog() {
      this.form = createDefaultForm()
      this.formDialogVisible = true
    },
    openEditDialog(row) {
      this.form = this.normalizeConnection(row)
      this.formDialogVisible = true
    },
    buildSubmitData() {
      return {
        ...this.form,
        DbType: this.form.ServiceType === 'database' ? this.form.DbType : null,
        ConnectionString: this.form.ServiceType === 'database' ? this.form.ConnectionString : null,
        WebApiConfig: this.form.ServiceType === 'webapi' ? this.form.WebApiConfig : null
      }
    },
    saveConnection() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        this.saving = true
        try {
          const submitData = this.buildSubmitData()
          const { data: res } = submitData.ItemId
            ? await updateEsbServiceConnection(submitData)
            : await addEsbServiceConnection(submitData)
          if (res?.success) {
            this.$message.success(res.msg || '保存成功')
            this.formDialogVisible = false
            await this.loadServiceConnections()
          } else {
            this.$message.error(res?.msg || '保存失败')
          }
        } finally {
          this.saving = false
        }
      })
    },
    removeConnection(row) {
      this.$confirm('确认删除该 ESB 服务连接？', '提示', { type: 'warning' })
        .then(async () => {
          const { data: res } = await deleteEsbServiceConnection(row.ItemId || row.itemId)
          if (res?.success) {
            this.$message.success(res.msg || '删除成功')
            await this.loadServiceConnections()
          } else {
            this.$message.error(res?.msg || '删除失败')
          }
        })
        .catch(() => {})
    },
    async testConnection(row) {
      this.testing = true
      try {
        const { data: res } = await testEsbServiceConnection({ ItemId: row.ItemId })
        if (res?.success) {
          this.$message.success(res.msg || '连接成功')
        } else {
          this.$message.error(res?.msg || '连接失败')
        }
      } finally {
        this.testing = false
      }
    },
    testCurrentForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        this.testing = true
        try {
          const { data: res } = await testEsbServiceConnection({
            ...this.buildSubmitData(),
            ItemId: null
          })
          if (res?.success) {
            this.$message.success(res.msg || '连接成功')
          } else {
            this.$message.error(res?.msg || '连接失败')
          }
        } finally {
          this.testing = false
        }
      })
    }
  }
}
</script>

<style scoped>
.esb-container {
  height: 100%;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.esb-actions {
  min-width: 108px;
  display: grid;
  grid-template-columns: repeat(3, 30px);
  justify-content: end;
  gap: 9px;
}

.esb-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
