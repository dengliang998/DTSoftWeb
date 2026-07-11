<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="30%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="70px" class="modify-pwd-form">
      <el-form-item label="原密码" prop="OldPwd">
        <el-input v-model="form.OldPwd" show-password></el-input>
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
        me.$message.error('密码不能为空')
        return
      }
      if (f.NewPwd !== f.ConfirmPwd) {
        me.$message.error('密码不一致')
        return
      }
      submitModifyPassword(f)
        .then(function (response) {
          if (response.data.success) {
            me.$message.success(response.data.Msg)
            me.dialogVisible = false
            me.$emit('success')
          } else {
            me.$message.error('修改失败：' + response.data.Msg)
          }
        })
        .catch(function (error) {
          me.$message.error(error.message || '修改失败')
        })
    }
  }
}
</script>
