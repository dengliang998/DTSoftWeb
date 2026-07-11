<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="formDialogWidth"
    :top="'20vh'"
    :close-on-click-modal="false"
  >
    <div class="dialog-form-container">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="16">
          <el-col v-for="(field, index) in orderedFields" :key="index" :span="formFieldSpan">
            <el-form-item :label="field.label || field.fieldName" :prop="field.fieldName" :rules="getFieldRules(field)">
              <el-input
                v-if="field.fieldType === 'string'"
                v-model="formData[field.fieldName]"
                :placeholder="'请输入' + (field.label || field.fieldName)"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
              <el-input-number
                v-else-if="field.fieldType === 'number'"
                v-model="formData[field.fieldName]"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input-number>
              <el-date-picker
                v-else-if="field.fieldType === 'datetime'"
                v-model="formData[field.fieldName]"
                :type="getDatePickerType(field)"
                :value-format="getDateValueFormat(field)"
                :format="getDateDisplayFormat(field)"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-date-picker>
              <el-switch
                v-else-if="field.fieldType === 'boolean'"
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-switch>
              <el-input
                v-else-if="field.fieldType === 'textarea'"
                v-model="formData[field.fieldName]"
                type="textarea"
                :rows="4"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
              <el-select
                v-else-if="field.fieldType === 'select'"
                v-model="formData[field.fieldName]"
                style="width: 100%"
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <el-option
                  v-for="opt in field.options || []"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                ></el-option>
              </el-select>
              <el-radio-group
                v-else-if="field.fieldType === 'radio'"
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <el-radio v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
              <el-checkbox-group
                v-else-if="field.fieldType === 'checkbox'"
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              >
                <el-checkbox v-for="opt in field.options || []" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
              <el-input
                v-else
                v-model="formData[field.fieldName]"
                :disabled="dialogType === 'edit' && !field.editable"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { createMicroRuntimeData, updateMicroRuntimeData } from '@/api/microApp'

export default {
  name: 'MicroAppFormDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    dialogType: { type: String, default: 'create' },
    formData: { type: Object, default: () => ({}) },
    formRules: { type: Object, default: () => ({}) },
    orderedFields: { type: Array, default: () => [] },
    appConfig: { type: Object, default: () => ({}) },
    formDialogWidth: { type: String, default: '50%' },
    formFieldSpan: { type: Number, default: 24 }
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
    getFieldRules(field) {
      const rules = []
      if (field.required) {
        rules.push({ required: true, message: `${field.label || field.fieldName}不能为空`, trigger: 'blur' })
      }
      if (field.minLength || field.maxLength) {
        rules.push({
          min: field.minLength || 0,
          max: field.maxLength || 99999,
          message: `长度${field.minLength || 0}-${field.maxLength || 99999}个字符`,
          trigger: 'blur'
        })
      }
      if (field.fieldType === 'number') {
        rules.push({
          validator: (rule, value, callback) => {
            if (value === null || value === undefined) return callback()
            if (isNaN(Number(value))) return callback(new Error('请输入数字'))
            if (field.minValue !== null && field.minValue !== undefined && Number(value) < Number(field.minValue))
              return callback(new Error(`不能小于${field.minValue}`))
            if (field.maxValue !== null && field.maxValue !== undefined && Number(value) > Number(field.maxValue))
              return callback(new Error(`不能大于${field.maxValue}`))
            callback()
          },
          trigger: 'blur'
        })
      }
      if (field.pattern) {
        try {
          rules.push({ pattern: new RegExp(field.pattern), message: '格式不正确', trigger: 'blur' })
        } catch (e) {}
      }
      return rules
    },
    getDateFormatType(field) {
      return ['year', 'month', 'date', 'datetime'].includes(field?.dateFormat) ? field.dateFormat : 'datetime'
    },
    getDatePickerType(field) {
      const t = this.getDateFormatType(field)
      return t === 'datetime' ? 'datetime' : t
    },
    getDateValueFormat(field) {
      const map = { year: 'YYYY', month: 'YYYY-MM', date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:mm:ss' }
      return map[this.getDateFormatType(field)]
    },
    getDateDisplayFormat(field) {
      const map = { year: 'YYYY', month: 'YYYY-MM', date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:mm:ss' }
      return map[this.getDateFormatType(field)]
    },
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return
        try {
          const submitData = { ...this.formData }
          delete submitData.ItemId
          delete submitData.itemId
          delete submitData.CreateTime
          delete submitData.UpdateTime
          delete submitData.createTime
          delete submitData.updateTime
          delete submitData.created_time
          delete submitData.updated_time

          let res
          if (this.dialogType === 'create') {
            res = await createMicroRuntimeData({ modelName: this.appConfig.modelName, data: submitData })
          } else {
            const id = this.formData.ItemId || this.formData.itemId || this.formData.id || this.formData.Id
            if (!id) {
              this.$message.error('更新失败：无法获取数据ID')
              return
            }
            res = await updateMicroRuntimeData({ modelName: this.appConfig.modelName, id, data: submitData })
          }
          if (res.data.success) {
            this.$message.success(this.dialogType === 'create' ? '新增成功' : '更新成功')
            this.dialogVisible = false
            this.$emit('success')
          } else {
            this.$message.error(res.data.msg || '操作失败')
          }
        } catch (error) {
          this.$message.error(error.message || '网络错误')
        }
      })
    }
  }
}
</script>

<style scoped>
.dialog-form-container {
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 10px;
}
.dialog-form-container::-webkit-scrollbar {
  width: 6px;
}
.dialog-form-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.dialog-form-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
</style>
