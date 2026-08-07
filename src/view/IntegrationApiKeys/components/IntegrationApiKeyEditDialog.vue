<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="$t('apiKey.editTitle')" width="50%" @close="handleClose">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item :label="$t('apiKey.keyName')">
        <el-input v-model="form.KeyName" disabled></el-input>
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
          :placeholder="$t('apiKey.descriptionPlaceholder')"
        ></el-input>
      </el-form-item>
      <el-form-item
        :label="$t('apiKey.enabledStatus')"
        prop="Enabled"
        :rules="[{ required: true, message: $t('apiKey.selectEnabled'), trigger: 'change' }]"
      >
        <el-switch
          v-model="form.Enabled"
          :active-text="$t('common.enabled')"
          :inactive-text="$t('common.disabled')"
        ></el-switch>
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
import { updateApiKey } from '@/api/integrationApiKeys'

export default {
  name: 'IntegrationApiKeyEditDialog',
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
            this.$message.success(this.$t('apiKey.updateSuccess'))
            this.dialogVisible = false
            this.$emit('success')
          } else {
            this.$message.error(response.data.Message || this.$t('apiKey.updateFailed'))
          }
        } catch (error) {
          this.$message.error(`${this.$t('apiKey.updateFailed')}: ${error.response?.data?.Message || error.message}`)
        }
      })
    }
  }
}
</script>
