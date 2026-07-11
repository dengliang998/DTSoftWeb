<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="修改API密钥" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="密钥名称">
        <el-input v-model="form.KeyName" disabled></el-input>
      </el-form-item>
      <el-form-item
        label="描述信息"
        prop="Description"
        :rules="[{ max: 500, message: '描述信息最多500字符', trigger: 'blur' }]"
      >
        <el-input v-model="form.Description" type="textarea" :rows="3" placeholder="请填写描述信息"></el-input>
      </el-form-item>
      <el-form-item
        label="启用状态"
        prop="Enabled"
        :rules="[{ required: true, message: '请选择启用状态', trigger: 'change' }]"
      >
        <el-switch v-model="form.Enabled" active-text="启用" inactive-text="禁用"></el-switch>
      </el-form-item>
      <el-form-item label="过期时间">
        <el-date-picker
          v-model="form.ExpireTime"
          type="datetime"
          placeholder="选择过期时间（可选）"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        ></el-date-picker>
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
import { updateApiKey } from '@/api/apikey'

export default {
  name: 'ApiKeyEditDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ ItemId: 0, KeyName: '', Description: '', Enabled: true, ExpireTime: '' }) }
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
        try {
          const data = { ItemId: this.form.ItemId, Enabled: this.form.Enabled }
          if (this.form.Description) data.Description = this.form.Description
          if (this.form.ExpireTime) data.ExpireTime = this.form.ExpireTime
          const response = await updateApiKey(data)
          if (response.data.Code === 200) {
            this.$message.success('更新成功')
            this.dialogVisible = false
            this.$emit('success')
          } else {
            this.$message.error(response.data.Message || '更新失败')
          }
        } catch (error) {
          this.$message.error('更新失败：' + (error.response?.data?.Message || error.message))
        }
      })
    }
  }
}
</script>
