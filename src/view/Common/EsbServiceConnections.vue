<template>
  <div class="esb-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('esb.serviceTitle') }}</h1>
          <p>{{ $t('esb.serviceSubtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="loadServiceConnections">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">{{ $t('esb.addConnection') }}</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="query.keyword"
          class="dt-search"
          clearable
          :placeholder="$t('esb.connectionSearchPlaceholder')"
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
            <strong>{{ $t('esb.connectionList') }}</strong>
            <span>{{ $t('esb.serverTotal', { total }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('esb.currentPage', { count: serviceConnections.length }) }}</span>
            <span class="dt-chip dt-chip--success">
              {{ $t('esb.databaseCount', { count: connectionStats.database }) }}
            </span>
            <span class="dt-chip">RESTful {{ connectionStats.webapi }}</span>
            <span class="dt-chip dt-chip--warning">
              {{ $t('organization.disabledCount', { count: connectionStats.disabled }) }}
            </span>
          </div>
        </div>

        <el-table
          :data="serviceConnections"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          :empty-text="$t('esb.emptyConnections')"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ItemId" :label="$t('esb.connectionId')" width="190">
            <template #default="{ row }">
              <code class="dt-code">{{ row.ItemId || row.itemId || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="Name" :label="$t('esb.connection')" min-width="220">
            <template #default="{ row }">
              <strong>{{ row.Name }}</strong>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.serviceType')" width="116">
            <template #default="{ row }">
              <span :class="['dt-badge', row.ServiceType === 'database' ? 'dt-badge--success' : 'dt-badge--neutral']">
                {{ getServiceTypeLabel(row.ServiceType) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.databaseType')" width="130">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.DbType ? getDatabaseTypeLabel(row.DbType) : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="96">
            <template #default="{ row }">
              <span :class="['dt-badge', normalizeStatus(row) === 1 ? 'dt-badge--success' : 'dt-badge--warning']">
                {{ normalizeStatus(row) === 1 ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.updateTime')" width="180">
            <template #default="{ row }">
              <code class="dt-code">{{ formatDate(row.UpdateTime || row.updateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="132" fixed="right" align="right">
            <template #default="{ row }">
              <div class="dt-operation-buttons esb-actions">
                <el-tooltip :content="$t('esb.testConnection')" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--add"
                    :icon="Document"
                    :disabled="!['database', 'restful'].includes(row.ServiceType)"
                    @click="testConnection(row)"
                  />
                </el-tooltip>
                <el-tooltip :content="$t('esb.editConnectionAction')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--edit" :icon="Edit" @click="openEditDialog(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('esb.deleteConnection')" placement="top">
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

    <el-dialog
      v-model="formDialogVisible"
      :title="form.ItemId ? $t('esb.editConnection') : $t('esb.addServiceConnection')"
      class="esb-service-dialog"
      width="min(920px, calc(100vw - 32px))"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item :label="$t('esb.connectionName')" prop="Name">
            <el-input v-model="form.Name" :placeholder="$t('esb.namePlaceholder')"></el-input>
          </el-form-item>
          <el-form-item :label="$t('esb.serviceType')">
            <el-select v-model="form.ServiceType" @change="handleServiceTypeChange">
              <el-option :label="$t('welcome.overview.database')" value="database"></el-option>
              <el-option label="RESTful" value="restful"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.ServiceType === 'database'" :label="$t('esb.databaseType')" prop="DbType">
            <el-select v-model="form.DbType" :placeholder="$t('esb.selectDatabaseType')" @change="handleDbTypeChange">
              <el-option
                v-for="dbType in supportedDatabaseTypes"
                :key="dbType"
                :label="getDatabaseTypeLabel(dbType)"
                :value="dbType"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.status')">
            <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
          <el-form-item :label="$t('esb.timeoutSeconds')">
            <el-input-number v-model="form.TimeoutSeconds" :min="1" :max="120"></el-input-number>
          </el-form-item>
        </div>

        <el-form-item
          v-if="form.ServiceType === 'database'"
          :label="$t('esb.connectionString')"
          prop="ConnectionString"
        >
          <el-input
            v-model="form.ConnectionString"
            type="textarea"
            :rows="4"
            :placeholder="$t('esb.connectionStringPlaceholder')"
          ></el-input>
        </el-form-item>

        <template v-if="form.ServiceType === 'restful'">
          <el-tabs v-model="webApiActiveTab" class="webapi-tabs">
            <el-tab-pane :label="$t('esb.basicConfig')" name="basic">
              <div class="form-grid">
                <el-form-item :label="$t('esb.baseUrl')">
                  <el-input
                    v-model="form.WebApiConfigData.BaseUrl"
                    :placeholder="$t('esb.baseUrlPlaceholder')"
                  ></el-input>
                </el-form-item>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="$t('esb.authConfig')" name="auth">
              <div class="form-grid">
                <el-form-item :label="$t('esb.authType')">
                  <el-select v-model="form.WebApiConfigData.AuthType">
                    <el-option :label="$t('esb.none')" value="none"></el-option>
                    <el-option label="Bearer Token" value="bearer"></el-option>
                    <el-option label="API Key" value="apikey"></el-option>
                  </el-select>
                </el-form-item>
              </div>

              <template v-if="form.WebApiConfigData.AuthType === 'bearer'">
                <div class="form-grid">
                  <el-form-item :label="$t('esb.tokenUrl')">
                    <el-input
                      v-model="form.WebApiConfigData.TokenUrl"
                      :placeholder="$t('esb.tokenUrlPlaceholder')"
                    ></el-input>
                  </el-form-item>
                  <el-form-item :label="$t('esb.httpMethod')">
                    <el-select v-model="form.WebApiConfigData.TokenMethod">
                      <el-option label="GET" value="GET"></el-option>
                      <el-option label="POST" value="POST"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="$t('esb.tokenPath')">
                    <el-input
                      v-model="form.WebApiConfigData.TokenPath"
                      :placeholder="$t('esb.tokenPathPlaceholder')"
                    ></el-input>
                  </el-form-item>
                  <el-form-item :label="$t('esb.tokenExpiresInPath')">
                    <el-input
                      v-model="form.WebApiConfigData.TokenExpiresInPath"
                      :placeholder="$t('esb.tokenExpiresInPathPlaceholder')"
                    ></el-input>
                  </el-form-item>
                  <el-form-item :label="$t('esb.tokenExpiresAtPath')">
                    <el-input
                      v-model="form.WebApiConfigData.TokenExpiresAtPath"
                      :placeholder="$t('esb.tokenExpiresAtPathPlaceholder')"
                    ></el-input>
                  </el-form-item>
                  <el-form-item :label="$t('esb.tokenRefreshSkewSeconds')">
                    <el-input-number
                      v-model="form.WebApiConfigData.TokenRefreshSkewSeconds"
                      :min="0"
                      :max="3600"
                    ></el-input-number>
                  </el-form-item>
                </div>

                <el-form-item :label="$t('esb.tokenHeaders')">
                  <div class="kv-editor">
                    <div v-for="(item, index) in form.WebApiConfigData.TokenHeaderRows" :key="index" class="kv-row">
                      <el-input v-model="item.Key" :placeholder="$t('esb.headerName')"></el-input>
                      <el-input v-model="item.Value" :placeholder="$t('esb.templateValuePlaceholder')"></el-input>
                      <el-button type="danger" icon="Delete" @click="removeTokenHeaderRow(index)"></el-button>
                    </div>
                    <el-button icon="Plus" @click="addTokenHeaderRow">{{ $t('esb.addRequestHeader') }}</el-button>
                  </div>
                </el-form-item>

                <el-form-item v-if="form.WebApiConfigData.TokenMethod === 'POST'" :label="$t('esb.tokenBody')">
                  <el-input
                    v-model="form.WebApiConfigData.TokenBody"
                    type="textarea"
                    :rows="5"
                    :placeholder="$t('esb.tokenBodyPlaceholder')"
                  ></el-input>
                </el-form-item>
              </template>

              <el-form-item v-if="form.WebApiConfigData.AuthType === 'apikey'" label="API Key">
                <div class="api-key-grid">
                  <el-input v-model="form.WebApiConfigData.ApiKeyName" :placeholder="$t('esb.apiKeyName')"></el-input>
                  <el-input
                    v-model="form.WebApiConfigData.ApiKeyValue"
                    :placeholder="$t('esb.apiKeyValue')"
                    show-password
                  ></el-input>
                  <el-select v-model="form.WebApiConfigData.ApiKeyIn">
                    <el-option label="Header" value="header"></el-option>
                    <el-option label="Query" value="query"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </el-tab-pane>

            <el-tab-pane :label="$t('esb.commonHeaders')" name="headers">
              <el-form-item :label="$t('esb.commonHeaders')">
                <div class="kv-editor">
                  <div v-for="(item, index) in form.WebApiConfigData.HeaderRows" :key="index" class="kv-row">
                    <el-input v-model="item.Key" :placeholder="$t('esb.headerName')"></el-input>
                    <el-input v-model="item.Value" :placeholder="$t('esb.templateValuePlaceholder')"></el-input>
                    <el-button type="danger" icon="Delete" @click="removeWebApiHeaderRow(index)"></el-button>
                  </div>
                  <el-button icon="Plus" @click="addWebApiHeaderRow">{{ $t('esb.addRequestHeader') }}</el-button>
                </div>
              </el-form-item>
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-form-item :label="$t('esb.remark')">
          <el-input v-model="form.Remark" type="textarea" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="testing" @click="testCurrentForm">
          {{ $t('esb.testConnection') }}
        </el-button>
        <el-button @click="formDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveConnection">{{ $t('common.save') }}</el-button>
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
  WebApiConfigData: createDefaultWebApiConfig(),
  Status: 1,
  TimeoutSeconds: 30,
  Remark: ''
})

const createDefaultWebApiConfig = () => ({
  BaseUrl: '',
  AuthType: 'none',
  TokenUrl: '',
  TokenMethod: 'POST',
  TokenHeaderRows: [],
  TokenBody: '',
  TokenPath: '$.access_token',
  TokenExpiresInPath: '$.expires_in',
  TokenExpiresAtPath: '',
  TokenRefreshSkewSeconds: 60,
  ApiKeyName: '',
  ApiKeyValue: '',
  ApiKeyIn: 'header',
  HeaderRows: []
})

const defaultConnectionStrings = {
  sqlserver: 'Server=localhost;Database=DTSoftDB;User Id=sa;Password=your_password;TrustServerCertificate=True;',
  mysql: 'Server=localhost;Port=3306;Database=DTSoftDB;Uid=root;Pwd=your_password;CharSet=utf8mb4;',
  postgresql:
    'Host=localhost;Port=5432;Database=DTSoftDB;Username=postgres;Password=your_password;Pooling=true;SSL Mode=Disable',
  oracle: 'User Id=system;Password=your_password;Data Source=localhost:1521/ORCLPDB1;'
}

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
      serviceConnections: [],
      supportedDatabaseTypes: [],
      total: 0,
      formDialogVisible: false,
      webApiActiveTab: 'basic',
      form: createDefaultForm(),
      saving: false,
      testing: false,
      rules: {
        Name: [{ required: true, message: this.$t('esb.namePlaceholder'), trigger: 'blur' }],
        DbType: [{ required: true, message: this.$t('esb.selectDatabaseType'), trigger: 'change' }],
        ConnectionString: [{ required: true, message: this.$t('esb.connectionStringPlaceholder'), trigger: 'blur' }],
        WebApiConfig: []
      }
    }
  },
  computed: {
    serviceTypeFilters() {
      return [
        { label: this.$t('organization.all'), value: '' },
        { label: this.$t('welcome.overview.database'), value: 'database' },
        { label: 'RESTful', value: 'restful' }
      ]
    },
    connectionStats() {
      return this.serviceConnections.reduce(
        (stats, row) => {
          if (row.ServiceType === 'restful') {
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
        WebApiConfigData: this.normalizeWebApiConfig(row.WebApiConfig || row.webApiConfig || ''),
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
        this.$message.error(res?.msg || this.$t('esb.loadConnectionsFailed'))
      }
    },
    getServiceTypeLabel(serviceType) {
      return serviceType === 'restful' ? 'RESTful' : this.$t('welcome.overview.database')
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
    getDefaultConnectionString(dbType) {
      return defaultConnectionStrings[dbType] || ''
    },
    normalizeWebApiConfig(value) {
      let config = {}
      if (typeof value === 'string' && value) {
        try {
          config = JSON.parse(value)
        } catch {
          config = {}
        }
      } else if (value && typeof value === 'object') {
        config = value
      }

      return {
        BaseUrl: config.BaseUrl || config.baseUrl || '',
        AuthType: config.AuthType || config.authType || 'none',
        TokenUrl: config.TokenUrl || config.tokenUrl || '',
        TokenMethod: config.TokenMethod || config.tokenMethod || 'POST',
        TokenHeaderRows: this.objectToRows(config.TokenHeaders || config.tokenHeaders),
        TokenBody: config.TokenBody || config.tokenBody || '',
        TokenPath: config.TokenPath || config.tokenPath || '$.access_token',
        TokenExpiresInPath: config.TokenExpiresInPath || config.tokenExpiresInPath || '$.expires_in',
        TokenExpiresAtPath: config.TokenExpiresAtPath || config.tokenExpiresAtPath || '',
        TokenRefreshSkewSeconds: config.TokenRefreshSkewSeconds ?? config.tokenRefreshSkewSeconds ?? 60,
        ApiKeyName: config.ApiKeyName || config.apiKeyName || '',
        ApiKeyValue: config.ApiKeyValue || config.apiKeyValue || '',
        ApiKeyIn: config.ApiKeyIn || config.apiKeyIn || 'header',
        HeaderRows: this.objectToRows(config.Headers || config.headers)
      }
    },
    objectToRows(value) {
      if (!value || typeof value !== 'object') return []
      return Object.keys(value).map((key) => ({ Key: key, Value: value[key] }))
    },
    rowsToObject(rows) {
      return (rows || []).reduce((result, item) => {
        if (item.Key) result[item.Key] = item.Value || ''
        return result
      }, {})
    },
    shouldApplyDefaultConnectionString() {
      if (!this.form.ItemId) return true
      if (!this.form.ConnectionString) return true
      return Object.values(defaultConnectionStrings).includes(this.form.ConnectionString)
    },
    applyDefaultConnectionString(dbType, force = false) {
      if (!force && !this.shouldApplyDefaultConnectionString()) return
      this.form.ConnectionString = this.getDefaultConnectionString(dbType)
    },
    handleDbTypeChange(dbType) {
      this.applyDefaultConnectionString(dbType)
    },
    handleServiceTypeChange(serviceType) {
      if (serviceType === 'database') {
        this.form.DbType = this.form.DbType || 'sqlserver'
        this.applyDefaultConnectionString(this.form.DbType)
      } else if (serviceType === 'restful') {
        this.form.WebApiConfigData = this.form.WebApiConfigData || createDefaultWebApiConfig()
      }
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
      this.applyDefaultConnectionString(this.form.DbType, true)
      this.webApiActiveTab = 'basic'
      this.formDialogVisible = true
    },
    openEditDialog(row) {
      this.form = this.normalizeConnection(row)
      this.webApiActiveTab = 'basic'
      this.formDialogVisible = true
    },
    addWebApiHeaderRow() {
      this.form.WebApiConfigData.HeaderRows.push({ Key: '', Value: '' })
    },
    removeWebApiHeaderRow(index) {
      this.form.WebApiConfigData.HeaderRows.splice(index, 1)
    },
    addTokenHeaderRow() {
      this.form.WebApiConfigData.TokenHeaderRows.push({ Key: '', Value: '' })
    },
    removeTokenHeaderRow(index) {
      this.form.WebApiConfigData.TokenHeaderRows.splice(index, 1)
    },
    validateRestfulConfig() {
      if (this.form.ServiceType !== 'restful') return true
      if (!this.form.WebApiConfigData.BaseUrl) {
        this.webApiActiveTab = 'basic'
        this.$message.error(this.$t('esb.baseUrlRequired'))
        return false
      }
      if (this.form.WebApiConfigData.AuthType === 'bearer' && !this.form.WebApiConfigData.TokenUrl) {
        this.webApiActiveTab = 'auth'
        this.$message.error(this.$t('esb.tokenUrlRequired'))
        return false
      }
      return true
    },
    buildSubmitData() {
      const webApiConfig = {
        BaseUrl: this.form.WebApiConfigData.BaseUrl,
        AuthType: this.form.WebApiConfigData.AuthType,
        TokenUrl: this.form.WebApiConfigData.AuthType === 'bearer' ? this.form.WebApiConfigData.TokenUrl : '',
        TokenMethod: this.form.WebApiConfigData.TokenMethod,
        TokenHeaders: this.rowsToObject(this.form.WebApiConfigData.TokenHeaderRows),
        TokenBody: this.form.WebApiConfigData.AuthType === 'bearer' ? this.form.WebApiConfigData.TokenBody : '',
        TokenPath: this.form.WebApiConfigData.TokenPath || '$.access_token',
        TokenExpiresInPath: this.form.WebApiConfigData.TokenExpiresInPath || '$.expires_in',
        TokenExpiresAtPath: this.form.WebApiConfigData.TokenExpiresAtPath || '',
        TokenRefreshSkewSeconds: this.form.WebApiConfigData.TokenRefreshSkewSeconds ?? 60,
        ApiKeyName: this.form.WebApiConfigData.AuthType === 'apikey' ? this.form.WebApiConfigData.ApiKeyName : '',
        ApiKeyValue: this.form.WebApiConfigData.AuthType === 'apikey' ? this.form.WebApiConfigData.ApiKeyValue : '',
        ApiKeyIn: this.form.WebApiConfigData.ApiKeyIn,
        Headers: this.rowsToObject(this.form.WebApiConfigData.HeaderRows)
      }

      return {
        ...this.form,
        DbType: this.form.ServiceType === 'database' ? this.form.DbType : null,
        ConnectionString: this.form.ServiceType === 'database' ? this.form.ConnectionString : null,
        WebApiConfig: this.form.ServiceType === 'restful' ? JSON.stringify(webApiConfig) : null
      }
    },
    saveConnection() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        if (!this.validateRestfulConfig()) return
        this.saving = true
        try {
          const submitData = this.buildSubmitData()
          const { data: res } = submitData.ItemId
            ? await updateEsbServiceConnection(submitData)
            : await addEsbServiceConnection(submitData)
          if (res?.success) {
            this.$message.success(res.msg || this.$t('language.saveSuccess'))
            this.formDialogVisible = false
            await this.loadServiceConnections()
          } else {
            this.$message.error(res?.msg || this.$t('esb.saveFailed'))
          }
        } finally {
          this.saving = false
        }
      })
    },
    removeConnection(row) {
      this.$confirm(this.$t('esb.deleteConnectionConfirm'), this.$t('organization.prompt'), { type: 'warning' })
        .then(async () => {
          const { data: res } = await deleteEsbServiceConnection(row.ItemId || row.itemId)
          if (res?.success) {
            this.$message.success(res.msg || this.$t('language.deleteSuccess'))
            await this.loadServiceConnections()
          } else {
            this.$message.error(res?.msg || this.$t('language.deleteFailed'))
          }
        })
        .catch(() => {})
    },
    async testConnection(row) {
      this.testing = true
      try {
        const { data: res } = await testEsbServiceConnection({ ItemId: row.ItemId })
        if (res?.success) {
          this.$message.success(res.msg || this.$t('esb.testSuccess'))
        } else {
          this.$message.error(res?.msg || this.$t('esb.testFailed'))
        }
      } finally {
        this.testing = false
      }
    },
    testCurrentForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        if (!this.validateRestfulConfig()) return
        this.testing = true
        try {
          const { data: res } = await testEsbServiceConnection({
            ...this.buildSubmitData(),
            ItemId: null
          })
          if (res?.success) {
            this.$message.success(res.msg || this.$t('esb.testSuccess'))
          } else {
            this.$message.error(res?.msg || this.$t('esb.testFailed'))
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
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 2px 18px;
}

.form-grid :deep(.el-form-item) {
  min-width: 0;
}

.webapi-tabs {
  margin-bottom: 16px;
}

.api-key-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 8px;
  width: 100%;
}

.kv-editor {
  display: grid;
  gap: 10px;
  width: 100%;
}

.kv-row {
  display: grid;
  grid-template-columns: 1fr 2fr 44px;
  gap: 8px;
  align-items: center;
}

:global(.esb-service-dialog .el-form-item__label) {
  height: auto;
  margin-bottom: 6px;
  overflow: visible;
  line-height: 1.35;
  white-space: normal;
}

:global(.esb-service-dialog .el-input),
:global(.esb-service-dialog .el-select),
:global(.esb-service-dialog .el-input-number) {
  width: 100%;
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

@media (max-width: 720px) {
  .form-grid,
  .api-key-grid,
  .kv-row {
    grid-template-columns: 1fr;
  }
}
</style>
