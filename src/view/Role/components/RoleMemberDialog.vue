<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="添加成员" width="50%" @close="dialogVisible = false">
    <el-form :model="form" label-width="80px">
      <el-form-item label="角色名称">
        <el-input v-model="form.RoleName" disabled></el-input>
      </el-form-item>
      <el-form-item label="选择用户">
        <el-button type="primary" icon="Plus" @click="openUserSelector">选择</el-button>
      </el-form-item>
      <el-table :data="memberList" height="250" border stripe>
        <el-table-column label="#" type="index"></el-table-column>
        <el-table-column label="账号" prop="Account"></el-table-column>
        <el-table-column label="用户名" prop="DisplayName"></el-table-column>
        <el-table-column label="操作" width="180px">
          <template #default="scope">
            <el-button type="danger" size="small" icon="Delete" @click="removeMember(scope.$index)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </span>
    </template>
    <UserSelector v-model:visible="selUserDialogVisible" :selected-users="memberList" @confirm="handleUserSelected" />
  </el-dialog>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { addRoleMember } from '@/api/role'
import UserSelector from '@/components/user/UserSelector.vue'

export default {
  name: 'RoleMemberDialog',
  components: { UserSelector },
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ RoleName: '' }) },
    memberList: { type: Array, default: () => [] },
    roleId: { type: [Number, String], default: '' }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      selUserDialogVisible: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    }
  },
  methods: {
    openUserSelector() {
      this.selUserDialogVisible = true
    },
    handleUserSelected(selectedUsers) {
      let flag = true
      for (let i = 0; i < selectedUsers.length; i++) {
        for (let j = 0; j < this.memberList.length; j++) {
          if (selectedUsers[i].Account === this.memberList[j].Account) {
            flag = false
            break
          }
        }
        if (flag) {
          this.memberList.push(selectedUsers[i])
        }
        flag = true
      }
      this.$message.success('成功添加用户')
    },
    removeMember(index) {
      this.memberList.splice(index, 1)
    },
    submit() {
      const me = this
      const ParameJson = []
      for (let i = 0; i < me.memberList.length; i++) {
        ParameJson.push({ RoleID: me.roleId, UserAcc: me.memberList[i].Account })
      }
      addRoleMember({ roleId: me.roleId, roleMembers: ParameJson })
        .then(function (response) {
          if (response.data.success) {
            me.$message.success('操作成功')
            me.dialogVisible = false
            me.$emit('success')
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('角色成员获取失败，请稍后重试！')
        })
    }
  }
}
</script>
