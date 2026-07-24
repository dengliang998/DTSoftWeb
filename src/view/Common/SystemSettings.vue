<template>
  <div class="system-settings-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>系统设置</h1>
          <p>维护系统名称、登录视觉和后台主题配色。</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="loadSystemInfo">刷新</el-button>
          <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存</el-button>
        </div>
      </div>

      <div class="dt-panel settings-panel">
        <div class="dt-panel__header">
          <div>
            <strong>设置项</strong>
            <span>{{ form.systemName || 'DT Program' }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">基础信息</span>
            <span class="dt-chip dt-chip--success">视觉标识</span>
            <span class="dt-chip">主题</span>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="settings-form">
          <section class="settings-section">
            <div class="section-title">基础信息</div>
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="form.systemName" placeholder="请输入系统名称" maxlength="50" show-word-limit />
            </el-form-item>
            <el-form-item label="登录验证码">
              <div class="switch-setting">
                <el-switch v-model="form.loginCaptchaEnabled" active-text="启用" inactive-text="停用" inline-prompt />
                <span class="hint">停用后登录页不显示验证码，登录接口也不校验验证码</span>
              </div>
            </el-form-item>
          </section>

          <section class="settings-section">
            <div class="section-title">视觉标识</div>
            <el-form-item label="登录背景图">
              <div class="upload-row">
                <el-upload
                  class="upload"
                  action=""
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleLoginImgChange"
                >
                  <el-button type="primary">选择图片</el-button>
                </el-upload>

                <el-button :disabled="!selectedLoginImgFile" @click="clearSelectedLoginImg">清除已选</el-button>
                <span class="hint">支持常见图片格式；不选则保留当前背景图</span>
              </div>

              <div class="preview">
                <div class="preview-title">预览</div>
                <div class="login-preview-box" :style="loginPreviewStyle">
                  <div v-if="!loginPreviewUrl" class="preview-empty">暂无图片</div>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="Tab 小 Logo">
              <div class="logo-setting">
                <div class="upload-row">
                  <el-upload
                    class="upload"
                    action=""
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp"
                    :on-change="handleBrowserLogoChange"
                  >
                    <el-button type="primary">选择图片</el-button>
                  </el-upload>

                  <el-button :disabled="!selectedBrowserLogoFile" @click="clearSelectedBrowserLogo">清除已选</el-button>
                  <span class="hint">建议使用正方形 PNG、ICO 或 SVG</span>
                </div>

                <div class="favicon-preview">
                  <div class="favicon-window">
                    <div class="favicon-dot"></div>
                    <div class="favicon-dot"></div>
                    <div class="favicon-dot"></div>
                    <div class="favicon-tab">
                      <div class="favicon-icon-box">
                        <img v-if="browserLogoPreviewUrl" :src="browserLogoPreviewUrl" alt="" />
                        <span v-else>DT</span>
                      </div>
                      <span class="favicon-title">{{ form.systemName || 'DT Program' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </section>

          <section class="settings-section">
            <div class="section-title">系统主题</div>
            <el-form-item label="主题模式">
              <el-radio-group v-model="form.theme.mode" @change="handleThemeModeChange">
                <el-radio-button label="preset">预设</el-radio-button>
                <el-radio-button label="custom">自定义</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="主题配色">
              <div class="theme-panel">
                <div class="preset-grid">
                  <button
                    v-for="preset in themePresets"
                    :key="preset.key"
                    type="button"
                    class="preset-card"
                    :class="{ active: form.theme.preset === preset.key }"
                    @click="selectThemePreset(preset.key)"
                  >
                    <span class="preset-name">{{ preset.name }}</span>
                    <span class="preset-swatches">
                      <span
                        v-for="color in getPresetSwatches(preset)"
                        :key="color"
                        class="preset-swatch"
                        :style="{ backgroundColor: color }"
                      ></span>
                    </span>
                  </button>
                </div>

                <div v-if="form.theme.mode === 'custom'" class="custom-color-groups">
                  <div v-for="group in colorGroups" :key="group.title" class="custom-color-group">
                    <div class="custom-color-title">{{ group.title }}</div>
                    <div class="custom-color-grid">
                      <label v-for="field in group.fields" :key="field.key" class="color-field">
                        <span>{{ field.label }}</span>
                        <el-color-picker
                          v-model="form.theme.colors[field.key]"
                          color-format="hex"
                          @change="previewTheme"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div class="theme-preview" :style="themePreviewStyle">
                  <div class="theme-preview-topbar">
                    <div class="theme-preview-logo"></div>
                    <span></span>
                    <span class="active"></span>
                    <span></span>
                  </div>
                  <div class="theme-preview-body">
                    <div class="theme-preview-sidebar">
                      <span></span>
                      <span class="hover"></span>
                      <span class="active"></span>
                      <span></span>
                    </div>
                    <div class="theme-preview-main">
                      <div class="theme-preview-header"></div>
                      <div class="theme-preview-button"></div>
                      <div class="theme-preview-lines">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </section>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { Check, Refresh } from '@element-plus/icons-vue'
import { setSystemInfo } from '@/api/sysconfig'
import {
  THEME_PRESETS,
  applyBrowserLogo,
  applyThemeConfig,
  fetchAndCacheSystemInfo,
  getCachedBrowserLogoDataUrl,
  getCachedLoginCaptchaEnabled,
  getCachedLoginImgDataUrl,
  getCachedSystemName,
  getCachedThemeConfig,
  getThemePreset,
  normalizeThemeConfig,
  serializeThemeConfig
} from '@/utils/sysConfig'

export default defineComponent({
  name: 'SystemSettings',
  setup() {
    const { proxy } = getCurrentInstance()
    const formRef = ref(null)
    const saving = ref(false)

    const form = reactive({
      systemName: '',
      loginCaptchaEnabled: getCachedLoginCaptchaEnabled(),
      loginImg: '',
      browserLogo: '',
      theme: getCachedThemeConfig()
    })

    const selectedLoginImgFile = ref(null)
    const selectedLoginPreviewUrl = ref('')
    const selectedBrowserLogoFile = ref(null)
    const selectedBrowserLogoPreviewUrl = ref('')

    const colorGroups = [
      {
        title: '通用',
        fields: [
          { key: 'primary', label: '主色' },
          { key: 'primaryLight', label: '亮色' },
          { key: 'primaryDark', label: '深色' },
          { key: 'pageBg', label: '页面背景' }
        ]
      },
      {
        title: '顶部菜单栏',
        fields: [
          { key: 'topBg', label: '背景' },
          { key: 'topBorder', label: '边框' },
          { key: 'topText', label: '文字' },
          { key: 'topHoverBg', label: '悬停背景' },
          { key: 'topHoverText', label: '悬停文字' },
          { key: 'topActiveBg', label: '选中背景' },
          { key: 'topActiveText', label: '选中文字' }
        ]
      },
      {
        title: '左侧菜单列表',
        fields: [
          { key: 'sideBg', label: '背景' },
          { key: 'sideBorder', label: '边框' },
          { key: 'sideText', label: '文字' },
          { key: 'sideHoverBg', label: '悬停背景' },
          { key: 'sideHoverText', label: '悬停文字' },
          { key: 'sideActiveBg', label: '选中背景' },
          { key: 'sideActiveText', label: '选中文字' }
        ]
      }
    ]

    const rules = {
      systemName: [{ required: true, whitespace: true, message: '请输入系统名称', trigger: ['blur', 'change'] }]
    }

    const loginPreviewUrl = computed(() => {
      return selectedLoginPreviewUrl.value || getCachedLoginImgDataUrl()
    })

    const browserLogoPreviewUrl = computed(() => {
      return selectedBrowserLogoPreviewUrl.value || getCachedBrowserLogoDataUrl()
    })

    const loginPreviewStyle = computed(() => {
      if (!loginPreviewUrl.value) return {}
      return {
        backgroundImage: `url('${loginPreviewUrl.value}')`
      }
    })

    const themePreviewStyle = computed(() => ({
      '--preview-primary': form.theme.colors.primary,
      '--preview-primary-light': form.theme.colors.primaryLight,
      '--preview-top-bg': form.theme.colors.topBg,
      '--preview-top-border': form.theme.colors.topBorder,
      '--preview-top-text': form.theme.colors.topText,
      '--preview-top-active-bg': form.theme.colors.topActiveBg,
      '--preview-top-active-text': form.theme.colors.topActiveText,
      '--preview-side-bg': form.theme.colors.sideBg,
      '--preview-side-border': form.theme.colors.sideBorder,
      '--preview-side-text': form.theme.colors.sideText,
      '--preview-side-hover-bg': form.theme.colors.sideHoverBg,
      '--preview-side-hover-text': form.theme.colors.sideHoverText,
      '--preview-side-active-bg': form.theme.colors.sideActiveBg,
      '--preview-side-active-text': form.theme.colors.sideActiveText,
      '--preview-page-bg': form.theme.colors.pageBg
    }))

    const revokeObjectUrl = (urlRef) => {
      if (urlRef.value && urlRef.value.startsWith('blob:')) {
        URL.revokeObjectURL(urlRef.value)
      }
      urlRef.value = ''
    }

    const assignFilePreview = (file, fileRef, previewRef) => {
      revokeObjectUrl(previewRef)
      fileRef.value = file?.raw || null
      if (fileRef.value) {
        previewRef.value = URL.createObjectURL(fileRef.value)
      }
    }

    const handleLoginImgChange = (file) => {
      assignFilePreview(file, selectedLoginImgFile, selectedLoginPreviewUrl)
    }

    const handleBrowserLogoChange = (file) => {
      assignFilePreview(file, selectedBrowserLogoFile, selectedBrowserLogoPreviewUrl)
      if (selectedBrowserLogoPreviewUrl.value) {
        applyBrowserLogo(selectedBrowserLogoPreviewUrl.value)
      }
    }

    const clearSelectedLoginImg = () => {
      selectedLoginImgFile.value = null
      revokeObjectUrl(selectedLoginPreviewUrl)
    }

    const clearSelectedBrowserLogo = () => {
      selectedBrowserLogoFile.value = null
      revokeObjectUrl(selectedBrowserLogoPreviewUrl)
      applyBrowserLogo()
    }

    const setTheme = (themeConfig) => {
      Object.assign(form.theme, normalizeThemeConfig(themeConfig))
      applyThemeConfig(form.theme)
    }

    const selectThemePreset = (presetKey) => {
      const preset = getThemePreset(presetKey)
      setTheme({
        mode: form.theme.mode,
        preset: preset.key,
        colors: preset.colors
      })
    }

    const handleThemeModeChange = (mode) => {
      const preset = getThemePreset(form.theme.preset)
      setTheme({
        mode,
        preset: preset.key,
        colors: mode === 'preset' ? preset.colors : form.theme.colors
      })
    }

    const previewTheme = () => {
      form.theme.mode = 'custom'
      applyThemeConfig(form.theme)
    }

    const getPresetSwatches = (preset) => [
      preset.colors.primary,
      preset.colors.topBg,
      preset.colors.sideBg,
      preset.colors.pageBg
    ]

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
          form.loginCaptchaEnabled = res?.data?.loginCaptchaEnabled !== false
          form.loginImg = res?.data?.loginImg || ''
          form.browserLogo = res?.data?.browserLogo || ''
          setTheme(
            Object.prototype.hasOwnProperty.call(res?.data || {}, 'themeConfig')
              ? res.data.themeConfig
              : getCachedThemeConfig()
          )
          clearSelectedLoginImg()
          clearSelectedBrowserLogo()
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
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) {
        proxy.$message.warning('请先填写系统名称')
        return
      }

      saving.value = true
      try {
        const systemName = form.systemName.trim()
        const { data: res } = await setSystemInfo({
          SystemName: systemName,
          LoginCaptchaEnabled: form.loginCaptchaEnabled,
          LoginImg: selectedLoginImgFile.value,
          BrowserLogo: selectedBrowserLogoFile.value,
          ThemeConfig: serializeThemeConfig(form.theme)
        })
        if (res?.success) {
          proxy.$message.success('保存成功')
          clearSelectedLoginImg()
          clearSelectedBrowserLogo()
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
      applyThemeConfig(form.theme)
      await loadSystemInfo()
    })

    onBeforeUnmount(() => {
      revokeObjectUrl(selectedLoginPreviewUrl)
      revokeObjectUrl(selectedBrowserLogoPreviewUrl)
      applyBrowserLogo()
      applyThemeConfig()
    })

    return {
      formRef,
      form,
      rules,
      saving,
      selectedLoginImgFile,
      selectedBrowserLogoFile,
      loginPreviewUrl,
      browserLogoPreviewUrl,
      loginPreviewStyle,
      themePreviewStyle,
      themePresets: THEME_PRESETS,
      colorGroups,
      getPresetSwatches,
      handleLoginImgChange,
      handleBrowserLogoChange,
      clearSelectedLoginImg,
      clearSelectedBrowserLogo,
      selectThemePreset,
      handleThemeModeChange,
      previewTheme,
      loadSystemInfo,
      save,
      Check,
      Refresh
    }
  }
})
</script>

<style lang="less" scoped>
.system-settings-container {
  height: 100%;
  min-height: 0;
}

.settings-panel {
  min-width: 0;
}

.settings-form {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 22px 26px 26px;
}

.settings-section {
  max-width: 980px;
  padding: 0 0 22px;
}

.settings-section + .settings-section {
  padding-top: 22px;
  border-top: 1px solid #ebeef5;
}

.section-title {
  margin: 0 0 18px;
  color: #1f2937;
  font-size: 15px;
  font-weight: 700;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.switch-setting {
  display: flex;
  align-items: center;
  gap: 12px;
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

.login-preview-box {
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

.logo-setting {
  width: 100%;
}

.favicon-preview {
  margin-top: 12px;
  max-width: 460px;
}

.favicon-window {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 10px;
  background: #eef2f7;
  border: 1px solid #d8dee8;
  border-radius: 8px 8px 0 0;
  box-sizing: border-box;
}

.favicon-dot {
  width: 8px;
  height: 8px;
  background: #c3cad6;
  border-radius: 50%;
}

.favicon-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 32px;
  padding: 0 12px;
  margin-left: 4px;
  background: #ffffff;
  border: 1px solid #d8dee8;
  border-bottom-color: #ffffff;
  border-radius: 8px 8px 0 0;
}

.favicon-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  overflow: hidden;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  background: var(--dt-primary);
  border-radius: 4px;
}

.favicon-icon-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.favicon-title {
  min-width: 0;
  max-width: 270px;
  overflow: hidden;
  color: #475467;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-panel {
  width: 100%;
  max-width: 900px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.preset-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.preset-card:hover,
.preset-card.active {
  border-color: var(--dt-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dt-primary) 12%, transparent);
}

.preset-card.active {
  transform: translateY(-1px);
}

.preset-name {
  color: #1f2937;
  font-size: 13px;
  font-weight: 700;
}

.preset-swatches {
  display: flex;
  align-items: center;
}

.preset-swatch {
  width: 18px;
  height: 18px;
  margin-left: -4px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08);
}

.custom-color-groups {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.custom-color-group {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.custom-color-title {
  margin-bottom: 10px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 700;
}

.custom-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.color-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 12px;
  color: #475467;
  font-size: 13px;
  font-weight: 600;
  background: #f8fafc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.theme-preview {
  display: flex;
  flex-direction: column;
  height: 190px;
  margin-top: 16px;
  overflow: hidden;
  background: var(--preview-page-bg);
  border: 1px solid #d8dee8;
  border-radius: 8px;
}

.theme-preview-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 42px;
  padding: 0 14px;
  background: var(--preview-top-bg);
  border-bottom: 1px solid var(--preview-top-border);
}

.theme-preview-logo {
  width: 22px;
  height: 22px;
  background: var(--preview-primary);
  border-radius: 6px;
}

.theme-preview-topbar span {
  width: 58px;
  height: 18px;
  background: color-mix(in srgb, var(--preview-top-text) 72%, transparent);
  border-radius: 6px;
}

.theme-preview-topbar span.active {
  background: var(--preview-top-active-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--preview-top-active-text) 18%, transparent);
}

.theme-preview-body {
  display: grid;
  grid-template-columns: 132px 1fr;
  flex: 1;
  min-height: 0;
}

.theme-preview-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 14px;
  background: var(--preview-side-bg);
  border-right: 1px solid var(--preview-side-border);
}

.theme-preview-sidebar span {
  height: 14px;
  background: color-mix(in srgb, var(--preview-side-text) 70%, transparent);
  border-radius: 4px;
}

.theme-preview-sidebar span.hover {
  background: var(--preview-side-hover-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--preview-side-hover-text) 35%, transparent);
}

.theme-preview-sidebar span.active {
  background: var(--preview-side-active-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--preview-side-active-text) 18%, transparent);
}

.theme-preview-main {
  padding: 18px;
}

.theme-preview-header {
  height: 20px;
  width: 46%;
  background: #ffffff;
  border-radius: 6px;
}

.theme-preview-button {
  width: 92px;
  height: 30px;
  margin-top: 18px;
  background: linear-gradient(135deg, var(--preview-primary) 0%, var(--preview-primary-light) 100%);
  border-radius: 6px;
}

.theme-preview-lines {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.theme-preview-lines span {
  height: 10px;
  background: #d8dee8;
  border-radius: 999px;
}

.theme-preview-lines span:nth-child(2) {
  width: 78%;
}

.theme-preview-lines span:nth-child(3) {
  width: 52%;
}
</style>
