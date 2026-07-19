<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择用户"
    width="72%"
    align-center
    class="user-selector-dialog"
    @close="handleClose"
  >
    <div class="user-selector-container">
      <aside class="selector-panel dt-panel dept-tree-section">
        <div class="selector-panel__header dt-panel__header">
          <div>
            <strong>部门列表</strong>
            <span>{{ deptTree.length }} 个根部门</span>
          </div>
        </div>
        <div class="dept-tree-scroll">
          <el-tree
            ref="deptTreeRef"
            :data="deptTree"
            :props="{ label: 'OuName', children: 'Children' }"
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
      </aside>

      <section class="selector-panel dt-panel user-list-section">
        <div class="selector-panel__header dt-panel__header">
          <div>
            <strong>{{ currentDeptName || '用户列表' }}</strong>
            <span>{{ currentDeptName ? '当前部门用户' : '选择左侧部门后筛选' }}</span>
          </div>
          <div class="selected-summary dt-panel__meta">
            <span class="dt-chip dt-chip--success">已选 {{ selectedRows.length }}</span>
            <el-button
              class="dt-ghost-action selector-clear-button"
              size="small"
              :disabled="selectedRows.length === 0"
              @click="clearSelection"
            >
              清空
            </el-button>
          </div>
        </div>

        <div class="user-toolbar">
          <el-input
            v-model="queryInfo.Keyword"
            class="user-search dt-search"
            placeholder="搜索用户账号或姓名"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table
          ref="userTableRef"
          v-loading="loading"
          :data="userList"
          :row-class-name="getRowClassName"
          :row-style="{ height: '46px' }"
          :cell-style="{ padding: '0px' }"
          class="user-table dt-table"
          empty-text="暂无用户"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
        >
          <el-table-column type="selection" width="52" :selectable="isRowSelectable"></el-table-column>
          <el-table-column label="账号" prop="Account" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <code class="dt-code">{{ row.Account || '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="用户名" prop="DisplayName" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="user-name">{{ row.DisplayName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="职位" prop="Position" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="dt-muted-pill">{{ row.Position || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96" align="center">
            <template #default="{ row }">
              <span :class="getStatusClass(row)">{{ getStatusText(row) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="user-pagination dt-pagination"
          :current-page="queryInfo.PageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryInfo.PageSize"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="footer-hint">点击行即可选择，翻页后保留已选用户。</span>
        <div class="footer-actions">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleConfirm">
            确定 {{ selectedRows.length ? `(${selectedRows.length})` : '' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { getAllOus } from '@/api/organization'
import { getUserList } from '@/api/user'
import { OfficeBuilding, Search } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'UserSelector',
  components: {
    OfficeBuilding,
    Search
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedUsers: {
      type: Array,
      default: () => []
    },
    multiple: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:visible', 'confirm'],
  data() {
    return {
      OfficeBuilding: markRaw(OfficeBuilding),
      Search: markRaw(Search),
      dialogVisible: this.visible,
      loading: false,
      syncingSelection: false,
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
  computed: {
    selectedAccountSet() {
      return new Set((this.selectedUsers || []).map((user) => user.Account).filter(Boolean))
    },
    selectedRowAccountSet() {
      return new Set(this.selectedRows.map((user) => user.Account).filter(Boolean))
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
      this.selectedRows = []
      await this.loadDeptTree()
      await this.loadUsers()
    },

    async loadDeptTree() {
      try {
        const { data: res } = await getAllOus()
        if (res.success) {
          this.deptTree = res.data || []
          this.expandedDeptKeys = this.deptTree.map((item) => item.ItemId)
        } else {
          this.$message.error('部门树加载失败：' + (res.Msg || res.message))
        }
      } catch (error) {
        console.error('部门树加载失败:', error)
        this.$message.error('部门树加载失败，请稍后重试')
      }
    },

    async loadUsers() {
      this.loading = true
      try {
        const { data: res } = await getUserList({
          keyword: this.queryInfo.Keyword,
          pageNum: this.queryInfo.PageNum,
          pageSize: this.queryInfo.PageSize,
          ouId: this.currentDeptId
        })
        if (res.success) {
          this.userList = res.data || []
          this.total = res.Total || 0
          this.$nextTick(() => this.syncTableSelection())
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

    handleDeptClick(data) {
      this.currentDeptId = data.ItemId
      this.currentDeptName = data.OuName
      this.queryInfo.DeptId = data.ItemId
      this.queryInfo.PageNum = 1
      this.loadUsers()
    },

    handleSearch() {
      this.queryInfo.PageNum = 1
      this.loadUsers()
    },

    handleSelectionChange(selection) {
      if (this.syncingSelection) return

      const selectableSelection = selection.filter((row) => this.isRowSelectable(row))

      if (this.multiple) {
        const currentPageAccounts = new Set(this.userList.map((user) => user.Account).filter(Boolean))
        const preservedRows = this.selectedRows.filter((user) => !currentPageAccounts.has(user.Account))
        this.selectedRows = this.mergeUsersByAccount([...preservedRows, ...selectableSelection])
        return
      }

      this.selectedRows = selectableSelection.slice(-1)
      this.$nextTick(() => this.syncTableSelection())
    },

    handleRowClick(row, column) {
      if (column?.type === 'selection') return
      if (!this.isRowSelectable(row)) return
      if (!this.multiple) {
        this.selectedRows = this.isNewlySelected(row) ? [] : [row]
        this.$nextTick(() => this.syncTableSelection())
        return
      }
      this.$refs.userTableRef?.toggleRowSelection(row, !this.isNewlySelected(row))
    },

    clearSelection() {
      this.selectedRows = []
      this.$nextTick(() => this.syncTableSelection())
    },

    syncTableSelection() {
      const table = this.$refs.userTableRef
      if (!table) return

      this.syncingSelection = true
      table.clearSelection()
      this.userList.forEach((row) => {
        if (this.isNewlySelected(row) && this.isRowSelectable(row)) {
          table.toggleRowSelection(row, true)
        }
      })
      this.$nextTick(() => {
        this.syncingSelection = false
      })
    },

    mergeUsersByAccount(users) {
      const accountMap = new Map()
      users.forEach((user) => {
        if (user?.Account) {
          accountMap.set(user.Account, user)
        }
      })
      return Array.from(accountMap.values())
    },

    isAlreadySelected(row) {
      return Boolean(row?.Account && this.selectedAccountSet.has(row.Account))
    },

    isNewlySelected(row) {
      return Boolean(row?.Account && this.selectedRowAccountSet.has(row.Account))
    },

    isRowSelectable(row) {
      return !this.isAlreadySelected(row)
    },

    getRowClassName({ row }) {
      if (this.isAlreadySelected(row)) return 'is-already-selected'
      return this.isNewlySelected(row) ? 'is-newly-selected' : ''
    },

    getStatusText(row) {
      if (this.isAlreadySelected(row)) return '已添加'
      return this.isNewlySelected(row) ? '已选择' : '可选择'
    },

    getStatusClass(row) {
      if (this.isAlreadySelected(row)) return 'dt-badge dt-badge--warning'
      return this.isNewlySelected(row) ? 'dt-badge dt-badge--success' : 'dt-badge dt-badge--neutral'
    },

    handleSizeChange(newSize) {
      this.queryInfo.PageSize = newSize
      this.queryInfo.PageNum = 1
      this.loadUsers()
    },

    handleCurrentChange(newPage) {
      this.queryInfo.PageNum = newPage
      this.loadUsers()
    },

    handleConfirm() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请至少选择一个用户')
        return
      }
      this.$emit('confirm', this.selectedRows)
      this.dialogVisible = false
    },

    handleClose() {
      this.currentDeptId = ''
      this.currentDeptName = ''
      this.queryInfo = {
        Keyword: '',
        PageNum: 1,
        PageSize: 10,
        DeptId: ''
      }
      this.userList = []
      this.total = 0
      this.selectedRows = []
    }
  }
}
</script>

<style scoped>
.user-selector-dialog :deep(.el-dialog) {
  max-width: 1180px;
  border-radius: 10px;
  overflow: hidden;
}

.user-selector-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #e5edf5;
}

.user-selector-dialog :deep(.el-dialog__title) {
  position: relative;
  padding-left: 18px;
  color: #172033;
  font-size: 18px;
  font-weight: 760;
  line-height: 24px;
}

.user-selector-dialog :deep(.el-dialog__title::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 5px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--dt-primary-light) 0%, var(--dt-primary) 100%);
}

.user-selector-dialog :deep(.el-dialog__headerbtn) {
  top: 13px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f6fb;
}

.user-selector-dialog :deep(.el-dialog__body) {
  padding: 14px 22px 16px;
  background: #f5f8fb;
}

.user-selector-dialog :deep(.el-dialog__footer) {
  padding: 12px 22px;
  border-top: 1px solid #e5edf5;
  background: #f7fafc;
}

.user-selector-container {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 12px;
  height: min(620px, calc(100vh - 210px));
  min-height: 430px;
}

.selector-panel.dt-panel {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.dept-tree-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.custom-tree-node {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}

.custom-tree-node span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-icon {
  color: var(--dt-primary);
}

.user-toolbar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5edf5;
}

.selected-summary {
  flex-wrap: nowrap;
}

.user-table {
  --el-table-row-hover-bg-color: #f7fbfb;
}

.user-table :deep(.is-already-selected > td) {
  color: #98a2b3;
  background: #fafbfc !important;
}

.user-table :deep(.is-newly-selected > td) {
  background: #f8fffd !important;
}

.user-name {
  color: #172033;
  font-weight: 720;
}

.user-pagination {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.footer-hint {
  color: #667085;
  font-size: 12px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-selector-dialog :deep(.el-button--primary) {
  min-height: 36px;
  border: 0 !important;
  border-radius: 8px !important;
  background: var(--dt-primary) !important;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--dt-primary) 20%, transparent) !important;
  font-weight: 740 !important;
}

.user-selector-dialog :deep(.el-button--primary:hover) {
  background: var(--dt-primary-hover) !important;
}

.user-selector-dialog :deep(.el-button.is-disabled),
.user-selector-dialog :deep(.el-button.is-disabled:hover) {
  color: #b4bdc9 !important;
  border-color: #e2e8f0 !important;
  background: #f7f9fc !important;
  box-shadow: none !important;
}

.selector-clear-button {
  min-height: 30px !important;
  padding: 0 10px !important;
}

:deep(.el-tree) {
  background-color: transparent;
}

:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 7px;
}

:deep(.el-tree-node__content:hover),
:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  color: var(--dt-primary);
  background: var(--dt-primary-soft);
}

@media (max-width: 900px) {
  .user-selector-container {
    grid-template-columns: 1fr;
    height: min(680px, calc(100vh - 180px));
  }

  .dept-tree-section {
    min-height: 160px;
    max-height: 220px;
  }

  .user-toolbar,
  .dialog-footer {
    grid-template-columns: 1fr;
    align-items: stretch;
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>
