<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="title" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item :label="$t('organization.deptForm.parent')" prop="ParentId">
        <el-tree-select
          v-model="form.ParentId"
          :data="deptTreeOptions"
          node-key="ItemId"
          :props="{ label: 'OuName', children: 'Children' }"
          value-key="ItemId"
          :placeholder="$t('organization.deptForm.parentPlaceholder')"
          check-strictly
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item :label="$t('organization.deptForm.name')" prop="OuName">
        <el-input v-model="form.OuName" :placeholder="$t('organization.deptForm.namePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('organization.deptForm.code')" prop="OuCode">
        <el-input v-model="form.OuCode" :placeholder="$t('organization.deptForm.codePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('organization.deptForm.sortOrder')" prop="SortOrder">
        <el-input-number v-model="form.SortOrder" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="$t('organization.deptForm.disabled')" prop="Disable">
        <el-switch v-model="form.Disable" />
      </el-form-item>
      <el-form-item :label="$t('organization.deptForm.remark')" prop="Remark">
        <el-input
          v-model="form.Remark"
          type="textarea"
          :rows="3"
          :placeholder="$t('organization.deptForm.remarkPlaceholder')"
        ></el-input>
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
import { createOu, updateOu } from '@/api/organization'

export default {
  name: 'DeptDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
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
      if (!this.form.OuName) return this.$message.error(this.$t('organization.deptRequired'))
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
          this.$message.success(
            this.action === 'add' ? this.$t('organization.addDeptSuccess') : this.$t('organization.editDeptSuccess')
          )
          this.dialogVisible = false
          this.$emit('success')
        } else {
          this.$message.error(`${this.$t('organization.operationFailed')}: ${res.data.Msg}`)
        }
      } catch (error) {
        this.$message.error(`${this.$t('organization.operationFailed')},${this.$t('user.selector.retryLater')}!`)
      }
    }
  }
}
</script>
