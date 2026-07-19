<template>
  <div class="organization-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>组织架构</h1>
          <p>维护部门层级、成员信息和账号状态。右键部门可快速编辑结构。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getDeptTree(true)">刷新组织</el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDeptDialog">新增部门</el-button>
        </div>
      </div>

      <div class="dt-toolbar">
        <el-input
          v-model="queryInfo.query"
          clearable
          class="dt-search"
          placeholder="搜索用户账号、姓名或邮箱"
          @clear="getUserList"
          @keyup.enter="getUserList"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="dt-filter-tabs">
          <button
            v-for="item in userFilterOptions"
            :key="item.value"
            type="button"
            :class="['dt-filter-tab', { 'is-active': activeUserFilter === item.value }]"
            @click="activeUserFilter = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="dt-toolbar-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getUserList">刷新用户</el-button>
          <el-button type="primary" :icon="Plus" @click="showAddUserDialog">添加用户</el-button>
        </div>
      </div>

      <div class="dt-split-workspace">
        <div class="dt-panel dt-side-panel dept-tree-panel">
          <div class="dt-panel__header">
            <div>
              <strong>部门结构</strong>
              <span>{{ deptSummaryText }}</span>
            </div>
            <div class="dt-panel__meta">
              <span class="dt-chip">部门 {{ deptStats.total }}</span>
              <el-button class="dt-ghost-action dept-reset-button" size="small" @click="resetDeptSelection">
                全部
              </el-button>
            </div>
          </div>

          <div class="dt-tree-scroll">
            <el-tree
              ref="deptTreeRef"
              class="dept-tree"
              :data="deptTree"
              :props="{ label: 'OuName', children: 'Children' }"
              node-key="ItemId"
              highlight-current
              @node-click="handleDeptClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node" @contextmenu.prevent="showContextMenu($event, data)">
                  <span class="tree-node-label">
                    <el-icon class="tree-node-icon">
                      <OfficeBuilding />
                    </el-icon>
                    {{ node.label }}
                  </span>
                </div>
              </template>
            </el-tree>
          </div>

          <!-- 右键菜单 -->
          <div
            v-show="contextMenuVisible"
            class="context-menu"
            :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
            @click.stop
          >
            <div class="context-menu-item" @click="handleEditDept">
              <el-icon><Edit /></el-icon>
              <span>编辑部门</span>
            </div>
            <div class="context-menu-item" @click="handleAddChildDept">
              <el-icon><Plus /></el-icon>
              <span>添加子部门</span>
            </div>
            <div class="context-menu-item delete" @click="handleDeleteDept">
              <el-icon><Delete /></el-icon>
              <span>删除部门</span>
            </div>
          </div>
        </div>

        <div class="dt-panel user-list-panel">
          <div class="dt-panel__header">
            <div>
              <strong>{{ currentDeptName || '全部用户' }}</strong>
              <span>{{ userSummaryText }}</span>
            </div>
            <div class="dt-panel__meta">
              <span class="dt-chip">本页 {{ userStats.total }}</span>
              <span class="dt-chip dt-chip--success">启用 {{ userStats.enabled }}</span>
              <span class="dt-chip dt-chip--warning">禁用 {{ userStats.disabled }}</span>
            </div>
          </div>

          <el-table
            :data="filteredUserList"
            :row-style="{ height: '52px' }"
            :cell-style="{ padding: '0px' }"
            class="table-wrapper dt-table"
            empty-text="暂无匹配用户"
          >
            <el-table-column label="#" width="72" align="center">
              <template #default="scope">
                <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="用户" prop="DisplayName" min-width="220">
              <template #default="scope">
                <div class="dt-name-cell">
                  <span class="dt-icon-shell user-avatar-shell">
                    <el-icon><UserFilled /></el-icon>
                  </span>
                  <span class="dt-name-copy">
                    <strong>{{ scope.row.DisplayName || scope.row.Account }}</strong>
                    <small>{{ scope.row.Account || '未设置账号' }}</small>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="性别" prop="Sex" width="86">
              <template #default="scope">
                <span class="dt-badge dt-badge--neutral">{{ SetSex(scope.row, null, scope.row.Sex) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="职位" prop="Position" min-width="130">
              <template #default="scope">
                <span class="dt-muted-pill">{{ scope.row.Position || '未设置' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="邮箱" prop="Email" min-width="220">
              <template #default="scope">
                <code class="dt-code">{{ scope.row.Email || '未设置' }}</code>
              </template>
            </el-table-column>
            <el-table-column label="直属主管" prop="SupervisorDisplayName" min-width="160">
              <template #default="scope">
                <span class="dt-muted-pill">
                  {{ scope.row.SupervisorDisplayName || scope.row.SupervisorAcc || '未设置' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="scope">
                <span :class="['dt-badge', scope.row.Disable ? 'dt-badge--warning' : 'dt-badge--success']">
                  {{ scope.row.Disable ? '禁用' : '启用' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="禁用" width="86" align="center">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.Disable"
                  :disabled="scope.row.Account == 'Admin' || scope.row.Account == 'admin'"
                  @change="userStateChanged(scope.row.Account, scope.row.Disable)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="132" align="right">
              <template #default="scope">
                <div class="dt-operation-buttons">
                  <el-tooltip content="编辑用户" placement="top">
                    <el-button
                      class="dt-icon-action dt-icon-action--edit"
                      :icon="Edit"
                      @click="showEditUserDialog(scope.row.Account)"
                    />
                  </el-tooltip>
                  <el-tooltip content="重置密码" placement="top">
                    <el-button
                      class="dt-icon-action"
                      :icon="Unlock"
                      @click="showResetPasswordDialog(scope.row.Account)"
                    />
                  </el-tooltip>
                  <el-tooltip content="删除用户" placement="top">
                    <el-button
                      class="dt-icon-action dt-icon-action--danger"
                      :icon="Delete"
                      :disabled="scope.row.Account == 'admin' || scope.row.Account == 'Admin'"
                      @click="removeUserById(scope.row.Account)"
                    />
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            class="dt-pagination"
            :current-page="queryInfo.pagenum"
            :page-sizes="[1, 2, 5, 10]"
            :page-size="queryInfo.pagesize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </section>

    <!-- 部门管理对话框 -->
    <DeptDialog
      v-model="deptDialogVisible"
      :title="deptDialogTitle"
      :form="deptForm"
      :dept-tree-options="deptTreeOptions"
      :action="deptAction"
      @success="onDeptSaved"
    />

    <!-- 添加用户的对话框 -->
    <el-dialog
      v-model="UserAddDialogVisible"
      title="添加用户"
      width="760px"
      align-center
      class="user-form-dialog"
      @close="UserAddDialogClosed"
    >
      <UserInfo-components
        v-if="UserAddDialogVisible"
        ref="UserInfo"
        :Account="SelUser"
        OpenType="New"
        @oncallback="oncallback"
      ></UserInfo-components>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserAddDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="AddUser">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改用户的对话框 -->
    <el-dialog
      v-model="UserDialogVisible"
      title="修改用户"
      width="760px"
      align-center
      class="user-form-dialog"
      @close="UserDialogClosed"
    >
      <UserInfo-components
        v-if="UserDialogVisible"
        ref="UserInfo"
        :Account="SelUser"
        OpenType="Edit"
        @oncallback="oncallback"
      ></UserInfo-components>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="UserDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="UpdateUserInfo">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 密码重置对话框 -->
    <ResetPwdDialog v-model="ResetPwdDialogVisible" :form="ResetPwdForm" @success="onResetPwdSuccess" />
  </div>
</template>

<script>
import { createOu, deleteOu, getAllOus, updateOu } from '@/api/organization'
import { deleteUser, getUserList, modifyUserInfo } from '@/api/user'
import UserInfoComponents from '../../components/user/UserInfoComponents.vue'
import DeptDialog from './components/DeptDialog.vue'
import ResetPwdDialog from './components/ResetPwdDialog.vue'
import { Search, Plus, Edit, Delete, Unlock, OfficeBuilding, Refresh, UserFilled } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'Organization',
  components: {
    UserInfoComponents,
    DeptDialog,
    ResetPwdDialog,
    OfficeBuilding,
    UserFilled
  },
  data() {
    return {
      // 图标 (使用 markRaw 避免响应式警告)
      Search: markRaw(Search),
      Plus: markRaw(Plus),
      Edit: markRaw(Edit),
      Delete: markRaw(Delete),
      Unlock: markRaw(Unlock),
      Refresh: markRaw(Refresh),

      // 部门相关
      deptTree: [],
      deptTreeOptions: [],
      currentDeptId: null,
      currentDeptName: '',
      deptDialogVisible: false,
      deptDialogTitle: '',
      deptAction: '',
      deptForm: {
        ItemId: null,
        OuName: '',
        OuCode: '',
        ParentId: null,
        SortOrder: 0,
        Disable: false,
        Remark: ''
      },

      // 右键菜单
      contextMenuVisible: false,
      contextMenuLeft: 0,
      contextMenuTop: 0,
      contextMenuData: null,

      // 用户相关
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 10
      },
      activeUserFilter: 'all',
      userFilterOptions: [
        { label: '全部', value: 'all' },
        { label: '启用', value: 'enabled' },
        { label: '禁用', value: 'disabled' },
        { label: '管理员', value: 'admin' }
      ],
      userList: [],
      total: 0,
      ResetPwdDialogVisible: false,
      ResetPwdForm: { Account: '', NewPwd: '', ConfirmPwd: '' },
      SelUser: '',
      UserDialogVisible: false,
      UserAddDialogVisible: false,
      imageUrl: ''
    }
  },
  computed: {
    deptStats() {
      return {
        total: this.countDepartments(this.deptTree)
      }
    },
    deptSummaryText() {
      return this.currentDeptName ? `当前选中：${this.currentDeptName}` : '选择部门查看成员，右键管理部门'
    },
    filteredUserList() {
      if (this.activeUserFilter === 'enabled') return this.userList.filter((user) => !user.Disable)
      if (this.activeUserFilter === 'disabled') return this.userList.filter((user) => user.Disable)
      if (this.activeUserFilter === 'admin') {
        return this.userList.filter((user) =>
          ['admin', 'administrator'].includes(String(user.Account || '').toLowerCase())
        )
      }
      return this.userList
    },
    userStats() {
      return this.userList.reduce(
        (stats, user) => {
          stats.total += 1
          if (user.Disable) {
            stats.disabled += 1
          } else {
            stats.enabled += 1
          }
          return stats
        },
        { total: 0, enabled: 0, disabled: 0 }
      )
    },
    userSummaryText() {
      const count = this.filteredUserList.length
      if (count === this.userList.length) return `共 ${count} 人，服务端总数 ${this.total}`
      return `筛选出 ${count} / ${this.userList.length} 人，服务端总数 ${this.total}`
    }
  },
  created() {
    this.getDeptTree()
    this.getUserList()
  },
  methods: {
    // ========== 部门管理方法 ==========

    countDepartments(departments) {
      if (!Array.isArray(departments)) return 0
      return departments.reduce((count, item) => count + 1 + this.countDepartments(item.Children || []), 0)
    },

    resetDeptSelection() {
      this.currentDeptId = null
      this.currentDeptName = ''
      this.queryInfo.pagenum = 1
      if (this.$refs.deptTreeRef) {
        this.$refs.deptTreeRef.setCurrentKey(null)
      }
      this.getUserList()
    },

    // 获取所有部门树
    async getDeptTree(expandAll = false) {
      try {
        const { data: res } = await getAllOus()
        if (res.success) {
          this.deptTree = res.data || []
          this.deptTreeOptions = [...this.deptTree]

          // 如果需要展开全部节点
          if (expandAll) {
            this.$nextTick(() => {
              this.expandAllNodes()
            })
          }
        } else {
          this.$message.error('获取部门列表失败:' + res.Msg)
        }
      } catch (error) {
        this.$message.error('获取部门列表失败,请稍后重试!')
      }
    },

    // 展开所有节点
    expandAllNodes() {
      if (this.$refs.deptTreeRef) {
        const expandNode = (data) => {
          data.forEach((item) => {
            this.$refs.deptTreeRef.store.nodesMap[item.ItemId].expanded = true
            if (item.Children && item.Children.length > 0) {
              expandNode(item.Children)
            }
          })
        }
        expandNode(this.deptTree)
      }
    },

    // 点击部门节点
    handleDeptClick(data) {
      this.currentDeptId = data.ItemId
      this.currentDeptName = data.OuName
      this.queryInfo.pagenum = 1
      this.getUserList()
    },

    // 显示右键菜单
    showContextMenu(event, data) {
      this.contextMenuVisible = true
      this.contextMenuLeft = event.clientX
      this.contextMenuTop = event.clientY
      this.contextMenuData = data

      // 监听点击其他地方关闭菜单
      this.$nextTick(() => {
        document.addEventListener('click', this.closeContextMenu)
      })
    },

    // 关闭右键菜单
    closeContextMenu() {
      this.contextMenuVisible = false
      document.removeEventListener('click', this.closeContextMenu)
    },

    // 处理编辑部门
    handleEditDept() {
      this.closeContextMenu()
      this.showEditDeptDialog(this.contextMenuData)
    },

    // 处理添加子部门
    handleAddChildDept() {
      this.closeContextMenu()
      this.showAddChildDeptDialog(this.contextMenuData)
    },

    // 处理删除部门
    handleDeleteDept() {
      this.closeContextMenu()
      this.removeDept(this.contextMenuData.ItemId)
    },

    // 显示新增部门对话框
    showAddDeptDialog() {
      this.deptAction = 'add'
      this.deptDialogTitle = '新增部门'
      this.deptForm = {
        ItemId: null,
        OuName: '',
        OuCode: '',
        ParentId: null,
        SortOrder: 0,
        Disable: false,
        Remark: ''
      }
      this.deptDialogVisible = true
    },

    // 显示新增子部门对话框
    showAddChildDeptDialog(data) {
      this.deptAction = 'add'
      this.deptDialogTitle = '新增子部门'
      this.deptForm = {
        ItemId: null,
        OuName: '',
        OuCode: '',
        ParentId: data.ItemId,
        SortOrder: 0,
        Disable: false,
        Remark: ''
      }
      this.deptDialogVisible = true
    },

    // 显示编辑部门对话框
    showEditDeptDialog(data) {
      this.deptAction = 'edit'
      this.deptDialogTitle = '编辑部门'
      this.deptForm = { ...data }
      this.deptDialogVisible = true
    },

    // 保存部门
    async saveDept() {
      if (!this.deptForm.OuName) {
        return this.$message.error('部门名称不能为空')
      }

      try {
        const formData = new FormData()
        formData.append('OuName', this.deptForm.OuName)
        formData.append('OuCode', this.deptForm.OuCode || '')
        formData.append('ParentId', this.deptForm.ParentId || 0)
        formData.append('SortOrder', this.deptForm.SortOrder || 0)
        formData.append('Disable', this.deptForm.Disable || false)
        formData.append('Remark', this.deptForm.Remark || '')

        let res
        if (this.deptAction === 'add') {
          res = await createOu(formData)
        } else {
          formData.append('ItemId', this.deptForm.ItemId)
          res = await updateOu(formData)
        }

        if (res.data.success) {
          this.$message.success(this.deptAction === 'add' ? '新增部门成功' : '编辑部门成功')
          this.deptDialogVisible = false

          // 保存当前展开的节点
          const expandedKeys = []
          if (this.$refs.deptTreeRef) {
            Object.keys(this.$refs.deptTreeRef.store.nodesMap).forEach((key) => {
              const node = this.$refs.deptTreeRef.store.nodesMap[key]
              if (node.expanded) {
                expandedKeys.push(Number(key))
              }
            })
          }

          // 重新加载树
          await this.getDeptTree(false)

          // 恢复展开状态
          this.$nextTick(() => {
            expandedKeys.forEach((key) => {
              if (this.$refs.deptTreeRef && this.$refs.deptTreeRef.store.nodesMap[key]) {
                this.$refs.deptTreeRef.store.nodesMap[key].expanded = true
              }
            })
          })
        } else {
          this.$message.error('操作失败:' + res.data.Msg)
        }
      } catch (error) {
        this.$message.error('操作失败,请稍后重试!')
      }
    },

    // 删除部门
    async removeDept(deptId) {
      const confirmResult = await this.$confirm('此操作将永久删除该部门, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch((err) => err)

      if (confirmResult !== 'confirm') {
        return this.$message.info('已经取消了删除')
      }

      try {
        const { data: res } = await deleteOu(deptId)
        if (res.success) {
          this.$message.success('删除部门成功')

          // 保存当前展开的节点
          const expandedKeys = []
          if (this.$refs.deptTreeRef) {
            Object.keys(this.$refs.deptTreeRef.store.nodesMap).forEach((key) => {
              const node = this.$refs.deptTreeRef.store.nodesMap[key]
              if (node.expanded) {
                expandedKeys.push(Number(key))
              }
            })
          }

          // 重新加载树
          await this.getDeptTree(false)

          // 恢复展开状态
          this.$nextTick(() => {
            expandedKeys.forEach((key) => {
              if (this.$refs.deptTreeRef && this.$refs.deptTreeRef.store.nodesMap[key]) {
                this.$refs.deptTreeRef.store.nodesMap[key].expanded = true
              }
            })
          })

          if (this.currentDeptId === deptId) {
            this.currentDeptId = null
            this.currentDeptName = ''
            this.getUserList()
          }
        } else {
          this.$message.error('删除部门失败:' + res.Msg)
        }
      } catch (error) {
        this.$message.error('删除部门失败,请稍后重试!')
      }
    },

    // 关闭部门对话框
    onDeptSaved() {
      this.deptDialogVisible = false
      this.getDeptTree(true)
    },

    // ========== 用户管理方法 ==========

    // 获取用户列表
    async getUserList() {
      try {
        const { data: res } = await getUserList({
          keyword: this.queryInfo.query,
          pageNum: this.queryInfo.pagenum,
          pageSize: this.queryInfo.pagesize,
          ouId: this.currentDeptId
        })
        if (res.success) {
          this.userList = res.data
          this.total = res.Total
        } else {
          this.$message.error('用户列表获取失败:' + res.Msg)
        }
      } catch (error) {
        this.$message.error('用户列表获取失败,请稍后重试!')
      }
    },

    SetSex(row, column, cellValue, _index) {
      return cellValue === 'Male' ? '男' : '女'
    },

    // 监听 pageSize 改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getUserList()
    },

    // 监听页码值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getUserList()
    },

    // 保存用户的状态
    async userStateChanged(Account, Disable) {
      try {
        const params = new URLSearchParams()
        params.append('Account', Account)
        params.append('Disable', Disable)

        const { data: res } = await modifyUserInfo(params)
        if (res.success) {
          this.$message.success('更新用户信息成功')
        } else {
          this.$message.error('修改失败:' + res.Msg)
        }
      } catch (error) {
        this.$message.error('修改失败:' + error.message)
      }
    },

    showResetPasswordDialog(Account) {
      this.ResetPwdForm = {}
      this.ResetPwdForm.Account = Account
      this.ResetPwdDialogVisible = true
    },

    onResetPwdSuccess() {
      this.ResetPwdDialogVisible = false
      this.getUserList()
    },

    UpdateUserInfo() {
      this.$refs.UserInfo.UpdateUserInfo()
    },

    showAddUserDialog() {
      if (!this.currentDeptId) {
        return this.$message.warning('请先选择一个部门')
      }
      this.UserAddDialogVisible = true
      this.imageUrl = ''
    },

    AddUser() {
      this.$refs.UserInfo.AddUser(this.currentDeptId)
    },

    showEditUserDialog(Account) {
      this.SelUser = Account
      this.UserDialogVisible = true
    },

    oncallback(res) {
      if (res.success && res.OpenType === 'Edit') {
        this.UserDialogVisible = false
        this.getUserList()
      } else if (res.success && res.OpenType === 'New') {
        this.UserAddDialogVisible = false
        this.getUserList()
      }
    },

    UserDialogClosed() {
      this.UserDialogVisible = false
    },

    UserAddDialogClosed() {
      this.UserAddDialogVisible = false
    },

    async removeUserById(Account) {
      const confirmResult = await this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch((err) => err)

      if (confirmResult !== 'confirm') {
        return this.$message.info('已经取消了删除')
      }

      try {
        const { data: res } = await deleteUser(Account)
        if (res.success) {
          this.$message.success('删除用户成功')
          this.getUserList()
        } else {
          this.$message.error('删除用户失败:' + res.Msg)
        }
      } catch (error) {
        this.$message.error('删除失败,请稍后重试!')
      }
    },

    indexMethod(index) {
      index = index + 1 + (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize
      return index
    }
  }
}
</script>

<style scoped>
.organization-container {
  height: 100%;
  min-height: 0;
}

.dept-tree-panel {
  min-width: 0;
}

.dept-reset-button {
  min-height: 28px;
  padding: 4px 9px;
}

.dept-tree {
  background: transparent;
}

.dept-tree :deep(.el-tree-node__content) {
  height: 34px;
  padding: 0 6px;
  border-radius: 7px;
  margin-bottom: 2px;
  transition: all 0.2s;
}

.dept-tree :deep(.el-tree-node__content:hover) {
  color: #0f766e;
  background-color: #f0fbf8;
}

.dept-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(90deg, #e8f7f4 0%, #f5fbfa 100%) !important;
  color: #0f766e;
  font-weight: 650;
  box-shadow: 0 1px 3px rgba(15, 118, 110, 0.12);
}

/* 树节点缩进优化 */
.dept-tree :deep(.el-tree-node__children) {
  padding-left: 12px;
  position: relative;
}

/* 左侧引导线 */
.dept-tree :deep(.el-tree-node__children)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 12px;
  width: 1px;
  background: #e8e8e8;
}

.dept-tree :deep(.el-tree-node__children .el-tree-node__content)::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  width: 12px;
  height: 1px;
  background: #e8e8e8;
}

/* 展开图标优化 */
.dept-tree :deep(.el-tree-node__expand-icon) {
  font-size: 12px;
  color: #909399;
  margin-right: 4px;
  transition: transform 0.2s;
}

.dept-tree :deep(.el-tree-node__expand-icon.is-leaf) {
  color: transparent;
  width: 12px;
}

.dept-tree :deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}

.user-list-panel {
  min-width: 0;
}

.user-avatar-shell {
  color: #2563eb;
  background: #eff6ff;
}

.table-wrapper {
  flex: 1;
  margin-top: 0;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 8px 4px 0;
  line-height: 1.5;
}

.custom-tree-node span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.tree-node-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #909399;
}

.dept-tree :deep(.el-tree-node.is-current > .el-tree-node__content) .tree-node-icon {
  color: #0f766e;
}

.user-form-dialog {
  --el-dialog-margin-top: 0;
  max-width: calc(100vw - 32px);
}

.user-form-dialog :deep(.el-dialog__header) {
  padding: 14px 20px 12px;
}

.user-form-dialog :deep(.el-dialog__body) {
  padding: 16px 20px 14px;
  overflow: visible;
}

.user-form-dialog :deep(.el-dialog__footer) {
  padding: 12px 20px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 150px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  animation: contextMenuFade 0.15s ease-out;
}

@keyframes contextMenuFade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.context-menu-item .el-icon {
  font-size: 16px;
}

.context-menu-item.delete {
  color: #f56c6c;
}

.context-menu-item.delete:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

.context-menu-item + .context-menu-item {
  border-top: 1px solid #f0f0f0;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}
</style>
