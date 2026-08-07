<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('apiKey.createTitle')" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item
        :label="$t('apiKey.keyName')"
        prop="KeyName"
        :rules="[
          { required: true, message: $t('apiKey.keyNameRequired'), trigger: 'blur' },
          { max: 100, message: $t('apiKey.keyNameMax'), trigger: 'blur' }
        ]"
      >
        <el-input v-model="form.KeyName" :placeholder="$t('apiKey.keyNamePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item
        :label="$t('apiKey.description')"
        prop="Description"
        :rules="[{ max: 500, message: $t('apiKey.descriptionMax'), trigger: 'blur' }]"
      >
        <el-input
          v-model="form.Description"
          type="textarea"
          :rows="3"
          :placeholder="$t('apiKey.descriptionOptionalPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('apiKey.expireTime')">
        <el-date-picker
          v-model="form.ExpireTime"
          type="datetime"
          :placeholder="$t('apiKey.expirePlaceholder')"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        ></el-date-picker>
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
import { createApiKey } from '@/api/integrationApiKeys'

export default {
  name: 'IntegrationApiKeyAddDialog',
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
            this.$message.success(this.$t('apiKey.createSuccess'))
            this.dialogVisible = false
            this.$emit('created', response.data.Data)
          } else {
            this.$message.error(response.data.Message || this.$t('apiKey.createFailed'))
          }
        } catch (error) {
          this.$message.error(`${this.$t('apiKey.createFailed')}: ${error.response?.data?.Message || error.message}`)
        }
      })
    }
  }
}
</script>
