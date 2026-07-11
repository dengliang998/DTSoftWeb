<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="title" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="上级部门" prop="ParentId">
        <el-tree-select
          v-model="form.ParentId"
          :data="deptTreeOptions"
          node-key="ItemId"
          :props="{ label: 'OuName', children: 'Children' }"
          value-key="ItemId"
          placeholder="请选择上级部门(不选则为顶级部门)"
          check-strictly
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="部门名称" prop="OuName">
        <el-input v-model="form.OuName" placeholder="请输入部门名称"></el-input>
      </el-form-item>
      <el-form-item label="部门编码" prop="OuCode">
        <el-input v-model="form.OuCode" placeholder="请输入部门编码"></el-input>
      </el-form-item>
      <el-form-item label="排序号" prop="SortOrder">
        <el-input-number v-model="form.SortOrder" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="是否禁用" prop="Disable">
        <el-switch v-model="form.Disable" />
      </el-form-item>
      <el-form-item label="备注" prop="Remark">
        <el-input v-model="form.Remark" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
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
import { createOu, updateOu } from '@/api/organization'

export default {
  name: 'DeptDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '新增部门' },
    form: { type: Object, default: () => ({}) },
    deptTreeOptions: { type: Array, default: () => [] },
    action: { type: String, default: 'add' }
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
      // reset handled by parent
    },
    async submit() {
      if (!this.form.OuName) return this.$message.error('部门名称不能为空')
      try {
        const fd = new FormData()
        fd.append('OuName', this.form.OuName)
        fd.append('OuCode', this.form.OuCode || '')
        fd.append('ParentId', this.form.ParentId || 0)
        fd.append('SortOrder', this.form.SortOrder || 0)
        fd.append('Disable', this.form.Disable || false)
        fd.append('Remark', this.form.Remark || '')
        let res
        if (this.action === 'add') {
          res = await createOu(fd)
        } else {
          fd.append('ItemId', this.form.ItemId)
          res = await updateOu(fd)
        }
        if (res.data.success) {
          this.$message.success(this.action === 'add' ? '新增部门成功' : '编辑部门成功')
          this.dialogVisible = false
          this.$emit('success')
        } else {
          this.$message.error('操作失败:' + res.data.Msg)
        }
      } catch (error) {
        this.$message.error('操作失败,请稍后重试!')
      }
    }
  }
}
</script>
