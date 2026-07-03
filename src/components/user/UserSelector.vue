<template>
  <el-dialog v-model="dialogVisible" title="选择用户" width="60%" @close="handleClose">
    <div class="user-selector-container">
      <el-row :gutter="20">
        <!-- 左侧部门树 -->
        <el-col :span="8">
          <div class="dept-tree-section">
            <h4>部门列表</h4>
            <el-tree
              ref="deptTreeRef"
              :data="deptTree"
              :props="{ label: 'DepartmentName', children: 'Children' }"
              node-key="ItemId"
              highlight-current
              :default-expanded-keys="expandedDeptKeys"
              @node-click="handleDeptClick"
            >
              <template #default="{ node }">
                <span class="custom-tree-node">
                  <el-icon class="tree-node-icon">
                    <OfficeBuilding />
                  </el-icon>
                  <span>{{ node.label }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-col>

        <!-- 右侧用户列表 -->
        <el-col :span="16">
          <div class="user-list-section">
            <h4>用户列表 {{ currentDeptName ? '- ' + currentDeptName : '' }}</h4>
            <el-input
              v-model="queryInfo.Keyword"
              placeholder="搜索用户账号或姓名"
              clearable
              size="small"
              style="margin-bottom: 10px"
              @clear="loadUsers"
              @keyup.enter="loadUsers"
            >
              <template #append>
                <el-button :icon="Search" size="small" @click="loadUsers"></el-button>
              </template>
            </el-input>
            <el-table
              v-loading="loading"
              :data="userList"
              border
              stripe
              height="220"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column label="账号" prop="Account" show-overflow-tooltip></el-table-column>
              <el-table-column label="用户名" prop="DisplayName" show-overflow-tooltip></el-table-column>
              <el-table-column label="职位" prop="Position" show-overflow-tooltip></el-table-column>
            </el-table>
            <el-pagination
              :current-page="queryInfo.PageNum"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="queryInfo.PageSize"
              layout="total, sizes, prev, pager, next"
              :total="total"
              style="margin-top: 10px; justify-content: flex-end"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            ></el-pagination>
          </div>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import axios from '@/api/http'
import { Search, OfficeBuilding } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'UserSelector',
  components: {
    Search,
    OfficeBuilding
  },
  props: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      default: false
    },
    // 已选择的用户列表（用于回显或排除）
    selectedUsers: {
      type: Array,
      default: () => []
    },
    // 是否多选
    multiple: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:visible', 'confirm'],
  data() {
    return {
      // 图标 (使用 markRaw 避免响应式警告)
      Search: markRaw(Search),
      OfficeBuilding: markRaw(OfficeBuilding),

      dialogVisible: false,
      loading: false,
      deptTree: [],
      expandedDeptKeys: [],
      currentDeptId: '',
      currentDeptName: '',
      queryInfo: {
        Keyword: '',
        PageNum: 1,
        PageSize: 10,
        DeptId: ''
      },
      userList: [],
      total: 0,
      selectedRows: []
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.initData()
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  },
  methods: {
    async initData() {
      await this.loadDeptTree()
      await this.loadUsers()
    },

    // 加载部门树
    async loadDeptTree() {
      try {
        const { data: res } = await axios.get('/api/Department/GetAllDepartments')
        if (res.success) {
          this.deptTree = res.data || []
          // 默认展开第一层
          this.expandedDeptKeys = this.deptTree.map((item) => item.ItemId)
        } else {
          this.$message.error('部门树加载失败：' + (res.Msg || res.message))
        }
      } catch (error) {
        console.error('部门树加载失败:', error)
        this.$message.error('部门树加载失败，请稍后重试')
      }
    },

    // 加载用户列表
    async loadUsers() {
      this.loading = true
      try {
        const params = new URLSearchParams()
        params.append('Keyword', this.queryInfo.Keyword || '')
        params.append('PageNum', this.queryInfo.PageNum)
        params.append('PageSize', this.queryInfo.PageSize)
        if (this.currentDeptId) {
          params.append('DepartmentId', this.currentDeptId)
        }

        const { data: res } = await axios.post('/api/User/GetUserList', params)
        if (res.success) {
          this.userList = res.data || []
          this.total = res.Total || 0
        } else {
          this.$message.error('用户列表加载失败：' + (res.Msg || res.message))
        }
      } catch (error) {
        console.error('用户列表加载失败:', error)
        this.$message.error('用户列表加载失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 部门点击事件
    handleDeptClick(data) {
      this.currentDeptId = data.ItemId
      this.currentDeptName = data.DepartmentName
      this.queryInfo.DeptId = data.ItemId
      this.queryInfo.PageNum = 1
      this.loadUsers()
    },

    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 分页 - 每页数量变化
    handleSizeChange(newSize) {
      this.queryInfo.PageSize = newSize
      this.queryInfo.PageNum = 1
      this.loadUsers()
    },

    // 分页 - 页码变化
    handleCurrentChange(newPage) {
      this.queryInfo.PageNum = newPage
      this.loadUsers()
    },

    // 确认选择
    handleConfirm() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请至少选择一个用户')
        return
      }
      this.$emit('confirm', this.selectedRows)
      this.dialogVisible = false
    },

    // 关闭对话框
    handleClose() {
      // 重置数据
      this.currentDeptId = ''
      this.currentDeptName = ''
      this.queryInfo = {
        Keyword: '',
        PageNum: 1,
        PageSize: 10,
        DeptId: ''
      }
      this.selectedRows = []
    }
  }
}
</script>

<style scoped>
.user-selector-container {
  min-height: 280px;
}

.dept-tree-section,
.user-list-section {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.dept-tree-section h4,
.user-list-section h4 {
  margin: 0 0 10px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  font-size: 14px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tree-node-icon {
  color: #409eff;
}

:deep(.el-tree) {
  background-color: transparent;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-pagination) {
  display: flex;
}
</style>
