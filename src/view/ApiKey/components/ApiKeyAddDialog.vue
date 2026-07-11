<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" title="创建API密钥" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item
        label="密钥名称"
        prop="KeyName"
        :rules="[
          { required: true, message: '密钥名称不能为空', trigger: 'blur' },
          { max: 100, message: '密钥名称最多100字符', trigger: 'blur' }
        ]"
      >
        <el-input v-model="form.KeyName" placeholder="请填写密钥名称（唯一）"></el-input>
      </el-form-item>
      <el-form-item
        label="描述信息"
        prop="Description"
        :rules="[{ max: 500, message: '描述信息最多500字符', trigger: 'blur' }]"
      >
        <el-input v-model="form.Description" type="textarea" :rows="3" placeholder="请填写描述信息（可选）"></el-input>
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
import { createApiKey } from '@/api/apikey'

export default {
  name: 'ApiKeyAddDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ KeyName: '', Description: '', ExpireTime: '' }) }
  },
  emits: ['update:modelValue', 'created'],
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
          const data = { KeyName: this.form.KeyName }
          if (this.form.Description) data.Description = this.form.Description
          if (this.form.ExpireTime) data.ExpireTime = this.form.ExpireTime
          const response = await createApiKey(data)
          if (response.data.Code === 200) {
            this.$message.success('创建成功')
            this.dialogVisible = false
            this.$emit('created', response.data.Data)
          } else {
            this.$message.error(response.data.Message || '创建失败')
          }
        } catch (error) {
          this.$message.error('创建失败：' + (error.response?.data?.Message || error.message))
        }
      })
    }
  }
}
</script>
