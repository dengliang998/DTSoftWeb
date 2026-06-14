<template>
  <div class="apikey-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input 
            v-model="queryInfo.KeyName" 
            placeholder="请输入密钥名称" 
            clearable 
            @clear="getApiKeyList"
          >
            <template #append>
              <el-button icon="Search" @click="getApiKeyList"></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="queryInfo.Enabled" placeholder="启用状态" clearable @change="getApiKeyList" style="width: 100%;">
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
        :data="apiKeyList" 
        :row-style="{ height: '40px' }" 
        :cell-style="{ padding: '0px' }"
        border 
        stripe 
        class="table-wrapper"
        v-loading="loading"
      >
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="密钥名称" prop="KeyName" width="200"></el-table-column>
        <el-table-column label="描述信息" prop="Description" show-overflow-tooltip></el-table-column>
        <el-table-column label="启用状态" width="120" align="center">
          <template v-slot:default="scope">
            <el-switch 
              v-model="scope.row.Enabled" 
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template v-slot:default="scope">
            {{ formatDate(scope.row.CreateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="180">
          <template v-slot:default="scope">
            {{ scope.row.ExpireTime ? formatDate(scope.row.ExpireTime) : '永不过期' }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="CreatedBy" width="120"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template v-slot:default="scope">
            <div class="operation-buttons">
              <el-button type="primary" size="small" icon="Edit" @click="showEditDialog(scope.row)"></el-button>
              <el-button type="danger" size="small" icon="Delete" @click="removeApiKey(scope.row.ItemId)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建密钥对话框 -->
    <el-dialog title="创建API密钥" v-model="addDialogVisible" width="50%" @close="addDialogClosed">
      <el-form :model="addForm" ref="addFormRef" label-width="100px">
        <el-form-item label="密钥名称" prop="KeyName" :rules="[
          { required: true, message: '密钥名称不能为空', trigger: 'blur' },
          { max: 100, message: '密钥名称最多100字符', trigger: 'blur' }
        ]">
          <el-input v-model="addForm.KeyName" placeholder="请填写密钥名称（唯一）"></el-input>
        </el-form-item>
        <el-form-item label="描述信息" prop="Description" :rules="[
          { max: 500, message: '描述信息最多500字符', trigger: 'blur' }
        ]">
          <el-input v-model="addForm.Description" type="textarea" :rows="3" placeholder="请填写描述信息（可选）"></el-input>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker 
            v-model="addForm.ExpireTime" 
            type="datetime" 
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addApiKey">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改密钥对话框 -->
    <el-dialog title="修改API密钥" v-model="editDialogVisible" width="50%" @close="editDialogClosed">
      <el-form :model="editForm" ref="editFormRef" label-width="100px">
        <el-form-item label="密钥名称">
          <el-input v-model="editForm.KeyName" disabled></el-input>
        </el-form-item>
        <el-form-item label="描述信息" prop="Description" :rules="[
          { max: 500, message: '描述信息最多500字符', trigger: 'blur' }
        ]">
          <el-input v-model="editForm.Description" type="textarea" :rows="3" placeholder="请填写描述信息"></el-input>
        </el-form-item>
        <el-form-item label="启用状态" prop="Enabled" :rules="[
          { required: true, message: '请选择启用状态', trigger: 'change' }
        ]">
          <el-switch v-model="editForm.Enabled" active-text="启用" inactive-text="禁用"></el-switch>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker 
            v-model="editForm.ExpireTime" 
            type="datetime" 
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="editApiKey">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 显示SecretKey对话框 -->
    <el-dialog title="API密钥创建成功" v-model="secretKeyDialogVisible" width="60%" @close="secretKeyDialogVisible = false">
      <el-alert 
        title="请妥善保管您的SecretKey！" 
        type="warning" 
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #default>
          <p>SecretKey仅在创建时显示一次，请务必妥善保存。如果遗失，请重新创建新的密钥。</p>
        </template>
      </el-alert>
      
      <el-descriptions :column="1" border>
        <el-descriptions-item label="密钥名称">{{ secretKeyData.KeyName }}</el-descriptions-item>
        <el-descriptions-item label="SecretKey">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input v-model="secretKeyData.SecretKey" readonly></el-input>
            <el-button type="primary" @click="copySecretKey">复制</el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert 
        title="安全建议" 
        type="info" 
        :closable="false"
        show-icon
        style="margin-top: 20px;"
      >
        <template #default>
          <ul style="margin: 0; padding-left: 20px;">
            <li>请安全存储SecretKey，建议使用环境变量或密钥管理服务</li>
            <li>不要在前端代码中硬编码SecretKey</li>
            <li>定期更换API密钥</li>
            <li>发现泄露请立即禁用并重新生成</li>
          </ul>
        </template>
      </el-alert>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="secretKeyDialogVisible = false">我已妥善保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiKeyList, createApiKey, updateApiKey, deleteApiKey } from '@/api/apikey'

export default defineComponent({
  name: 'ApiKeyManagement',
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
    const addFormRef = ref(null)
    const addForm = reactive({
      KeyName: '',
      Description: '',
      ExpireTime: ''
    })

    // 编辑对话框
    const editDialogVisible = ref(false)
    const editFormRef = ref(null)
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
    const addDialogClosed = () => {
      addForm.KeyName = ''
      addForm.Description = ''
      addForm.ExpireTime = ''
      if (addFormRef.value) {
        addFormRef.value.resetFields()
      }
    }

    // 创建API密钥
    const addApiKey = async () => {
      if (!addFormRef.value) return
      
      await addFormRef.value.validate(async (valid) => {
        if (!valid) return

        try {
          const data = {
            KeyName: addForm.KeyName
          }
          if (addForm.Description) {
            data.Description = addForm.Description
          }
          if (addForm.ExpireTime) {
            data.ExpireTime = addForm.ExpireTime
          }

          const response = await createApiKey(data)
          if (response.data.Code === 200) {
            ElMessage.success('创建成功')
            addDialogVisible.value = false
            
            // 显示SecretKey
            const resultData = response.data.Data
            secretKeyData.KeyName = resultData.KeyName
            secretKeyData.SecretKey = resultData.SecretKey
            secretKeyDialogVisible.value = true
            
            // 刷新列表
            getApiKeyListData()
          } else {
            ElMessage.error(response.data.Message || '创建失败')
          }
        } catch (error) {
          ElMessage.error('创建失败：' + (error.response?.data?.Message || error.message))
        }
      })
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
    const editDialogClosed = () => {
      if (editFormRef.value) {
        editFormRef.value.resetFields()
      }
    }

    // 更新API密钥
    const editApiKey = async () => {
      if (!editFormRef.value) return
      
      await editFormRef.value.validate(async (valid) => {
        if (!valid) return

        try {
          const data = {
            ItemId: editForm.ItemId,
            Enabled: editForm.Enabled
          }
          if (editForm.Description) {
            data.Description = editForm.Description
          }
          if (editForm.ExpireTime) {
            data.ExpireTime = editForm.ExpireTime
          }

          const response = await updateApiKey(data)
          if (response.data.Code === 200) {
            ElMessage.success('更新成功')
            editDialogVisible.value = false
            getApiKeyListData()
          } else {
            ElMessage.error(response.data.Message || '更新失败')
          }
        } catch (error) {
          ElMessage.error('更新失败：' + (error.response?.data?.Message || error.message))
        }
      })
    }

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
    const copySecretKey = async () => {
      try {
        await navigator.clipboard.writeText(secretKeyData.SecretKey)
        ElMessage.success('已复制到剪贴板')
      } catch (error) {
        ElMessage.error('复制失败，请手动复制')
      }
    }

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
      addFormRef,
      addForm,
      showAddDialog,
      addDialogClosed,
      addApiKey,
      editDialogVisible,
      editFormRef,
      editForm,
      showEditDialog,
      editDialogClosed,
      editApiKey,
      handleStatusChange,
      removeApiKey,
      secretKeyDialogVisible,
      secretKeyData,
      copySecretKey,
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
