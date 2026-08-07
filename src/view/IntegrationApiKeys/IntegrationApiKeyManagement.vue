<template>
  <div class="integration-api-key-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('apiKey.title') }}</h1>
          <p>{{ $t('apiKey.subtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getApiKeyList">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDialog">{{ $t('apiKey.create') }}</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="queryInfo.KeyName"
          class="dt-search"
          :placeholder="$t('apiKey.searchPlaceholder')"
          clearable
          @clear="getApiKeyList"
          @keyup.enter="getApiKeyList"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="dt-filter-tabs">
          <button
            v-for="item in enabledFilters"
            :key="item.label"
            type="button"
            :class="['dt-filter-tab', { 'is-active': queryInfo.Enabled === item.value }]"
            @click="setEnabledFilter(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('apiKey.listTitle') }}</strong>
            <span>{{ $t('apiKey.totalRows', { count: apiKeyList.length }) }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('apiKey.allCount', { count: apiKeyStats.total }) }}</span>
            <span class="dt-chip dt-chip--success">
              {{ $t('organization.enabledCount', { count: apiKeyStats.enabled }) }}
            </span>
            <span class="dt-chip dt-chip--warning">
              {{ $t('organization.disabledCount', { count: apiKeyStats.disabled }) }}
            </span>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="apiKeyList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          :empty-text="$t('apiKey.empty')"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.key')" prop="KeyName" min-width="220">
            <template #default="scope">
              <span class="dt-name-copy">
                <strong>{{ scope.row.KeyName }}</strong>
                <small>{{ scope.row.Description || $t('apiKey.noDescription') }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="96" align="center">
            <template #default="scope">
              <span :class="['dt-badge', scope.row.Enabled ? 'dt-badge--success' : 'dt-badge--warning']">
                {{ scope.row.Enabled ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.enabledStatus')" width="110" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.Enabled" @change="handleStatusChange(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.createTime')" width="180">
            <template #default="scope">
              <code class="dt-code">{{ formatDate(scope.row.CreateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.expireTime')" width="180">
            <template #default="scope">
              <code class="dt-code">
                {{ scope.row.ExpireTime ? formatDate(scope.row.ExpireTime) : $t('apiKey.neverExpires') }}
              </code>
            </template>
          </el-table-column>
          <el-table-column :label="$t('apiKey.creator')" prop="CreatedBy" width="120">
            <template #default="scope">
              <span class="dt-muted-pill">{{ scope.row.CreatedBy || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="108" fixed="right" align="right">
            <template #default="scope">
              <div class="dt-operation-buttons integration-api-key-actions">
                <el-tooltip :content="$t('apiKey.edit')" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--edit"
                    :icon="Edit"
                    @click="showEditDialog(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip :content="$t('apiKey.delete')" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    @click="removeApiKey(scope.row.ItemId)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <!-- Create API key dialog -->
    <IntegrationApiKeyAddDialog v-model="addDialogVisible" :form="addForm" @created="onApiKeyCreated" />

    <!-- Edit API key dialog -->
    <IntegrationApiKeyEditDialog v-model="editDialogVisible" :form="editForm" @success="getApiKeyList" />

    <!-- SecretKey display dialog -->
    <IntegrationApiKeySecretDialog v-model="secretKeyDialogVisible" :data="secretKeyData" />
  </div>
</template>

<script>
import { computed, defineComponent, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { getApiKeyList, updateApiKey, deleteApiKey } from '@/api/integrationApiKeys'
import { translate } from '@/i18n'
import IntegrationApiKeyAddDialog from './components/IntegrationApiKeyAddDialog.vue'
import IntegrationApiKeyEditDialog from './components/IntegrationApiKeyEditDialog.vue'
import IntegrationApiKeySecretDialog from './components/IntegrationApiKeySecretDialog.vue'

export default defineComponent({
  name: 'IntegrationApiKeyManagement',
  components: {
    IntegrationApiKeyAddDialog,
    IntegrationApiKeyEditDialog,
    IntegrationApiKeySecretDialog,
    Search
  },
  setup() {
    const loading = ref(false)
    const apiKeyList = ref([])

    // Query parameters
    const queryInfo = reactive({
      KeyName: '',
      Enabled: undefined
    })

    const enabledFilters = computed(() => [
      { label: translate('apiKey.all'), value: undefined },
      { label: translate('common.enabled'), value: true },
      { label: translate('common.disabled'), value: false }
    ])

    const apiKeyStats = computed(() =>
      apiKeyList.value.reduce(
        (stats, item) => {
          stats.total += 1
          if (item.Enabled) {
            stats.enabled += 1
          } else {
            stats.disabled += 1
          }
          return stats
        },
        { total: 0, enabled: 0, disabled: 0 }
      )
    )

    // Add dialog
    const addDialogVisible = ref(false)
    const addForm = reactive({
      KeyName: '',
      Description: '',
      ExpireTime: ''
    })

    // Edit dialog
    const editDialogVisible = ref(false)
    const editForm = reactive({
      ItemId: 0,
      KeyName: '',
      Description: '',
      Enabled: true,
      ExpireTime: ''
    })

    // SecretKey display dialog
    const secretKeyDialogVisible = ref(false)
    const secretKeyData = reactive({
      KeyName: '',
      SecretKey: ''
    })

    // Load API key list
    const getApiKeyListData = async () => {
      loading.value = true
      try {
        const params = {}
        if (queryInfo.KeyName) {
          params.KeyName = queryInfo.KeyName
        }
        if (queryInfo.Enabled !== undefined && queryInfo.Enabled !== '') {
          params.Enabled = queryInfo.Enabled
        }

        const response = await getApiKeyList(params)
        if (response.data.Code === 200) {
          apiKeyList.value = response.data.Data || []
        } else {
          ElMessage.error(response.data.Message || translate('apiKey.queryFailed'))
        }
      } catch (error) {
        ElMessage.error(`${translate('apiKey.queryFailed')}: ${error.response?.data?.Message || error.message}`)
      } finally {
        loading.value = false
      }
    }

    // Show add dialog
    const showAddDialog = () => {
      addDialogVisible.value = true
    }

    const setEnabledFilter = (value) => {
      queryInfo.Enabled = value
      getApiKeyListData()
    }

    // Add dialog close
    // addDialogClosed handled by IntegrationApiKeyAddDialog component

    // Create API key
    const onApiKeyCreated = (resultData) => {
      secretKeyData.KeyName = resultData.KeyName
      secretKeyData.SecretKey = resultData.SecretKey
      secretKeyDialogVisible.value = true
      getApiKeyListData()
    }

    // Show edit dialog
    const showEditDialog = (row) => {
      editForm.ItemId = row.ItemId
      editForm.KeyName = row.KeyName
      editForm.Description = row.Description || ''
      editForm.Enabled = row.Enabled
      editForm.ExpireTime = row.ExpireTime || ''
      editDialogVisible.value = true
    }

    // Edit dialog close
    // editDialogClosed handled by IntegrationApiKeyEditDialog component

    // Update API key

    // Status change
    const handleStatusChange = async (row) => {
      try {
        const data = {
          ItemId: row.ItemId,
          Enabled: row.Enabled
        }
        if (row.Description) {
          data.Description = row.Description
        }
        if (row.ExpireTime) {
          data.ExpireTime = row.ExpireTime
        }

        const response = await updateApiKey(data)
        if (response.data.Code === 200) {
          ElMessage.success(row.Enabled ? translate('apiKey.enabled') : translate('apiKey.disabled'))
        } else {
          ElMessage.error(response.data.Message || translate('apiKey.updateFailed'))
          // Restore previous status
          row.Enabled = !row.Enabled
        }
      } catch (error) {
        ElMessage.error(`${translate('apiKey.updateFailed')}: ${error.response?.data?.Message || error.message}`)
        // Restore previous status
        row.Enabled = !row.Enabled
      }
    }

    // Delete API key
    const removeApiKey = async (itemId) => {
      try {
        await ElMessageBox.confirm(translate('apiKey.deleteConfirm'), translate('organization.prompt'), {
          confirmButtonText: translate('common.confirm'),
          cancelButtonText: translate('common.cancel'),
          type: 'warning'
        })

        const response = await deleteApiKey(itemId)
        if (response.data.Code === 200) {
          ElMessage.success(translate('apiKey.deleteSuccess'))
          getApiKeyListData()
        } else {
          ElMessage.error(response.data.Message || translate('apiKey.deleteFailed'))
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(`${translate('apiKey.deleteFailed')}: ${error.response?.data?.Message || error.message}`)
        }
      }
    }

    // Copy SecretKey
    // copySecretKey handled by IntegrationApiKeySecretDialog component

    // Format date
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const dt = new Date(dateStr)
      const year = dt.getFullYear()
      const month = (dt.getMonth() + 1).toString().padStart(2, '0')
      const date = dt.getDate().toString().padStart(2, '0')
      const hour = dt.getHours().toString().padStart(2, '0')
      const minute = dt.getMinutes().toString().padStart(2, '0')
      const second = dt.getSeconds().toString().padStart(2, '0')
      return `${year}-${month}-${date} ${hour}:${minute}:${second}`
    }

    // Index method
    const indexMethod = (index) => {
      return index + 1
    }

    onMounted(() => {
      getApiKeyListData()
    })

    return {
      loading,
      apiKeyList,
      queryInfo,
      enabledFilters,
      apiKeyStats,
      Delete,
      Edit,
      Plus,
      Refresh,
      getApiKeyList: getApiKeyListData,
      addDialogVisible,
      addForm,
      showAddDialog,
      setEnabledFilter,
      onApiKeyCreated,
      editDialogVisible,
      editForm,
      showEditDialog,
      handleStatusChange,
      removeApiKey,
      secretKeyDialogVisible,
      secretKeyData,
      formatDate,
      indexMethod
    }
  }
})
</script>

<style lang="less" scoped>
.integration-api-key-container {
  height: 100%;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.integration-api-key-actions {
  min-width: 70px;
  display: grid;
  grid-template-columns: repeat(2, 30px);
  justify-content: end;
  gap: 10px;
}

.integration-api-key-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

:deep(.el-dialog) {
  .el-form-item {
    margin-bottom: 20px;
  }
}

// Keep the date picker visible inside the dialog.
:deep(.el-dialog__wrapper) {
  overflow: visible;
}

:deep(.el-dialog) {
  overflow: visible;
}

:deep(.el-dialog__body) {
  overflow: visible;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
