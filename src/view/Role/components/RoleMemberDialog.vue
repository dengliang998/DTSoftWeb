<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('rolePage.addMember')" width="50%" @close="dialogVisible = false">
    <el-form :model="form" label-width="80px">
      <el-form-item :label="$t('rolePage.roleName')">
        <el-input v-model="form.RoleName" disabled></el-input>
      </el-form-item>
      <el-form-item :label="$t('rolePage.selectUser')">
        <el-button type="primary" icon="Plus" @click="openUserSelector">{{ $t('user.form.select') }}</el-button>
      </el-form-item>
      <el-table :data="memberList" height="250" border stripe>
        <el-table-column label="#" type="index"></el-table-column>
        <el-table-column :label="$t('user.form.account')" prop="Account"></el-table-column>
        <el-table-column :label="$t('user.form.username')" prop="DisplayName"></el-table-column>
        <el-table-column :label="$t('common.actions')" width="180px">
          <template #default="scope">
            <el-button type="danger" size="small" icon="Delete" @click="removeMember(scope.$index)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button>
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
      this.$message.success(this.$t('rolePage.userAdded'))
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
            me.$message.success(me.$t('rolePage.operationSuccess'))
            me.dialogVisible = false
            me.$emit('success')
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error(`${me.$t('rolePage.memberLoadFailed')}，${me.$t('user.selector.retryLater')}！`)
        })
    }
  }
}
</script>
