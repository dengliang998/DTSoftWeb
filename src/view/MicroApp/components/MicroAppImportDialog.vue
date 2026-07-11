<template>
  <el-dialog
    v-model="dialogVisible"
    title="Excel导入"
    width="50%"
    :top="'20vh'"
    :close-on-click-modal="false"
    :close-on-press-escape="!importLoading"
  >
    <el-form label-width="100px">
      <el-form-item label="选择文件">
        <el-upload
          v-model:file-list="fileList"
          :auto-upload="false"
          :show-file-list="true"
          accept=".xlsx,.xls"
          drag
          :multiple="false"
          :disabled="importLoading"
          @change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或
            <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持上传 .xlsx, .xls 格式文件</div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item label="导入说明">
        <div class="import-tips">
          <p>• 请确保Excel文件列头与系统字段匹配</p>
          <p>• 数据量较大时可能需要等待较长时间</p>
          <p>• 导入过程中请勿关闭页面</p>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="importLoading" @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="importLoading || fileList.length === 0"
          @click="doImport"
        >
          {{ importLoading ? '导入中...' : '导入' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { importMicroRuntimeData } from '@/api/microApp'
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'MicroAppImportDialog',
  components: { UploadFilled },
  props: {
    modelValue: { type: Boolean, default: false },
    appConfig: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      fileList: [],
      importLoading: false
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
  watch: {
    modelValue(val) {
      if (val) {
        this.fileList = []
        this.importLoading = false
      }
    }
  },
  methods: {
    handleFileChange(file, fileList) {
      this.fileList = fileList.slice(-1)
    },
    handleCancel() {
      this.fileList = []
      this.importLoading = false
      this.dialogVisible = false
    },
    async doImport() {
      if (this.fileList.length === 0) {
        this.$message.error('请选择要导入的文件')
        return
      }
      this.importLoading = true
      try {
        const formData = new FormData()
        formData.append('file', this.fileList[0].raw)
        const { data: res } = await importMicroRuntimeData({ modelName: this.appConfig.modelName, data: formData })
        if (res.success) {
          this.$message.success(res.msg || '导入成功')
          this.fileList = []
          this.dialogVisible = false
          this.$emit('success')
        } else {
          this.$message.error(res.msg || '导入失败')
        }
      } catch (error) {
        this.$message.error('导入失败：' + (error.message || '网络错误'))
      } finally {
        this.importLoading = false
      }
    }
  }
}
</script>

<style scoped>
.import-tips {
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}
.import-tips p {
  margin: 0;
  padding: 2px 0;
}
</style>
