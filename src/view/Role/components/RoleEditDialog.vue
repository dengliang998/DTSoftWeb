<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="修改角色" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="角色编号">
        <el-input v-model="form.id" disabled></el-input>
      </el-form-item>
      <el-form-item label="角色名称" prop="RoleName" :rules="[{ required: true, message: '角色名称不能为空' }]">
        <el-input v-model="form.RoleName"></el-input>
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
              me.$message.success('更新角色信息成功')
            } else {
              me.$message.error('更新角色信息失败：' + response.data.Msg)
            }
          })
          .catch(function () {
            me.$message.error('修改失败，请稍后重试！')
          })
      })
    }
  }
}
</script>
