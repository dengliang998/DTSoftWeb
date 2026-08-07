<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('user.changePassword')" width="30%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="70px" class="modify-pwd-form">
      <el-form-item :label="$t('password.oldPassword')" prop="OldPwd">
        <el-input v-model="form.OldPwd" show-password></el-input>
      </el-form-item>
      <el-form-item :label="$t('password.newPassword')" prop="NewPwd">
        <el-input v-model="form.NewPwd" show-password></el-input>
      </el-form-item>
      <el-form-item :label="$t('password.confirmPassword')" prop="ConfirmPwd">
        <el-input v-model="form.ConfirmPwd" show-password></el-input>
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
import { submitModifyPassword } from '@/modules/home/userPanel'

export default {
  name: 'ModifyPwdDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ OldPwd: '', NewPwd: '', ConfirmPwd: '' }) }
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
  watch: {
    modelValue(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.formRef) this.$refs.formRef.resetFields()
        })
      }
    }
  },
  methods: {
    handleClose() {
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },
    submit() {
      const me = this
      const f = me.form
      if (!f.OldPwd || !f.NewPwd || !f.ConfirmPwd) {
        me.$message.error(me.$t('password.empty'))
        return
      }
      if (f.NewPwd !== f.ConfirmPwd) {
        me.$message.error(me.$t('password.mismatch'))
        return
      }
      submitModifyPassword(f)
        .then(function (response) {
          if (response.data.success) {
            me.$message.success(response.data.Msg)
            me.dialogVisible = false
            me.$emit('success')
          } else {
            me.$message.error(me.$t('password.modifyFailed') + '：' + response.data.Msg)
          }
        })
        .catch(function (error) {
          me.$message.error(error.message || me.$t('password.modifyFailed'))
        })
    }
  }
}
</script>
