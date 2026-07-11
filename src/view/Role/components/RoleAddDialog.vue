<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="添加角色" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="角色名称" prop="RoleName" :rules="[{ required: true, message: '角色名称不能为空' }]">
        <el-input v-model="form.RoleName" placeholder="请填写角色名称"></el-input>
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
              me.$message.success('角色添加成功')
              me.dialogVisible = false
              me.$emit('success')
            } else {
              me.$message.error('添加失败：' + response.data.Msg)
            }
          })
          .catch(function () {
            me.$message.error('添加失败，请稍后重试！')
          })
      })
    }
  }
}
</script>
