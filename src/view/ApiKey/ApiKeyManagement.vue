<template>
  <div class="apikey-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>API Key 管理</h1>
          <p>创建、禁用和维护外部系统访问密钥。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getApiKeyList">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDialog">创建密钥</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="queryInfo.KeyName"
          class="dt-search"
          placeholder="搜索密钥名称"
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
            <strong>密钥列表</strong>
            <span>共 {{ apiKeyList.length }} 条</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">全部 {{ apiKeyStats.total }}</span>
            <span class="dt-chip dt-chip--success">启用 {{ apiKeyStats.enabled }}</span>
            <span class="dt-chip dt-chip--warning">禁用 {{ apiKeyStats.disabled }}</span>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="apiKeyList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无 API Key"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="密钥" prop="KeyName" min-width="220">
            <template #default="scope">
              <span class="dt-name-copy">
                <strong>{{ scope.row.KeyName }}</strong>
                <small>{{ scope.row.Description || '未设置描述' }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96" align="center">
            <template #default="scope">
              <span :class="['dt-badge', scope.row.Enabled ? 'dt-badge--success' : 'dt-badge--warning']">
                {{ scope.row.Enabled ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" width="110" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.Enabled" @change="handleStatusChange(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="scope">
              <code class="dt-code">{{ formatDate(scope.row.CreateTime) }}</code>
            </template>
          </el-table-column>
          <el-table-column label="过期时间" width="180">
            <template #default="scope">
              <code class="dt-code">{{ scope.row.ExpireTime ? formatDate(scope.row.ExpireTime) : '永不过期' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="创建人" prop="CreatedBy" width="120">
            <template #default="scope">
              <span class="dt-muted-pill">{{ scope.row.CreatedBy || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="108" fixed="right" align="right">
            <template #default="scope">
              <div class="dt-operation-buttons apikey-actions">
                <el-tooltip content="编辑密钥" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--edit"
                    :icon="Edit"
                    @click="showEditDialog(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="删除密钥" placement="top">
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

    <!-- 创建密钥对话框 -->
    <ApiKeyAddDialog v-model="addDialogVisible" :form="addForm" @created="onApiKeyCreated" />

    <!-- 修改密钥对话框 -->
    <ApiKeyEditDialog v-model="editDialogVisible" :form="editForm" @success="getApiKeyList" />

    <!-- 显示SecretKey对话框 -->
    <ApiKeySecretDialog v-model="secretKeyDialogVisible" :data="secretKeyData" />
  </div>
</template>

<script>
import { computed, defineComponent, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { getApiKeyList, updateApiKey, deleteApiKey } from '@/api/apikey'
import ApiKeyAddDialog from './components/ApiKeyAddDialog.vue'
import ApiKeyEditDialog from './components/ApiKeyEditDialog.vue'
import ApiKeySecretDialog from './components/ApiKeySecretDialog.vue'

export default defineComponent({
  name: 'ApiKeyManagement',
  components: {
    ApiKeyAddDialog,
    ApiKeyEditDialog,
    ApiKeySecretDialog,
    Search
  },
  setup() {
    const loading = ref(false)
    const apiKeyList = ref([])

    // 查询参数
    const queryInfo = reactive({
      KeyName: '',
      Enabled: undefined
    })

    const enabledFilters = [
      { label: '全部', value: undefined },
      { label: '启用', value: true },
      { label: '禁用', value: false }
    ]

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

    // 添加对话框
    const addDialogVisible = ref(false)
    const addForm = reactive({
      KeyName: '',
      Description: '',
      ExpireTime: ''
    })

    // 编辑对话框
    const editDialogVisible = ref(false)
    const editForm = reactive({
      ItemId: 0,
      KeyName: '',
      Description: '',
      Enabled: true,
      ExpireTime: ''
    })

    // SecretKey显示对话框
    const secretKeyDialogVisible = ref(false)
    const secretKeyData = reactive({
      KeyName: '',
      SecretKey: ''
    })

    // 获取API密钥列表
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
          ElMessage.error(response.data.Message || '查询失败')
        }
      } catch (error) {
        ElMessage.error('查询失败：' + (error.response?.data?.Message || error.message))
      } finally {
        loading.value = false
      }
    }

    // 显示添加对话框
    const showAddDialog = () => {
      addDialogVisible.value = true
    }

    const setEnabledFilter = (value) => {
      queryInfo.Enabled = value
      getApiKeyListData()
    }

    // 添加对话框关闭
    // addDialogClosed handled by ApiKeyAddDialog component

    // 创建API密钥
    const onApiKeyCreated = (resultData) => {
      secretKeyData.KeyName = resultData.KeyName
      secretKeyData.SecretKey = resultData.SecretKey
      secretKeyDialogVisible.value = true
      getApiKeyListData()
    }

    // 显示编辑对话框
    const showEditDialog = (row) => {
      editForm.ItemId = row.ItemId
      editForm.KeyName = row.KeyName
      editForm.Description = row.Description || ''
      editForm.Enabled = row.Enabled
      editForm.ExpireTime = row.ExpireTime || ''
      editDialogVisible.value = true
    }

    // 编辑对话框关闭
    // editDialogClosed handled by ApiKeyEditDialog component

    // 更新API密钥

    // 状态变更
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
          ElMessage.success(row.Enabled ? '已启用' : '已禁用')
        } else {
          ElMessage.error(response.data.Message || '更新失败')
          // 恢复原状态
          row.Enabled = !row.Enabled
        }
      } catch (error) {
        ElMessage.error('更新失败：' + (error.response?.data?.Message || error.message))
        // 恢复原状态
        row.Enabled = !row.Enabled
      }
    }

    // 删除API密钥
    const removeApiKey = async (itemId) => {
      try {
        await ElMessageBox.confirm('此操作将永久删除该API密钥，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await deleteApiKey(itemId)
        if (response.data.Code === 200) {
          ElMessage.success('删除成功')
          getApiKeyListData()
        } else {
          ElMessage.error(response.data.Message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + (error.response?.data?.Message || error.message))
        }
      }
    }

    // 复制SecretKey
    // copySecretKey handled by ApiKeySecretDialog component

    // 格式化日期
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

    // 索引方法
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
.apikey-container {
  height: 100%;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.apikey-actions {
  min-width: 70px;
  display: grid;
  grid-template-columns: repeat(2, 30px);
  justify-content: end;
  gap: 10px;
}

.apikey-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

:deep(.el-dialog) {
  .el-form-item {
    margin-bottom: 20px;
  }
}

// 确保日期选择器不被对话框裁剪
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
