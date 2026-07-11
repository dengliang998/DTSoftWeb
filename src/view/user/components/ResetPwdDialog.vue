<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="重置密码" width="30%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="70px">
      <el-form-item label="账号">
        <el-input v-model="form.Account" disabled></el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="NewPwd">
        <el-input v-model="form.NewPwd" show-password></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="ConfirmPwd">
        <el-input v-model="form.ConfirmPwd" show-password></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { resetPassword } from '@/api/user'

export default {
  name: 'ResetPwdDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ Account: '', NewPwd: '', ConfirmPwd: '' }) }
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
    async submit() {
      if (!this.form.NewPwd || !this.form.ConfirmPwd) return this.$message.error('密码不能为空')
      if (this.form.NewPwd !== this.form.ConfirmPwd) return this.$message.error('密码不一致')
      const { data: res } = await resetPassword({ account: this.form.Account, password: this.form.ConfirmPwd })
      if (res.success) {
        this.$message.success(res.Msg)
        this.dialogVisible = false
        this.$emit('success')
      } else {
        this.$message.error('重置失败:' + res.Msg)
      }
    }
  }
}
</script>
