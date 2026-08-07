<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('rolePage.editRole')" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item :label="$t('rolePage.roleCode')">
        <el-input v-model="form.id" disabled></el-input>
      </el-form-item>
      <el-form-item
        :label="$t('rolePage.roleName')"
        prop="RoleName"
        :rules="[{ required: true, message: $t('rolePage.roleNameRequired') }]"
      >
        <el-input v-model="form.RoleName"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { updateRole } from '@/api/role'

export default {
  name: 'RoleEditDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ id: '', RoleName: '' }) }
  },
  emits: ['update:modelValue', 'success'],
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
    handleClose() {
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },
    submit() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        const me = this
        updateRole({ itemId: me.form.id, roleName: me.form.RoleName })
          .then(function (response) {
            if (response.data.success) {
              me.dialogVisible = false
              me.$emit('success')
              me.$message.success(me.$t('rolePage.updateSuccess'))
            } else {
              me.$message.error(`${me.$t('rolePage.updateFailed')}：${response.data.Msg}`)
            }
          })
          .catch(function () {
            me.$message.error(`${me.$t('rolePage.modifyFailed')}，${me.$t('user.selector.retryLater')}！`)
          })
      })
    }
  }
}
</script>
