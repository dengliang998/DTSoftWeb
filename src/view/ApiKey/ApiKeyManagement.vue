<template>
  <div class="apikey-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input v-model="queryInfo.KeyName" placeholder="请输入密钥名称" clearable @clear="getApiKeyList">
            <template #append>
              <el-button icon="Search" @click="getApiKeyList"></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="queryInfo.Enabled"
            placeholder="启用状态"
            clearable
            style="width: 100%"
            @change="getApiKeyList"
          >
            <el-option label="启用" :value="true"></el-option>
            <el-option label="禁用" :value="false"></el-option>
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="showAddDialog">创建密钥</el-button>
        </el-col>
      </el-row>

      <!-- API密钥列表区域 -->
      <el-table
        v-loading="loading"
        :data="apiKeyList"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        border
        stripe
        class="table-wrapper"
      >
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="密钥名称" prop="KeyName" width="200"></el-table-column>
        <el-table-column label="描述信息" prop="Description" show-overflow-tooltip></el-table-column>
        <el-table-column label="启用状态" width="120" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.Enabled" @change="handleStatusChange(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.CreateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="180">
          <template #default="scope">
            {{ scope.row.ExpireTime ? formatDate(scope.row.ExpireTime) : '永不过期' }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="CreatedBy" width="120"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" icon="Edit" @click="showEditDialog(scope.row)"></el-button>
              <el-button type="danger" size="small" icon="Delete" @click="removeApiKey(scope.row.ItemId)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建密钥对话框 -->
    <ApiKeyAddDialog v-model="addDialogVisible" :form="addForm" @created="onApiKeyCreated" />

    <!-- 修改密钥对话框 -->
    <ApiKeyEditDialog v-model="editDialogVisible" :form="editForm" @success="getApiKeyList" />

    <!-- 显示SecretKey对话框 -->
    <ApiKeySecretDialog v-model="secretKeyDialogVisible" :data="secretKeyData" />
  </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiKeyList, updateApiKey, deleteApiKey } from '@/api/apikey'
import ApiKeyAddDialog from './components/ApiKeyAddDialog.vue'
import ApiKeyEditDialog from './components/ApiKeyEditDialog.vue'
import ApiKeySecretDialog from './components/ApiKeySecretDialog.vue'

export default defineComponent({
  name: 'ApiKeyManagement',
  components: {
    ApiKeyAddDialog,
    ApiKeyEditDialog,
    ApiKeySecretDialog
  },
  setup() {
    const loading = ref(false)
    const apiKeyList = ref([])

    // 查询参数
    const queryInfo = reactive({
      KeyName: '',
      Enabled: undefined
    })

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
      getApiKeyList: getApiKeyListData,
      addDialogVisible,
      addForm,
      showAddDialog,
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
  padding: 20px;
}

.table-card {
  min-height: 100%;
}

.table-wrapper {
  margin-top: 20px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.el-table) {
  font-size: 14px;
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
