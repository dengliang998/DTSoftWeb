<template>
  <el-dialog
    :title="title"
    :model-value="modelValue"
    width="60%"
    align-center
    center
    class="user-picker-dialog"
    @close="handleClose"
  >
    <div class="picker-body">
      <el-card class="left-card">
        <template #header>
          <div class="card-header">
            <span>部门</span>
          </div>
        </template>
        <el-tree
          ref="deptTreeRef"
          :data="deptTree"
          :props="{ label: 'OuName', children: 'Children' }"
          node-key="ItemId"
          highlight-current
          default-expand-all
          @node-click="handleDeptClick"
        />
      </el-card>

      <el-card class="right-card">
        <template #header>
          <div class="card-header">
            <span>{{ currentDeptName || '请选择左侧部门' }}</span>
          </div>
        </template>

        <el-row :gutter="12" class="toolbar">
          <el-col :span="10">
            <el-input v-model="queryInfo.query" clearable placeholder="请输入用户账号或姓名" @clear="getUserList">
              <template #append>
                <el-button :icon="Search" @click="getUserList" />
              </template>
            </el-input>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="userList" border stripe class="table-wrapper" @row-dblclick="selectRow">
          <el-table-column label="账号" prop="Account" width="180" />
          <el-table-column label="用户名" prop="DisplayName" />
          <el-table-column label="职位" prop="Position" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                :disabled="excludeAccount && scope.row.Account === excludeAccount"
                @click="selectRow(scope.row)"
              >
                选择
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="pager"
          :current-page="queryInfo.pagenum"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="queryInfo.pagesize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </el-card>
    </div>
  </el-dialog>
</template>

<script>
import { getAllOus } from '@/api/organization'
import { getUserList } from '@/api/user'
import { Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'UserPickerDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '选择人员' },
    excludeAccount: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      Search: markRaw(Search),
      deptTree: [],
      currentDeptId: null,
      currentDeptName: '',
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 10
      },
      userList: [],
      total: 0,
      loading: false
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.init()
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:modelValue', false)
    },
    async init() {
      await this.getDeptTree()
      this.userList = []
      this.total = 0
      this.currentDeptId = null
      this.currentDeptName = ''
      this.queryInfo.query = ''
      this.queryInfo.pagenum = 1
    },
    async getDeptTree() {
      try {
        const { data: res } = await getAllOus()
        if (res && res.success) {
          this.deptTree = res.data || []
        } else {
          this.$message.error('获取部门列表失败:' + (res?.Msg || ''))
        }
      } catch (e) {
        this.$message.error('获取部门列表失败,请稍后重试!')
      }
    },
    handleDeptClick(data) {
      this.currentDeptId = data.ItemId
      this.currentDeptName = data.OuName
      this.queryInfo.pagenum = 1
      this.getUserList()
    },
    async getUserList() {
      if (!this.currentDeptId) {
        this.userList = []
        this.total = 0
        return
      }
      try {
        this.loading = true
        const { data: res } = await getUserList({
          keyword: this.queryInfo.query,
          pageNum: this.queryInfo.pagenum,
          pageSize: this.queryInfo.pagesize,
          ouId: this.currentDeptId
        })
        if (res && res.success) {
          const rows = res.data || []
          this.userList = rows
          this.total = res.Total || 0
        } else {
          this.userList = []
          this.total = 0
          this.$message.error('用户列表获取失败:' + (res?.Msg || ''))
        }
      } catch (e) {
        this.$message.error('用户列表获取失败,请稍后重试!')
      } finally {
        this.loading = false
      }
    },
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.queryInfo.pagenum = 1
      this.getUserList()
    },
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getUserList()
    },
    selectRow(row) {
      if (!row || !row.Account) return
      if (this.excludeAccount && row.Account === this.excludeAccount) {
        return this.$message.warning('直属主管不能是自己')
      }
      this.$emit('select', row)
      this.$emit('update:modelValue', false)
    }
  }
}
</script>

<style scoped>
.user-picker-dialog :deep(.el-dialog__header) {
  padding: 10px 16px 6px;
  margin-right: 0;
}
.user-picker-dialog :deep(.el-dialog__title) {
  font-size: 14px;
  line-height: 20px;
}
.user-picker-dialog :deep(.el-dialog__headerbtn) {
  top: 10px;
}
.user-picker-dialog :deep(.el-dialog__body) {
  padding: 8px 16px 14px;
}

.picker-body {
  display: flex;
  gap: 12px;
  height: 460px;
}
.left-card {
  width: 260px;
  height: 100%;
  overflow: hidden;
}
.left-card :deep(.el-card__body) {
  height: calc(100% - 56px);
  overflow: auto;
  padding: 8px;
}
.right-card {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
.right-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
  overflow: hidden;
  padding: 8px;
}
.toolbar {
  margin-bottom: 8px;
}
.table-wrapper {
  flex: 1;
  min-height: 0;
}
.pager {
  margin-top: 8px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
