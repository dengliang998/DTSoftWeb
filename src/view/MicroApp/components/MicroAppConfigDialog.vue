<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="title" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item :label="$t('microConfig.configName')" prop="ConfigName">
        <el-input v-model="form.ConfigName" :placeholder="$t('microConfig.configNamePlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('microConfig.modelName')" prop="ModelName">
        <el-input
          v-model="form.ModelName"
          :placeholder="$t('microConfig.modelNamePlaceholder')"
          :disabled="Boolean(form.ItemId)"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('microConfig.microAppPath')" prop="MicroAppPath">
        <el-input v-model="form.MicroAppPath" :placeholder="$t('microConfig.microAppPathPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('microConfig.configDesc')" prop="configDesc">
        <el-input
          v-model="form.configDesc"
          type="textarea"
          :placeholder="$t('microConfig.configDescPlaceholder')"
          :rows="3"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('common.status')">
        <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
export default {
  name: 'MicroAppConfigDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    form: { type: Object, default: () => ({}) },
    rules: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'submit'],
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
    validate(callback) {
      return this.$refs.formRef.validate(callback)
    },
    submit() {
      this.$emit('submit')
    }
  }
}
</script>
