<template>
  <div class="esb-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('esb.dataSourceTitle') }}</h1>
          <p>{{ $t('esb.dataSourceSubtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="loadDataSources">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">{{ $t('esb.addDataSource') }}</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="query.keyword"
          class="dt-search"
          clearable
          :placeholder="$t('esb.dataSourceSearchPlaceholder')"
          @clear="loadDataSources"
          @keyup.enter="loadDataSources"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="query.connectionId"
          class="connection-filter"
          :placeholder="$t('esb.serviceConnection')"
          clearable
          @change="loadDataSources"
        >
          <el-option
            v-for="connection in connectionOptions"
            :key="connection.ItemId"
            :label="getConnectionDisplayName(connection)"
            :value="connection.ItemId"
          />
        </el-select>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('esb.dataSourceList') }}</strong>
            <span>{{ $t('esb.serverTotal', { total }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('esb.currentPage', { count: dataSources.length }) }}</span>
            <span class="dt-chip dt-chip--success">
              {{ $t('organization.enabledCount', { count: dataSourceStats.enabled }) }}
            </span>
            <span class="dt-chip dt-chip--warning">
              {{ $t('organization.disabledCount', { count: dataSourceStats.disabled }) }}
            </span>
            <span class="dt-chip">{{ $t('esb.connectionCount', { count: connectionOptions.length }) }}</span>
          </div>
        </div>

        <el-table
          :data="dataSources"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          :empty-text="$t('esb.emptyDataSources')"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="Name" :label="$t('esb.dataSource')" min-width="220">
            <template #default="{ row }">
              <span class="dt-name-copy">
                <strong>{{ row.Name }}</strong>
                <small>{{ row.Code }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="Code" :label="$t('esb.code')" min-width="170">
            <template #default="{ row }">
              <code class="dt-code">{{ row.Code }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.type')" width="90">
            <template #default="{ row }">
              <span class="dt-badge dt-badge--neutral">{{ row.SourceType || row.sourceType }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('esb.serviceConnection')" min-width="170">
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ getDataSourceConnectionName(row) }}</span>
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
                <el-tooltip :content="$t('esb.editDataSourceAction')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--edit" :icon="Edit" @click="openEditDialog(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('esb.testExecute')" placement="top">
                  <el-button class="dt-icon-action dt-icon-action--add" :icon="Document" @click="openTestDialog(row)" />
                </el-tooltip>
                <el-tooltip :content="$t('esb.deleteDataSource')" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="removeDataSource(row)"
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
      :title="form.ItemId ? $t('esb.editDataSource') : $t('esb.addDataSource')"
      width="min(980px, calc(100vw - 32px))"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="form-grid">
          <el-form-item :label="$t('esb.dataSourceCode')" prop="Code">
            <el-input v-model="form.Code" :placeholder="$t('esb.dataSourceCodePlaceholder')"></el-input>
          </el-form-item>
          <el-form-item :label="$t('esb.dataSourceName')" prop="Name">
            <el-input v-model="form.Name" :placeholder="$t('esb.namePlaceholder')"></el-input>
          </el-form-item>
          <el-form-item :label="$t('esb.sourceType')">
            <el-select v-model="form.SourceType" @change="handleSourceTypeChange">
              <el-option label="SQL" value="sql"></el-option>
              <el-option label="RESTful" value="restful"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('esb.serviceConnection')" prop="ConnectionId">
            <el-select v-model="form.ConnectionId" filterable :placeholder="$t('esb.selectServiceConnection')">
              <el-option
                v-for="connection in availableConnectionOptions"
                :key="connection.ItemId"
                :label="getConnectionDisplayName(connection)"
                :value="connection.ItemId"
              >
                <span>{{ getConnectionDisplayName(connection) }}</span>
                <span class="connection-option-extra">{{ getConnectionTypeMeta(connection) }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('esb.maxRows')">
            <el-input-number v-model="form.MaxRows" :min="1" :max="1000"></el-input-number>
          </el-form-item>
          <el-form-item :label="$t('esb.timeoutSeconds')">
            <el-input-number v-model="form.TimeoutSeconds" :min="1" :max="120"></el-input-number>
          </el-form-item>
          <el-form-item :label="$t('common.status')">
            <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </div>

        <el-form-item v-if="form.SourceType === 'sql'" label="SQL" prop="SqlText">
          <el-input v-model="form.SqlText" type="textarea" :rows="8" :placeholder="$t('esb.sqlPlaceholder')"></el-input>
        </el-form-item>

        <template v-if="form.SourceType === 'restful'">
          <div class="form-grid">
            <el-form-item :label="$t('esb.httpMethod')">
              <el-select v-model="form.HttpConfig.Method">
                <el-option label="GET" value="GET"></el-option>
                <el-option label="POST" value="POST"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('esb.requestPath')">
              <el-input v-model="form.HttpConfig.Path" :placeholder="$t('esb.requestPathPlaceholder')"></el-input>
            </el-form-item>
            <el-form-item :label="$t('esb.resultPath')">
              <el-input v-model="form.HttpConfig.ResultPath" :placeholder="$t('esb.resultPathPlaceholder')"></el-input>
            </el-form-item>
            <el-form-item :label="$t('esb.totalPath')">
              <el-input v-model="form.HttpConfig.TotalPath" :placeholder="$t('esb.totalPathPlaceholder')"></el-input>
            </el-form-item>
          </div>

          <el-form-item :label="$t('esb.queryParameters')">
            <div class="kv-editor">
              <div v-for="(item, index) in form.HttpConfig.QueryRows" :key="index" class="kv-row">
                <el-input v-model="item.Key" :placeholder="$t('esb.paramName')"></el-input>
                <el-input v-model="item.Value" :placeholder="$t('esb.templateValuePlaceholder')"></el-input>
                <el-button type="danger" icon="Delete" @click="removeQueryRow(index)"></el-button>
              </div>
              <el-button icon="Plus" @click="addQueryRow">{{ $t('esb.addQueryParameter') }}</el-button>
            </div>
          </el-form-item>

          <el-form-item :label="$t('esb.requestHeaders')">
            <div class="kv-editor">
              <div v-for="(item, index) in form.HttpConfig.HeaderRows" :key="index" class="kv-row">
                <el-input v-model="item.Key" :placeholder="$t('esb.headerName')"></el-input>
                <el-input v-model="item.Value" :placeholder="$t('esb.templateValuePlaceholder')"></el-input>
                <el-button type="danger" icon="Delete" @click="removeHeaderRow(index)"></el-button>
              </div>
              <el-button icon="Plus" @click="addHeaderRow">{{ $t('esb.addRequestHeader') }}</el-button>
            </div>
          </el-form-item>

          <el-form-item v-if="form.HttpConfig.Method === 'POST'" :label="$t('esb.requestBody')">
            <el-input
              v-model="form.HttpConfig.Body"
              type="textarea"
              :rows="6"
              :placeholder="$t('esb.requestBodyPlaceholder')"
            ></el-input>
          </el-form-item>
        </template>

        <el-form-item :label="$t('esb.parameters')">
          <div class="parameter-editor">
            <div v-for="(parameter, index) in form.Parameters" :key="index" class="parameter-row">
              <el-input v-model="parameter.Name" :placeholder="$t('esb.paramName')"></el-input>
              <el-input v-model="parameter.Label" :placeholder="$t('esb.displayName')"></el-input>
              <el-select v-model="parameter.Type">
                <el-option :label="$t('esb.text')" value="string"></el-option>
                <el-option :label="$t('esb.number')" value="number"></el-option>
                <el-option :label="$t('esb.boolean')" value="boolean"></el-option>
                <el-option :label="$t('esb.datetime')" value="datetime"></el-option>
              </el-select>
              <el-switch v-model="parameter.Required" :active-text="$t('esb.required')"></el-switch>
              <el-input v-model="parameter.DefaultValue" :placeholder="$t('esb.defaultValue')"></el-input>
              <el-button type="danger" icon="Delete" @click="removeParameter(index)"></el-button>
            </div>
            <el-button icon="Plus" @click="addParameter">{{ $t('esb.addParameter') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('esb.resultMapping')">
          <div class="mapping-row">
            <el-input v-model="form.ResultMapping.LabelField" :placeholder="$t('esb.labelField')"></el-input>
            <el-input v-model="form.ResultMapping.ValueField" :placeholder="$t('esb.valueField')"></el-input>
          </div>
        </el-form-item>

        <el-form-item :label="$t('esb.remark')">
          <el-input v-model="form.Remark" type="textarea" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveDataSource">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" :title="$t('esb.testExecute')" width="760px">
      <el-form label-width="100px">
        <el-form-item
          v-for="parameter in testParameters"
          :key="parameter.Name"
          :label="parameter.Label || parameter.Name"
        >
          <el-input v-model="testForm[parameter.Name]" :placeholder="parameter.Name"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="primary" :loading="testing" @click="executeTest">{{ $t('esb.executeTest') }}</el-button>
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
import { Delete, Document, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

const createDefaultForm = () => ({
  ItemId: null,
  Code: '',
  Name: '',
  ConnectionId: 0,
  SourceType: 'sql',
  ExecuteMode: 'query',
  SqlText: '',
  HttpConfig: createDefaultHttpConfig(),
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

const createDefaultHttpConfig = () => ({
  Method: 'GET',
  Path: '',
  QueryRows: [],
  HeaderRows: [],
  Body: '',
  ContentType: 'application/json',
  ResultPath: '$',
  TotalPath: ''
})

export default {
  name: 'EsbDataSources',
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
        Code: [{ required: true, message: this.$t('esb.dataSourceCodePlaceholder'), trigger: 'blur' }],
        Name: [{ required: true, message: this.$t('esb.namePlaceholder'), trigger: 'blur' }],
        ConnectionId: [{ required: true, message: this.$t('esb.selectServiceConnection'), trigger: 'change' }],
        SqlText: [{ required: true, message: this.$t('esb.sqlPlaceholder'), trigger: 'blur' }]
      }
    }
  },
  computed: {
    availableConnectionOptions() {
      if (this.form.SourceType === 'restful') {
        return this.connectionOptions.filter((item) => item.ServiceType === 'restful')
      }
      return this.connectionOptions.filter((item) => item.ServiceType === 'database')
    },
    dataSourceStats() {
      return this.dataSources.reduce(
        (stats, row) => {
          if (this.normalizeStatus(row) === 1) {
            stats.enabled += 1
          } else {
            stats.disabled += 1
          }
          return stats
        },
        { enabled: 0, disabled: 0 }
      )
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
        HttpConfig: this.normalizeHttpConfig(row.HttpConfig || row.httpConfig || ''),
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
    normalizeHttpConfig(value) {
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
        Method: config.Method || config.method || 'GET',
        Path: config.Path || config.path || '',
        QueryRows: this.objectToRows(config.Query || config.query),
        HeaderRows: this.objectToRows(config.Headers || config.headers),
        Body: config.Body || config.body || '',
        ContentType: config.ContentType || config.contentType || 'application/json',
        ResultPath: config.ResultPath || config.resultPath || '$',
        TotalPath: config.TotalPath || config.totalPath || ''
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
        this.$message.error(res?.msg || this.$t('esb.loadDataSourcesFailed'))
      }
    },
    async loadConnectionOptions() {
      const { data: res } = await getEsbServiceConnectionOptions()
      if (res?.success) {
        this.connectionOptions = (res.data || []).map((item) => this.normalizeConnection(item))
      } else {
        this.$message.error(res?.msg || this.$t('esb.loadConnectionsFailed'))
      }
    },
    getConnectionName(connectionId) {
      const value = connectionId ?? 0
      const connection = this.connectionOptions.find((item) => item.ItemId === value)
      return connection ? this.getConnectionDisplayName(connection) : this.$t('esb.defaultSystemDb')
    },
    isDefaultSystemConnection(connection) {
      return Boolean(connection?.IsDefault) || Number(connection?.ItemId ?? connection?.itemId ?? -1) === 0
    },
    getConnectionDisplayName(connection) {
      if (this.isDefaultSystemConnection(connection)) return this.$t('esb.defaultSystemDb')
      return connection?.Name || connection?.name || ''
    },
    getConnectionTypeMeta(connection) {
      if (connection.ServiceType === 'restful') return 'RESTful'
      return connection.DbType || this.$t('welcome.overview.database')
    },
    getDataSourceConnectionName(row) {
      const connectionId = row.ConnectionId ?? row.connectionId ?? 0
      if (Number(connectionId) === 0) return this.$t('esb.defaultSystemDb')

      const connection = this.connectionOptions.find((item) => item.ItemId === connectionId)
      if (connection) return this.getConnectionDisplayName(connection)

      return row.ConnectionName || row.connectionName || this.$t('esb.defaultSystemDb')
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
    handleSourceTypeChange(sourceType) {
      this.form.ConnectionId = sourceType === 'sql' ? 0 : null
      if (sourceType === 'sql') {
        this.form.HttpConfig = createDefaultHttpConfig()
      } else {
        this.form.SqlText = ''
      }
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
    addQueryRow() {
      this.form.HttpConfig.QueryRows.push({ Key: '', Value: '' })
    },
    removeQueryRow(index) {
      this.form.HttpConfig.QueryRows.splice(index, 1)
    },
    addHeaderRow() {
      this.form.HttpConfig.HeaderRows.push({ Key: '', Value: '' })
    },
    removeHeaderRow(index) {
      this.form.HttpConfig.HeaderRows.splice(index, 1)
    },
    buildSubmitData() {
      const httpConfig = {
        Method: this.form.HttpConfig.Method,
        Path: this.form.HttpConfig.Path,
        Query: this.rowsToObject(this.form.HttpConfig.QueryRows),
        Headers: this.rowsToObject(this.form.HttpConfig.HeaderRows),
        Body: this.form.HttpConfig.Method === 'POST' ? this.form.HttpConfig.Body : '',
        ContentType: this.form.HttpConfig.ContentType || 'application/json',
        ResultPath: this.form.HttpConfig.ResultPath || '$',
        TotalPath: this.form.HttpConfig.TotalPath || ''
      }

      return {
        ...this.form,
        ConnectionId: this.form.ConnectionId === 0 ? null : this.form.ConnectionId,
        SqlText: this.form.SourceType === 'sql' ? this.form.SqlText : '',
        HttpConfig: this.form.SourceType === 'restful' ? JSON.stringify(httpConfig) : '',
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
            this.$message.success(res.msg || this.$t('language.saveSuccess'))
            this.formDialogVisible = false
            await this.loadDataSources()
          } else {
            this.$message.error(res?.msg || this.$t('esb.saveFailed'))
          }
        } catch (error) {
          const msg =
            error.response?.data?.msg ||
            error.response?.data?.message ||
            error.response?.data?.title ||
            error.message ||
            this.$t('esb.saveFailed')
          this.$message.error(msg)
        } finally {
          this.saving = false
        }
      })
    },
    removeDataSource(row) {
      this.$confirm(this.$t('esb.deleteDataSourceConfirm'), this.$t('organization.prompt'), { type: 'warning' })
        .then(async () => {
          const { data: res } = await deleteEsbDataSource(row.ItemId || row.itemId)
          if (res?.success) {
            this.$message.success(res.msg || this.$t('language.deleteSuccess'))
            await this.loadDataSources()
          } else {
            this.$message.error(res?.msg || this.$t('language.deleteFailed'))
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
  min-height: 0;
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
  flex: 1;
  min-height: 0;
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
  .form-grid,
  .mapping-row,
  .kv-row,
  .parameter-row {
    grid-template-columns: 1fr;
  }
}
</style>
