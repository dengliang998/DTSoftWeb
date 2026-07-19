<template>
  <div class="role-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>角色管理</h1>
          <p>维护系统角色、成员范围和菜单访问权限。系统内置角色会限制高风险操作。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="getRoleList">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openAddRoleDialog">添加角色</el-button>
        </div>
      </div>

      <div class="dt-toolbar dt-toolbar--compact">
        <el-input
          v-model="queryInfo.query"
          clearable
          class="dt-search"
          placeholder="搜索角色名称或编码"
          @clear="getRoleList"
          @keyup.enter="getRoleList"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="dt-filter-tabs">
          <button
            v-for="item in roleFilterOptions"
            :key="item.value"
            type="button"
            :class="['dt-filter-tab', { 'is-active': activeRoleFilter === item.value }]"
            @click="activeRoleFilter = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="dt-panel">
        <div class="dt-panel__header">
          <div>
            <strong>角色列表</strong>
            <span>{{ roleSummaryText }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">本页 {{ roleStats.total }}</span>
            <span class="dt-chip dt-chip--warning">内置 {{ roleStats.system }}</span>
            <span class="dt-chip dt-chip--success">自定义 {{ roleStats.custom }}</span>
          </div>
        </div>

        <el-table
          :data="filteredRoleList"
          :row-style="{ height: '52px' }"
          :cell-style="{ padding: '0px' }"
          class="table-wrapper dt-table"
          empty-text="暂无匹配角色"
        >
          <el-table-column label="#" width="72" align="center">
            <template #default="scope">
              <span class="dt-index-chip">{{ indexMethod(scope.$index) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="角色" prop="RoleName" min-width="260">
            <template #default="scope">
              <div class="dt-name-cell">
                <span :class="['dt-icon-shell', isSystemRole(scope.row.RoleName) ? 'role-icon--system' : '']">
                  <el-icon><component :is="UserIcon" /></el-icon>
                </span>
                <span class="dt-name-copy">
                  <strong>{{ scope.row.RoleName || '未命名角色' }}</strong>
                  <small>{{ isSystemRole(scope.row.RoleName) ? '系统内置角色' : '自定义业务角色' }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色编码" prop="id" min-width="220">
            <template #default="scope">
              <code class="dt-code">{{ scope.row.id }}</code>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="120">
            <template #default="scope">
              <span :class="['dt-badge', isSystemRole(scope.row.RoleName) ? 'dt-badge--warning' : 'dt-badge--success']">
                {{ isSystemRole(scope.row.RoleName) ? '内置' : '自定义' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="right" class-name="role-action-column">
            <template #default="scope">
              <div class="dt-operation-buttons role-actions">
                <el-tooltip content="管理成员" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--add"
                    :icon="UserIcon"
                    :disabled="scope.row.RoleName == 'Everyone'"
                    @click="showMenuPermDialog(scope.row.id, scope.row.RoleName)"
                  />
                </el-tooltip>
                <el-tooltip content="菜单权限" placement="top">
                  <el-button
                    class="dt-icon-action"
                    :icon="Setting"
                    :disabled="scope.row.RoleName == 'Administrator'"
                    @click="showEditMenuDialog(scope.row.id)"
                  />
                </el-tooltip>
                <el-tooltip content="编辑角色" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--edit"
                    :icon="Edit"
                    :disabled="isSystemRole(scope.row.RoleName)"
                    @click="showEditDialog(scope.row.id)"
                  />
                </el-tooltip>
                <el-tooltip content="删除角色" placement="top">
                  <el-button
                    class="dt-icon-action dt-icon-action--danger"
                    :icon="Delete"
                    :disabled="isSystemRole(scope.row.RoleName)"
                    @click="removeRole(scope.row.id)"
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
    </section>

    <!-- 添加角色对话框 -->
    <RoleAddDialog v-model="addDialogVisible" :form="addForm" @success="getRoleList" />

    <!-- 修改角色对话框 -->
    <RoleEditDialog v-model="editDialogVisible" :form="editForm" @success="getRoleList" />
    <!-- 添加成员 -->
    <el-dialog v-model="AddMemberDialogVisible" title="添加成员" width="50%" @close="AddMemberDialogVisible = false">
      <!-- 内容主体区域 -->
      <el-form :model="AddMemberForm" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="AddMemberForm.RoleName" disabled></el-input>
        </el-form-item>
        <el-form-item label="选择用户">
          <el-button type="primary" icon="Plus" @click="OpenSelUser">选择</el-button>
        </el-form-item>
        <el-table :data="RoleMemberList" height="250" border stripe>
          <el-table-column label="#" type="index"></el-table-column>
          <el-table-column label="账号" prop="Account"></el-table-column>
          <el-table-column label="用户名" prop="DisplayName"></el-table-column>
          <el-table-column label="操作" width="180px">
            <template #default="scope">
              <!-- 删除按钮 -->
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click="removeRoleMember(scope.$index, RoleMemberList)"
              ></el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddMemberDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="editRoleMemberInfo">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 选择用户 -->
    <UserSelector
      v-model:visible="SelUserDialogVisible"
      :selected-users="RoleMemberList"
      @confirm="handleUserSelected"
    />
    <!-- 菜单权限配置对话框 -->
    <MenuAuthDialog v-model="MenuDialogVisible" :role-id="CurrentSelRoleID" @success="MenuDialogVisible = false" />
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { Delete, Edit, Plus, Refresh, Search, Setting, User as UserIcon } from '@element-plus/icons-vue'
import { addRoleMember, createRole, deleteRole, getRole, getRoleList, getRoleMemberList, updateRole } from '@/api/role'
import { getMenu, getRoleMenuMap, updateMenuAuthority } from '@/api/menu'
import UserSelector from '@/components/user/UserSelector.vue'
import RoleAddDialog from './components/RoleAddDialog.vue'
import RoleEditDialog from './components/RoleEditDialog.vue'
import MenuAuthDialog from './components/MenuAuthDialog.vue'
export default {
  name: 'Role',
  components: {
    UserSelector,
    RoleAddDialog,
    RoleEditDialog,
    MenuAuthDialog
  },
  data() {
    return {
      Delete: markRaw(Delete),
      Edit: markRaw(Edit),
      Plus: markRaw(Plus),
      Refresh: markRaw(Refresh),
      Search: markRaw(Search),
      Setting: markRaw(Setting),
      UserIcon: markRaw(UserIcon),
      queryInfo: {
        query: '',
        queryuser: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10
      },
      activeRoleFilter: 'all',
      roleFilterOptions: [
        { label: '全部', value: 'all' },
        { label: '系统内置', value: 'system' },
        { label: '自定义', value: 'custom' }
      ],
      // 用户列表
      RoleList: [],
      // 总数据
      total: 0,
      // 是否显示添加用户对话框
      addDialogVisible: false,
      // 添加用户的表单数据
      addForm: {
        id: '',
        RoleName: ''
      },
      // 控制修改用户对话框的显示与隐藏
      editDialogVisible: false,
      // 查询到的用户信息对象
      editForm: {},
      // 是否显示分配角色
      setRoleDialogVisible: false,
      // 当前修改角色的用户信息
      RoleInfo: {},
      AddMemberDialogVisible: false,
      AddMemberForm: {},
      RoleMemberList: [],
      SelUserDialogVisible: false,
      UserList: [],
      //选中的行数据
      SelUser: [],
      //当前选中的角色编号
      CurrentSelRoleID: '',
      CurrentSelRoleName: '',
      MenuDialogVisible: false,
      treeprops: {
        label: 'MenuName',
        children: 'children'
      },
      MenuTreeData: [],
      //菜单树默认选中
      TreeChecked: [],
      HalfChecked: [],
      //菜单树默认展开
      TreeExpanded: [],
      SelRole: '',
      menuFilterKeyword: '',
      selectedMenuCount: 0,
      halfCheckedMenuCount: 0
    }
  },
  computed: {
    filteredRoleList() {
      if (this.activeRoleFilter === 'system') return this.RoleList.filter((role) => this.isSystemRole(role.RoleName))
      if (this.activeRoleFilter === 'custom') return this.RoleList.filter((role) => !this.isSystemRole(role.RoleName))
      return this.RoleList
    },
    roleStats() {
      return this.RoleList.reduce(
        (stats, role) => {
          stats.total += 1
          if (this.isSystemRole(role.RoleName)) {
            stats.system += 1
          } else {
            stats.custom += 1
          }
          return stats
        },
        { total: 0, system: 0, custom: 0 }
      )
    },
    roleSummaryText() {
      const count = this.filteredRoleList.length
      if (count === this.RoleList.length) return `共 ${count} 个角色，服务端总数 ${this.total}`
      return `筛选出 ${count} / ${this.RoleList.length} 个角色，服务端总数 ${this.total}`
    },
    selectedPermissionCount() {
      return new Set(this.TreeChecked.concat(this.HalfChecked)).size
    }
  },
  watch: {
    menuFilterKeyword(value) {
      this.$nextTick(() => {
        if (this.$refs.tree) {
          this.$refs.tree.filter(value)
        }
      })
    }
  },
  created() {
    this.getRoleList()
  },
  methods: {
    isSystemRole(roleName) {
      return ['administrator', 'everyone'].includes(String(roleName || '').toLowerCase())
    },
    openAddRoleDialog() {
      this.addDialogVisible = true
      this.imageUrl = ''
    },
    async getRoleList() {
      const me = this
      getRoleList({
        pageNum: me.queryInfo.pagenum,
        pageSize: me.queryInfo.pagesize,
        roleName: me.queryInfo.query
      })
        .then(function (response) {
          if (response.data.success) {
            me.RoleList = response.data.data
            me.total = response.data.Total
          } else {
            me.$message.error('角色列表获取失败：' + response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('角色列表获取失败，请稍后重试！')
        })
    },
    // 监听 pageSize 改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getRoleList()
    },

    // 监听 页码值 页面值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getRoleList()
    },

    // 监听添加用户对话框关闭之后的操作
    addDialogClosed() {
      this.$refs.addFormRef.resetFields()
    },
    showMenuPermDialog(id, RoleName) {
      //显示成员修改页面，加载成员列表
      let me = this
      me.AddMemberForm.RoleName = RoleName //页面显示
      me.CurrentSelRoleID = id //修改成员是需要
      me.CurrentSelRoleName = RoleName
      getRoleMemberList(id)
        .then(function (response) {
          me.RoleMemberList = response.data.data
          me.AddMemberDialogVisible = true
        })
        .catch(function () {
          me.$message.error('角色成员获取失败，请稍后重试！')
        })
    },
    editRoleMemberInfo() {
      let me = this
      let ParameJson = []
      for (let i = 0; i < me.RoleMemberList.length; i++) {
        let row = {
          RoleID: me.CurrentSelRoleID,
          UserAcc: me.RoleMemberList[i].Account
        }
        ParameJson.push(row)
      }
      addRoleMember({
        roleId: me.CurrentSelRoleID,
        roleMembers: ParameJson
      })
        .then(function (response) {
          if (response.data.success) {
            me.$message.success('操作成功')
            me.AddMemberDialogVisible = false
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('角色成员获取失败，请稍后重试！')
        })
    },
    // 点击确定按钮，添加新角色
    addRole() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return
        let me = this
        createRole(me.addForm.RoleName)
          .then(function (response) {
            if (response.data.success) {
              me.$message.success('角色添加成功')
              // 关闭添加用户面板
              me.addDialogVisible = false
              // 重新调用用户列表，刷新结果
              me.getRoleList()
            } else {
              me.$message.error('添加失败：' + response.data.Msg)
            }
          })
          .catch(function () {
            me.$message.error('添加失败，请稍后重试！')
          })
      })
    },
    // 点击修改按钮弹出修改操作
    async showEditDialog(RoleId) {
      let me = this
      // 直接使用GetRole接口获取角色详情，GET请求
      getRole(RoleId)
        .then(function (response) {
          if (response.data.success) {
            me.editForm = response.data
            me.editDialogVisible = true
          } else {
            me.$message.error('角色获取失败：' + (response.data.Msg || '未知错误'))
          }
        })
        .catch(function () {
          me.$message.error('角色获取失败，请稍后重试！')
        })
    },
    // 监听关闭修改用户对话框的关闭事件
    editDialogClosed() {
      this.$refs.editFormRef.resetFields()
    },
    // 修改用户信息保存提交
    editRoleInfo() {
      // 表单预验证
      this.$refs.editFormRef.validate(async (valid) => {
        // 验证失败返回
        if (!valid) return
        // 发起修改用户信息的数据请求
        let me = this
        updateRole({
          itemId: me.editForm.id,
          roleName: me.editForm.RoleName
        })
          .then(function (response) {
            if (response.data.success) {
              me.editDialogVisible = false
              me.getRoleList()
              me.$message.success('更新角色信息成功')
            } else {
              me.$message.error('更新角色信息失败：' + response.data.Msg)
            }
          })
          .catch(function () {
            me.$message.error('修改失败，请稍后重试！')
          })
      })
    },
    // 根据ID删除对应的用户信息

    // 使用async和await 简化了 Promise 操作，使用catch捕获了错误提示
    async removeRole(id) {
      // 询问用户是否删除数据
      const confirmResult = await this.$confirm('此操作将永久删除该角色, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch((err) => err)

      //如果用户确认了删除，则字符串返回 confirm
      //如果用户取消了删除，则字符串返回 cancel
      //console.log(confirmResult);
      if (confirmResult !== 'confirm') {
        return this.$message.info('已经取消了删除')
      }

      //发起删除请求，判读状态码，删除成功提示消息并且刷新用户列表
      let me = this
      deleteRole(id)
        .then(function (response) {
          if (response.data.success) {
            me.$message.success('删除角色成功')
            me.getRoleList()
          } else {
            me.$message.error('删除角色失败：' + response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('删除失败，请稍后重试！')
        })
    },
    // 监听分配角色对话框的关闭事件
    setRoleDialogClosed() {
      this.selectedRoleId = ''
      this.RoleInfo = {}
      this.setRoleDialogVisible = false
    },
    OpenSelUser() {
      // 打开用户选择器对话框
      this.SelUserDialogVisible = true
    },
    // 处理用户选择确认
    handleUserSelected(selectedUsers) {
      let flag = true
      // 循环添加选中的用户
      for (let i = 0; i < selectedUsers.length; i++) {
        // 循环比较已添加到成员和新增加的成员是否重复
        for (let j = 0; j < this.RoleMemberList.length; j++) {
          if (selectedUsers[i].Account === this.RoleMemberList[j].Account) {
            flag = false
            break
          }
        }
        if (flag) {
          this.RoleMemberList.push(selectedUsers[i])
        }
        flag = true // 重置标志
      }
      this.$message.success('成功添加用户')
    },
    removeRoleMember(index, rows) {
      if (rows[index].Account === 'admin' && this.CurrentSelRoleName === 'Administrator') {
        this.$message.error('系统管理员账号不能移除')
      } else {
        rows.splice(index, 1)
      }
    },
    async showEditMenuDialog(RoleID) {
      //重置菜单树状态
      this.TreeChecked = []
      this.HalfChecked = []
      this.MenuTreeData = []
      this.TreeExpanded = []
      this.menuFilterKeyword = ''
      this.selectedMenuCount = 0
      this.halfCheckedMenuCount = 0
      this.CurrentSelRoleID = RoleID
      await this.loadMenuAuthorityData()
    },
    closeMenuDialog() {
      this.menuFilterKeyword = ''
      this.MenuTreeData = []
      this.selectedMenuCount = 0
      this.halfCheckedMenuCount = 0
      this.MenuDialogVisible = false
    },
    async loadMenuAuthorityData() {
      const me = this
      try {
        const [menuResponse, roleMenuResponse] = await Promise.all([getMenu(), getRoleMenuMap(me.CurrentSelRoleID)])
        const menuData = menuResponse.data.data || menuResponse.data
        const roleMenuData = Array.isArray(roleMenuResponse.data.data) ? roleMenuResponse.data.data : []
        me.MenuTreeData = me.buildMenuTree(me.normalizeMenuItems(menuData))
        const checkedMenuIds = []
        me.HalfChecked = []
        roleMenuData.forEach((item) => {
          if (item.pid != 0) checkedMenuIds.push(item.MenuID)
        })
        me.TreeChecked = me.getLeafCheckedKeys(checkedMenuIds, me.MenuTreeData)
        me.selectedMenuCount = me.TreeChecked.length
        me.halfCheckedMenuCount = 0
        me.MenuDialogVisible = true
        me.$nextTick(() => {
          if (me.$refs.tree) {
            me.$refs.tree.setCheckedKeys(me.TreeChecked)
            me.syncMenuCheckStats()
          }
        })
      } catch (error) {
        me.$message.error('数据初始化失败，请稍后重试！')
      }
    },
    normalizeMenuItems(menuList, parentId = 0) {
      if (!Array.isArray(menuList)) return []
      return menuList.reduce((result, item) => {
        const id = item.id ?? item.MenuID ?? item.menuId
        const pid = item.pid ?? item.parentId ?? item.Pid ?? item.ParentId ?? parentId
        const children = item.children || item.Children || []
        result.push({
          id,
          pid,
          MenuName: item.MenuName || item.menuName || item.name || '',
          order: item.order ?? item.Order ?? item.orderNum ?? 0
        })
        return result.concat(this.normalizeMenuItems(children, id))
      }, [])
    },
    buildMenuTree(menuList) {
      const menuMap = {}
      const tree = []
      menuList.forEach((item) => {
        if (item.id === undefined || item.id === null) return
        menuMap[item.id] = { ...item, children: [] }
      })
      menuList.forEach((item) => {
        const node = menuMap[item.id]
        if (!node) return
        const parent = menuMap[item.pid]
        if (parent && item.id !== item.pid) {
          parent.children.push(node)
        } else {
          tree.push(node)
        }
      })
      const sortMenus = (menus) => {
        menus.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        menus.forEach((item) => sortMenus(item.children))
      }
      sortMenus(tree)
      return tree
    },
    getLeafCheckedKeys(checkedKeys, menuTree) {
      const parentKeys = new Set()
      const collectParentKeys = (menus) => {
        menus.forEach((menu) => {
          if (menu.children && menu.children.length > 0) {
            parentKeys.add(String(menu.id))
            collectParentKeys(menu.children)
          }
        })
      }
      collectParentKeys(menuTree)
      return checkedKeys.filter((key) => !parentKeys.has(String(key)))
    },
    filterMenuNode(value, data) {
      if (!value) return true
      return String(data.MenuName || '')
        .toLowerCase()
        .includes(value.toLowerCase())
    },
    syncMenuCheckStats() {
      this.$nextTick(() => {
        if (!this.$refs.tree) {
          this.selectedMenuCount = this.TreeChecked.length
          this.HalfChecked = []
          this.halfCheckedMenuCount = 0
          return
        }
        const checkedKeys = this.$refs.tree.getCheckedKeys()
        const halfCheckedKeys = this.$refs.tree.getHalfCheckedKeys()
        this.TreeChecked = checkedKeys
        this.HalfChecked = halfCheckedKeys
        this.selectedMenuCount = checkedKeys.length
        this.halfCheckedMenuCount = halfCheckedKeys.length
      })
    },
    expandLoadedMenus() {
      const tree = this.$refs.tree
      if (!tree || !tree.store || !tree.store.nodesMap) return
      Object.keys(tree.store.nodesMap).forEach((key) => {
        tree.store.nodesMap[key].expanded = true
      })
    },
    collapseLoadedMenus() {
      const tree = this.$refs.tree
      if (!tree || !tree.store || !tree.store.nodesMap) return
      Object.keys(tree.store.nodesMap).forEach((key) => {
        tree.store.nodesMap[key].expanded = false
      })
    },
    clearCheckedMenus() {
      if (!this.$refs.tree) return
      this.TreeChecked = []
      this.HalfChecked = []
      this.$refs.tree.setCheckedKeys([])
      this.syncMenuCheckStats()
    },
    EditRoleMenuAuthority() {
      let me = this
      //获取选中的节点，不包含未完全选中的父节点，此方法不满足功能要求
      //me.$refs.tree.getCheckedNodes()

      //可以获取所有的选中节点包含未完全选中的父节点
      let MenuID = me.$refs.tree.getCheckedKeys().concat(me.$refs.tree.getHalfCheckedKeys())
      updateMenuAuthority({
        roleId: me.CurrentSelRoleID,
        menuIds: MenuID
      })
        .then(function (response) {
          if (response.data.success) {
            me.$message.success(response.data.Msg)
            me.MenuDialogVisible = false
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('操作失败，请稍后重试！')
        })
    },
    //处理行号
    indexMethod(index) {
      index = index + 1 + (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize
      return index
    }
  }
}
</script>

<style scoped>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.role-container {
  height: 100%;
  min-height: 0;
}

.table-wrapper {
  flex: 1;
  margin-top: 0;
}

.role-actions {
  min-width: 168px;
  display: grid;
  grid-template-columns: repeat(4, 30px);
  justify-content: end;
  gap: 10px;
}

.role-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.role-actions :deep(.el-button) {
  box-sizing: border-box;
}

.table-wrapper :deep(.role-action-column .cell) {
  padding-right: 16px;
}

.role-icon--system {
  color: #8a5a00;
  background: #fff7df;
}

:deep(.menu-auth-dialog) {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 56px);
  max-width: calc(100vw - 48px);
  border-radius: 10px;
  overflow: hidden;
}

:deep(.menu-auth-dialog .el-dialog__header) {
  margin: 0;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #e8edf3;
}

:deep(.menu-auth-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  background: #f6f8fb;
  overflow: hidden;
}

:deep(.menu-auth-dialog .el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #e8edf3;
  background: #ffffff;
}

.menu-auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 28px;
}

.menu-auth-title {
  color: #1f2d3d;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}

.menu-auth-subtitle {
  margin-top: 4px;
  color: #7a8797;
  font-size: 12px;
  line-height: 18px;
}

.menu-auth-panel {
  padding: 12px 16px 14px;
}

.menu-auth-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.menu-auth-search {
  flex: 1;
  min-width: 220px;
}

.menu-auth-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.menu-auth-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.menu-auth-clear-button {
  color: #c03535;
  border-color: #f0b4b4;
  background: #fff5f5;
}

.menu-auth-clear-button:hover,
.menu-auth-clear-button:focus {
  color: #ffffff;
  border-color: #d94a4a;
  background: #d94a4a;
}

.menu-auth-clear-button :deep(.el-icon) {
  color: inherit;
}

.menu-auth-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
  margin-bottom: 10px;
  color: #7a8797;
  font-size: 12px;
  line-height: 18px;
}

.menu-tree-scrollbar {
  height: clamp(220px, 40vh, 360px);
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  background: #ffffff;
}

.menu-tree-surface {
  min-height: 100%;
  padding: 10px 8px;
}

.menu-auth-tree {
  min-width: 100%;
  color: #263445;
  background: transparent;
}

.menu-auth-tree :deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 6px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.menu-auth-tree :deep(.el-tree-node__content:hover) {
  background: #eef6ff;
}

.menu-auth-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #e7f1ff;
  color: #1d6fd8;
}

.menu-auth-tree :deep(.el-checkbox) {
  margin-right: 8px;
}

.menu-auth-tree :deep(.el-tree-node__label) {
  overflow: hidden;
  color: inherit;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #7a8797;
  font-size: 12px;
}

@media (max-width: 900px) {
  :deep(.menu-auth-dialog) {
    width: calc(100vw - 32px) !important;
  }

  .menu-auth-toolbar,
  .menu-auth-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .menu-auth-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .menu-tree-scrollbar {
    height: clamp(210px, 42vh, 320px);
  }
}
</style>
