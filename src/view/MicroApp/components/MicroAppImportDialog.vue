<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('microRuntime.importTitle')"
    width="50%"
    :top="'20vh'"
    :close-on-click-modal="false"
    :close-on-press-escape="!importLoading"
  >
    <el-form label-width="100px">
      <el-form-item :label="$t('microRuntime.selectFile')">
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
            {{ $t('microRuntime.uploadText') }}
            <em>{{ $t('microRuntime.clickUpload') }}</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">{{ $t('microRuntime.uploadTip') }}</div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item :label="$t('microRuntime.importTips')">
        <div class="import-tips">
          <p>• {{ $t('microRuntime.importTipHeader') }}</p>
          <p>• {{ $t('microRuntime.importTipLarge') }}</p>
          <p>• {{ $t('microRuntime.importTipStay') }}</p>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="importLoading" @click="handleCancel">{{ $t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="importLoading || fileList.length === 0"
          @click="doImport"
        >
          {{ importLoading ? $t('microRuntime.importing') : $t('microRuntime.import') }}
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
        this.$message.error(this.$t('microRuntime.selectImportFile'))
        return
      }
      this.importLoading = true
      try {
        const formData = new FormData()
        formData.append('file', this.fileList[0].raw)
        const { data: res } = await importMicroRuntimeData({ modelName: this.appConfig.modelName, data: formData })
        if (res.success) {
          this.$message.success(res.msg || this.$t('microRuntime.importSuccess'))
          this.fileList = []
          this.dialogVisible = false
          this.$emit('success')
        } else {
          this.$message.error(res.msg || this.$t('microRuntime.importFailed'))
        }
      } catch (error) {
        this.$message.error(
          `${this.$t('microRuntime.importFailed')}: ${error.message || this.$t('microRuntime.networkError')}`
        )
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
