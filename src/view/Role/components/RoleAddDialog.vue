<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('rolePage.addRole')" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item
        :label="$t('rolePage.roleName')"
        prop="RoleName"
        :rules="[{ required: true, message: $t('rolePage.roleNameRequired') }]"
      >
        <el-input v-model="form.RoleName" :placeholder="$t('rolePage.roleNamePlaceholder')"></el-input>
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
/* eslint-disable vue/no-mutating-props */
import { createRole } from '@/api/role'

export default {
  name: 'RoleAddDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ RoleName: '' }) }
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
      this.form.RoleName = ''
    },
    submit() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        const me = this
        createRole(me.form.RoleName)
          .then(function (response) {
            if (response.data.success) {
              me.$message.success(me.$t('rolePage.addSuccess'))
              me.dialogVisible = false
              me.$emit('success')
            } else {
              me.$message.error(`${me.$t('rolePage.addFailed')}：${response.data.Msg}`)
            }
          })
          .catch(function () {
            me.$message.error(`${me.$t('rolePage.addFailed')}，${me.$t('user.selector.retryLater')}！`)
          })
      })
    }
  }
}
</script>
