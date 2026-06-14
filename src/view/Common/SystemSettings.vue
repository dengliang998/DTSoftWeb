<template>
  <div class="system-settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
          <div class="header-actions">
            <el-button @click="loadSystemInfo">刷新</el-button>
            <el-button type="primary" :loading="saving" @click="save">保存</el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="系统名称" prop="systemName">
          <el-input v-model="form.systemName" placeholder="请输入系统名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="登录背景图">
          <div class="upload-row">
            <el-upload
              class="upload"
              action=""
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleFileChange"
            >
              <el-button type="primary">选择图片</el-button>
            </el-upload>

            <el-button :disabled="!selectedFile" @click="clearSelected">清除已选</el-button>
            <span class="hint">支持常见图片格式；不选则仅更新系统名称</span>
          </div>

          <div class="preview">
            <div class="preview-title">预览</div>
            <div class="preview-box" :style="previewStyle">
              <div v-if="!previewUrl" class="preview-empty">暂无图片</div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { setSystemInfo } from '@/api/sysconfig'
import { fetchAndCacheSystemInfo, getCachedLoginImgDataUrl, getCachedSystemName } from '@/utils/sysConfig'

export default defineComponent({
  name: 'SystemSettings',
  setup() {
    const { proxy } = getCurrentInstance()
    const formRef = ref(null)
    const saving = ref(false)

    const form = reactive({
      systemName: '',
      loginImg: '' // base64 from server
    })

    const selectedFile = ref(null)
    const selectedPreviewUrl = ref('')

    const rules = {
      systemName: [{ required: true, message: '请输入系统名称', trigger: 'blur' }]
    }

    const previewUrl = computed(() => {
      return selectedPreviewUrl.value || getCachedLoginImgDataUrl()
    })

    const previewStyle = computed(() => {
      if (!previewUrl.value) return {}
      return {
        backgroundImage: `url('${previewUrl.value}')`
      }
    })

    const revokeSelectedPreview = () => {
      if (selectedPreviewUrl.value && selectedPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(selectedPreviewUrl.value)
      }
      selectedPreviewUrl.value = ''
    }

    const handleFileChange = (file) => {
      revokeSelectedPreview()
      selectedFile.value = file?.raw || null
      if (selectedFile.value) {
        selectedPreviewUrl.value = URL.createObjectURL(selectedFile.value)
      }
    }

    const clearSelected = () => {
      selectedFile.value = null
      revokeSelectedPreview()
    }

    const loadSystemInfo = async () => {
      const loading = proxy.$loading({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.2)'
      })
      try {
        const res = await fetchAndCacheSystemInfo()
        if (res?.success) {
          form.systemName = getCachedSystemName()
          form.loginImg = res?.data?.loginImg || ''
        } else {
          proxy.$message.error('获取系统设置失败')
        }
      } catch (e) {
        proxy.$message.error('获取系统设置失败：' + (e?.message || e))
      } finally {
        loading.close()
      }
    }

    const save = async () => {
      if (!formRef.value) return
      await formRef.value.validate()

      saving.value = true
      try {
        const { data: res } = await setSystemInfo({
          SystemName: form.systemName,
          LoginImg: selectedFile.value
        })
        if (res?.success) {
          proxy.$message.success('保存成功')
          clearSelected()
          await loadSystemInfo()
        } else {
          proxy.$message.error('保存失败')
        }
      } catch (e) {
        proxy.$message.error('保存失败：' + (e?.message || e))
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      form.systemName = getCachedSystemName()
      await loadSystemInfo()
    })

    onBeforeUnmount(() => {
      revokeSelectedPreview()
    })

    return {
      formRef,
      form,
      rules,
      saving,
      selectedFile,
      previewUrl,
      previewStyle,
      handleFileChange,
      clearSelected,
      loadSystemInfo,
      save
    }
  }
})
</script>

<style lang="less" scoped>
.system-settings-container {
  padding: 16px;
}

.settings-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hint {
  color: #6b7280;
  font-size: 12px;
}

.preview {
  margin-top: 12px;
  width: 100%;
}

.preview-title {
  color: #374151;
  font-size: 12px;
  margin-bottom: 6px;
}

.preview-box {
  width: 100%;
  max-width: 900px;
  height: 240px;
  border-radius: 10px;
  border: 1px dashed #d1d5db;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-empty {
  color: #9ca3af;
  font-size: 12px;
}
</style>

