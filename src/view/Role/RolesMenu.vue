<template>
  <div class="role-container">
    <!-- 卡片视图区域 -->
    <el-card class="table-card">
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="7">
          <!-- 搜索与添加区域 -->
          <el-input v-model="queryInfo.query" clearable placeholder="请输入内容" @clear="getRoleList">
            <template #append>
              <el-button icon="Search" @click="getRoleList"></el-button>
            </template>
          </el-input>
        </el-col>

        <el-col :span="4">
          <el-button type="primary" @click="openAddRoleDialog">添加角色</el-button>
        </el-col>
      </el-row>

      <!-- 用户列表区域 -->
      <el-table
        :data="RoleList"
        :row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        border
        stripe
        class="table-wrapper"
      >
        <el-table-column label="#" type="index" :index="indexMethod"></el-table-column>
        <el-table-column label="角色编码" prop="id"></el-table-column>
        <el-table-column label="角色名称" prop="RoleName"></el-table-column>
        <el-table-column label="操作" width="230px">
          <template #default="scope">
            <div class="operation-buttons">
              <!-- 添加成员 -->
              <el-button
                type="primary"
                size="small"
                icon="User"
                :disabled="scope.row.RoleName == 'Everyone'"
                @click="showMenuPermDialog(scope.row.id, scope.row.RoleName)"
              ></el-button>
              <!-- 配置可访问的菜单 -->
              <el-button
                type="primary"
                size="small"
                icon="Setting"
                :disabled="scope.row.RoleName == 'Administrator'"
                @click="showEditMenuDialog(scope.row.id)"
              ></el-button>
              <!-- 修改按钮 -->
              <el-button
                type="primary"
                size="small"
                icon="Edit"
                :disabled="scope.row.RoleName == 'Administrator' || scope.row.RoleName == 'Everyone'"
                @click="showEditDialog(scope.row.id)"
              ></el-button>
              <!-- 删除按钮 -->
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                :disabled="scope.row.RoleName == 'Administrator' || scope.row.RoleName == 'Everyone'"
                @click="removeRole(scope.row.id)"
              ></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination
        :current-page="queryInfo.pagenum"
        :page-sizes="[1, 2, 5, 10]"
        :page-size="queryInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </el-card>

    <!-- 添加用户的对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加角色" width="50%" @close="addDialogClosed">
      <!-- 内容主体区域 -->
      <el-form ref="addFormRef" :model="addForm" label-width="80px">
        <el-form-item label="角色名称" prop="RoleName" :rules="[{ required: true, message: '角色名称不能为空' }]">
          <el-input v-model="addForm.RoleName" placeholder="请填写角色名称"></el-input>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addRole">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改用户的对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改角色" width="50%" @close="editDialogClosed">
      <!-- 内容主体区域 -->
      <el-form ref="editFormRef" :model="editForm" label-width="80px">
        <el-form-item label="角色编号">
          <el-input v-model="editForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色名称" prop="RoleName" :rules="[{ required: true, message: '角色名称不能为空' }]">
          <el-input v-model="editForm.RoleName"></el-input>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="editRoleInfo">确 定</el-button>
        </span>
      </template>
    </el-dialog>
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
    <!-- c菜单配置 -->
    <el-dialog v-model="MenuDialogVisible" title="菜单权限配置" width="20%" @close="MenuDialogVisible = false">
      <!-- 内容主体区域 -->
      <el-form label-width="80px">
        <el-tree
          v-if="MenuDialogVisible"
          ref="tree"
          :props="treeprops"
          :load="loadNode"
          node-key="id"
          :default-expanded-keys="TreeExpanded"
          :default-checked-keys="TreeChecked"
          lazy
          show-checkbox
          default-expand-all
        ></el-tree>
      </el-form>
      <!-- 底部区域 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="MenuDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="EditRoleMenuAuthority">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { addRoleMember, createRole, deleteRole, getRole, getRoleList, getRoleMemberList, updateRole } from '@/api/role'
import { getChildrenMenu, getFatherMenu, getRoleMenuMap, updateMenuAuthority } from '@/api/menu'
import UserSelector from '@/components/user/UserSelector.vue'
export default {
  name: 'Role',
  components: {
    UserSelector
  },
  data() {
    return {
      queryInfo: {
        query: '',
        queryuser: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 10
      },
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
        children: 'MenuName'
      },
      //菜单树默认选中
      TreeChecked: [],
      //菜单树默认展开
      TreeExpanded: [],
      SelRole: ''
    }
  },
  created() {
    this.getRoleList()
  },
  methods: {
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
    showEditMenuDialog(RoleID) {
      //重置菜单树状态
      this.TreeChecked = []
      this.TreeExpanded = []
      this.CurrentSelRoleID = RoleID
      this.loadRoleMenuCheckedKeys()
      //显示页菜单配置页面
      this.MenuDialogVisible = true
    },
    loadRoleMenuCheckedKeys() {
      const me = this
      getRoleMenuMap(me.CurrentSelRoleID)
        .then(function (response) {
          me.TreeChecked = []
          response.data.data.forEach((item) => {
            //默认选项-不需要选择父节点，选中父节点会导致错误的选中所有子节点
            if (item.pid != 0) me.TreeChecked.push(item.MenuID)
          })
          me.$nextTick(() => {
            if (me.$refs.tree) {
              me.$refs.tree.setCheckedKeys(me.TreeChecked)
            }
          })
        })
        .catch(function () {
          me.$message.error('数据初始化失败，请稍后重试！')
        })
    },
    loadNode(node, resolve) {
      const me = this
      //加载菜单树
      if (node.level === 0) {
        getFatherMenu(this.CurrentSelRoleID)
          .then(function (response) {
            return resolve(response.data.data)
          })
          .catch(function () {
            me.$message.error('菜单树加载失败，请稍后重试！')
          })
      } else {
        //加载子项
        getChildrenMenu({
          roleId: this.CurrentSelRoleID,
          menuId: node.data.id
        })
          .then(function (response) {
            return resolve(response.data.data)
          })
          .catch(function () {
            me.$message.error('子节点数据加载失败，请稍后重试！')
          })
      }
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

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
}

.role-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  margin-top: 15px;
}
</style>
