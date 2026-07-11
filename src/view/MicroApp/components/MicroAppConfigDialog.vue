<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog v-model="dialogVisible" :title="title" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="配置名称" prop="ConfigName">
        <el-input v-model="form.ConfigName" placeholder="请输入配置名称"></el-input>
      </el-form-item>
      <el-form-item label="数据模型" prop="ModelName">
        <el-input
          v-model="form.ModelName"
          placeholder="请输入数据模型名称（英文）"
          :disabled="Boolean(form.ItemId)"
        ></el-input>
      </el-form-item>
      <el-form-item label="微应用路径" prop="MicroAppPath">
        <el-input v-model="form.MicroAppPath" placeholder="请输入微应用路径，例如 customer_center"></el-input>
      </el-form-item>
      <el-form-item label="配置描述" prop="configDesc">
        <el-input v-model="form.configDesc" type="textarea" placeholder="请输入配置描述" :rows="3"></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.Status" :active-value="1" :inactive-value="0"></el-switch>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submit">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
export default {
  name: 'MicroAppConfigDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '创建微应用' },
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
