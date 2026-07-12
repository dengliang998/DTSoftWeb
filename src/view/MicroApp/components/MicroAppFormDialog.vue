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
              <div v-else-if="field.fieldType === 'attachment'" class="attachment-field">
                <el-upload
                  class="attachment-upload"
                  :action="uploadActionUrl"
                  name="Files"
                  multiple
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :disabled="dialogType === 'edit' && !field.editable"
                  :on-success="(response, file) => handleAttachmentUploadSuccess(response, file, field)"
                  :on-error="handleAttachmentUploadError"
                >
                  <el-button
                    type="primary"
                    size="small"
                    icon="Upload"
                    :disabled="dialogType === 'edit' && !field.editable"
                  >
                    上传附件
                  </el-button>
                </el-upload>
                <div v-if="getAttachmentList(field).length > 0" class="attachment-list">
                  <div
                    v-for="(attachment, attachmentIndex) in getAttachmentList(field)"
                    :key="getAttachmentKey(attachment, attachmentIndex)"
                    class="attachment-item"
                  >
                    <span class="attachment-name" :title="getAttachmentName(attachment)">
                      {{ getAttachmentName(attachment) }}
                    </span>
                    <el-button
                      v-if="!(dialogType === 'edit' && !field.editable)"
                      class="attachment-remove-button"
                      text
                      type="danger"
                      size="small"
                      icon="Delete"
                      title="移除附件"
                      @click="removeAttachment(field, attachmentIndex)"
                    ></el-button>
                  </div>
                </div>
                <div v-else class="attachment-empty">暂无附件</div>
              </div>
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
import { getFileDownloadUrl, getFileUploadUrl, getUploadHeaders } from '@/api/file'
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
  data() {
    return {
      uploadActionUrl: getFileUploadUrl(),
      uploadHeaders: getUploadHeaders()
    }
  },
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
      if (field.fieldType === 'attachment') {
        if (field.required) {
          rules.push({
            validator: (rule, value, callback) => {
              if (this.normalizeAttachmentValue(value).length === 0) {
                callback(new Error(`${field.label || field.fieldName}不能为空`))
                return
              }
              callback()
            },
            trigger: 'change'
          })
        }
        return rules
      }
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
    normalizeAttachmentValue(value) {
      let normalized = value
      if (!normalized) return []
      if (typeof normalized === 'string') {
        try {
          normalized = JSON.parse(normalized)
        } catch (error) {
          return []
        }
      }
      if (!Array.isArray(normalized)) {
        return []
      }
      return normalized.filter((item) => item && typeof item === 'object')
    },
    getAttachmentList(field) {
      return this.normalizeAttachmentValue(this.formData[field.fieldName])
    },
    getAttachmentKey(attachment, index) {
      return attachment.FileID || attachment.fileId || attachment.FileId || attachment.id || index
    },
    getAttachmentFileId(attachment) {
      return attachment.FileID || attachment.fileId || attachment.FileId || attachment.id || ''
    },
    getAttachmentName(attachment) {
      return (
        attachment.FileName ||
        attachment.fileName ||
        attachment.name ||
        this.getAttachmentFileId(attachment) ||
        '未命名附件'
      )
    },
    normalizeUploadedAttachment(item, file) {
      return {
        FileID: item.FileID || item.fileId || item.FileId || '',
        FileName: item.FileName || item.fileName || file?.name || '未命名附件',
        Ext: item.Ext || item.ext || '',
        Size: item.Size || item.size || file?.size || 0
      }
    },
    handleAttachmentUploadSuccess(response, file, field) {
      if (!response?.success) {
        this.$message.error(response?.Msg || response?.message || '附件上传失败')
        return
      }

      const uploaded = Array.isArray(response.data) ? response.data : []
      const items = uploaded.map((item) => this.normalizeUploadedAttachment(item, file)).filter((item) => item.FileID)
      if (items.length === 0) {
        this.$message.error('附件上传失败：未返回文件编号')
        return
      }

      const current = this.getAttachmentList(field)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current.concat(items)
      this.$refs.formRef?.validateField(field.fieldName)
      this.$message.success('附件上传成功')
    },
    handleAttachmentUploadError() {
      this.$message.error('附件上传失败')
    },
    removeAttachment(field, index) {
      const current = this.getAttachmentList(field)
      current.splice(index, 1)
      // eslint-disable-next-line vue/no-mutating-props
      this.formData[field.fieldName] = current
      this.$refs.formRef?.validateField(field.fieldName)
    },
    downloadAttachment(attachment) {
      const fileId = this.getAttachmentFileId(attachment)
      if (!fileId) {
        this.$message.warning('无法获取文件编号')
        return
      }
      window.location.href = getFileDownloadUrl(fileId)
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
          this.orderedFields.forEach((field) => {
            if (field.fieldType === 'attachment') {
              submitData[field.fieldName] = JSON.stringify(this.normalizeAttachmentValue(submitData[field.fieldName]))
            }
          })

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

.attachment-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  background: #fbfdff;
}

.attachment-name {
  min-width: 0;
  overflow: hidden;
  color: #344563;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-remove-button {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: #e5484d !important;
}

.attachment-remove-button:hover,
.attachment-remove-button:focus {
  background: #feecec !important;
  color: #c73338 !important;
}

.attachment-empty {
  color: #8a98aa;
  font-size: 13px;
  line-height: 20px;
}
</style>
