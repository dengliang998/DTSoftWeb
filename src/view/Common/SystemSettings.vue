<template>
  <div class="system-settings-container dt-page-shell">
    <section class="dt-workbench">
      <div class="dt-commandbar">
        <div class="dt-page-title">
          <h1>{{ $t('systemSettings.title') }}</h1>
          <p>{{ $t('systemSettings.subtitle') }}</p>
        </div>
        <div class="dt-command-actions">
          <el-button class="dt-ghost-action" :icon="Refresh" @click="loadSystemInfo">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Check" :loading="saving" @click="save">{{ $t('common.save') }}</el-button>
        </div>
      </div>

      <div class="dt-panel settings-panel">
        <div class="dt-panel__header">
          <div>
            <strong>{{ $t('systemSettings.panelTitle') }}</strong>
            <span>{{ form.systemName || 'DT Program' }}</span>
          </div>
          <div class="dt-panel__meta">
            <span class="dt-chip">{{ $t('systemSettings.baseInfo') }}</span>
            <span class="dt-chip dt-chip--success">{{ $t('systemSettings.visualIdentity') }}</span>
            <span class="dt-chip">{{ $t('systemSettings.theme') }}</span>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="settings-form">
          <section class="settings-section">
            <div class="section-title">{{ $t('systemSettings.baseInfo') }}</div>
            <el-form-item :label="$t('systemSettings.systemName')" prop="systemName">
              <el-input
                v-model="form.systemName"
                :placeholder="$t('systemSettings.systemNamePlaceholder')"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
            <el-form-item :label="$t('systemSettings.loginCaptcha')">
              <div class="switch-setting">
                <el-switch
                  v-model="form.loginCaptchaEnabled"
                  :active-text="$t('common.enabled')"
                  :inactive-text="$t('common.disabled')"
                  inline-prompt
                />
                <span class="hint">{{ $t('systemSettings.loginCaptchaHint') }}</span>
              </div>
            </el-form-item>
          </section>

          <section class="settings-section">
            <div class="section-title">{{ $t('systemSettings.visualIdentity') }}</div>
            <el-form-item :label="$t('systemSettings.loginBackground')">
              <div class="upload-row">
                <el-upload
                  class="upload"
                  action=""
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleLoginImgChange"
                  :before-upload="beforeLoginImgUpload"
                >
                  <el-button type="primary">{{ $t('systemSettings.chooseImage') }}</el-button>
                </el-upload>

                <el-button :disabled="!selectedLoginImgFile" @click="clearSelectedLoginImg">
                  {{ $t('systemSettings.clearSelected') }}
                </el-button>
                <span class="hint">{{ $t('systemSettings.loginImageHint', { size: loginImgLimitText }) }}</span>
              </div>

              <div class="preview">
                <div class="preview-title">{{ $t('systemSettings.preview') }}</div>
                <div class="login-preview-box" :style="loginPreviewStyle">
                  <div v-if="!loginPreviewUrl" class="preview-empty">{{ $t('systemSettings.noImage') }}</div>
                </div>
              </div>
            </el-form-item>

            <el-form-item :label="$t('systemSettings.browserLogo')">
              <div class="logo-setting">
                <div class="upload-row">
                  <el-upload
                    class="upload"
                    action=""
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp"
                    :on-change="handleBrowserLogoChange"
                    :before-upload="beforeBrowserLogoUpload"
                  >
                    <el-button type="primary">{{ $t('systemSettings.chooseImage') }}</el-button>
                  </el-upload>

                  <el-button :disabled="!selectedBrowserLogoFile" @click="clearSelectedBrowserLogo">
                    {{ $t('systemSettings.clearSelected') }}
                  </el-button>
                  <span class="hint">{{ $t('systemSettings.browserLogoHint', { size: browserLogoLimitText }) }}</span>
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
            <div class="section-title">{{ $t('systemSettings.systemTheme') }}</div>
            <el-form-item :label="$t('systemSettings.themeMode')">
              <el-radio-group v-model="form.theme.mode" @change="handleThemeModeChange">
                <el-radio-button value="preset">{{ $t('systemSettings.preset') }}</el-radio-button>
                <el-radio-button value="custom">{{ $t('systemSettings.custom') }}</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item :label="$t('systemSettings.themeColors')">
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
                    <span class="preset-name">{{ $t(preset.nameKey) }}</span>
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
  resolveThemeRuntime,
  serializeThemeConfig
} from '@/utils/sysConfig'

const LOGIN_IMG_MAX_SIZE = 1024 * 1024
const BROWSER_LOGO_MAX_SIZE = 256 * 1024
const LOGIN_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BROWSER_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]

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
    const loginImgLimitText = '1MB'
    const browserLogoLimitText = '256KB'

    const colorGroups = computed(() => [
      {
        title: proxy.$t('systemSettings.general'),
        fields: [
          { key: 'primary', label: proxy.$t('systemSettings.primary') },
          { key: 'primaryLight', label: proxy.$t('systemSettings.primaryLight') },
          { key: 'primaryDark', label: proxy.$t('systemSettings.primaryDark') },
          { key: 'pageBg', label: proxy.$t('systemSettings.pageBg') }
        ]
      },
      {
        title: proxy.$t('systemSettings.topMenu'),
        fields: [
          { key: 'topBg', label: proxy.$t('systemSettings.background') },
          { key: 'topBorder', label: proxy.$t('systemSettings.border') },
          { key: 'topText', label: proxy.$t('systemSettings.text') },
          { key: 'topHoverBg', label: proxy.$t('systemSettings.hoverBg') },
          { key: 'topHoverText', label: proxy.$t('systemSettings.hoverText') },
          { key: 'topActiveBg', label: proxy.$t('systemSettings.activeBg') },
          { key: 'topActiveText', label: proxy.$t('systemSettings.activeText') }
        ]
      },
      {
        title: proxy.$t('systemSettings.sideMenu'),
        fields: [
          { key: 'sideBg', label: proxy.$t('systemSettings.background') },
          { key: 'sideBorder', label: proxy.$t('systemSettings.border') },
          { key: 'sideText', label: proxy.$t('systemSettings.text') },
          { key: 'sideHoverBg', label: proxy.$t('systemSettings.hoverBg') },
          { key: 'sideHoverText', label: proxy.$t('systemSettings.hoverText') },
          { key: 'sideActiveBg', label: proxy.$t('systemSettings.activeBg') },
          { key: 'sideActiveText', label: proxy.$t('systemSettings.activeText') }
        ]
      }
    ])

    const rules = {
      systemName: [
        {
          required: true,
          whitespace: true,
          message: proxy.$t('systemSettings.systemNameRequired'),
          trigger: ['blur', 'change']
        }
      ]
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

    const themePreviewStyle = computed(() => {
      const { palette, runtimeColors } = resolveThemeRuntime(form.theme)
      return {
        '--preview-primary': runtimeColors.primary,
        '--preview-primary-light': runtimeColors.primaryLight,
        '--preview-top-bg': runtimeColors.topBg,
        '--preview-top-border': runtimeColors.topBorder,
        '--preview-top-text': runtimeColors.topText,
        '--preview-top-active-bg': runtimeColors.topActiveBg,
        '--preview-top-active-text': runtimeColors.topActiveText,
        '--preview-side-bg': runtimeColors.sideBg,
        '--preview-side-border': runtimeColors.sideBorder,
        '--preview-side-text': runtimeColors.sideText,
        '--preview-side-hover-bg': runtimeColors.sideHoverBg,
        '--preview-side-hover-text': runtimeColors.sideHoverText,
        '--preview-side-active-bg': runtimeColors.sideActiveBg,
        '--preview-side-active-text': runtimeColors.sideActiveText,
        '--preview-page-bg': runtimeColors.pageBg,
        '--preview-surface': palette.surface,
        '--preview-surface-soft': palette.surfaceSoft,
        '--preview-border': palette.border,
        '--preview-text': palette.text,
        '--preview-text-muted': palette.textMuted
      }
    })

    const revokeObjectUrl = (urlRef) => {
      if (urlRef.value && urlRef.value.startsWith('blob:')) {
        URL.revokeObjectURL(urlRef.value)
      }
      urlRef.value = ''
    }

    const validateImageFile = ({ rawFile, allowedTypes, maxSize, maxSizeText, label }) => {
      if (!rawFile) return false
      const fileType = rawFile.type || ''

      if (!allowedTypes.includes(fileType)) {
        proxy.$message.error(
          proxy.$t('systemSettings.unsupportedFormat', {
            label,
            extra: label === proxy.$t('systemSettings.browserLogo') ? proxy.$t('systemSettings.iconExtraFormats') : ''
          })
        )
        return false
      }

      if (rawFile.size > maxSize) {
        proxy.$message.error(proxy.$t('systemSettings.fileTooLarge', { label, size: maxSizeText }))
        return false
      }

      return true
    }

    const validateLoginImgFile = (rawFile) =>
      validateImageFile({
        rawFile,
        allowedTypes: LOGIN_IMG_TYPES,
        maxSize: LOGIN_IMG_MAX_SIZE,
        maxSizeText: loginImgLimitText,
        label: proxy.$t('systemSettings.loginBackground')
      })

    const validateBrowserLogoFile = (rawFile) =>
      validateImageFile({
        rawFile,
        allowedTypes: BROWSER_LOGO_TYPES,
        maxSize: BROWSER_LOGO_MAX_SIZE,
        maxSizeText: browserLogoLimitText,
        label: proxy.$t('systemSettings.browserLogo')
      })

    const beforeLoginImgUpload = (rawFile) => validateLoginImgFile(rawFile)

    const beforeBrowserLogoUpload = (rawFile) => validateBrowserLogoFile(rawFile)

    const assignFilePreview = (file, fileRef, previewRef) => {
      revokeObjectUrl(previewRef)
      fileRef.value = file?.raw || null
      if (fileRef.value) {
        previewRef.value = URL.createObjectURL(fileRef.value)
      }
    }

    const handleLoginImgChange = (file) => {
      if (!validateLoginImgFile(file?.raw)) {
        clearSelectedLoginImg()
        return
      }
      assignFilePreview(file, selectedLoginImgFile, selectedLoginPreviewUrl)
    }

    const handleBrowserLogoChange = (file) => {
      if (!validateBrowserLogoFile(file?.raw)) {
        clearSelectedBrowserLogo()
        return
      }
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
        text: proxy.$t('systemSettings.loading'),
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
          proxy.$message.error(proxy.$t('systemSettings.loadFailed'))
        }
      } catch (e) {
        proxy.$message.error(`${proxy.$t('systemSettings.loadFailed')}：${e?.message || e}`)
      } finally {
        loading.close()
      }
    }

    const save = async () => {
      if (!formRef.value) return
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) {
        proxy.$message.warning(proxy.$t('systemSettings.fillSystemName'))
        return
      }

      if (selectedLoginImgFile.value && !validateLoginImgFile(selectedLoginImgFile.value)) return
      if (selectedBrowserLogoFile.value && !validateBrowserLogoFile(selectedBrowserLogoFile.value)) return

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
          proxy.$message.success(proxy.$t('language.saveSuccess'))
          clearSelectedLoginImg()
          clearSelectedBrowserLogo()
          await loadSystemInfo()
        } else {
          proxy.$message.error(res?.Msg || res?.msg || res?.message || proxy.$t('systemSettings.saveFailed'))
        }
      } catch (e) {
        const errorData = e?.response?.data
        proxy.$message.error(
          `${proxy.$t('systemSettings.saveFailed')}：${errorData?.Msg || errorData?.msg || errorData?.message || e?.message || e}`
        )
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
      loginImgLimitText,
      browserLogoLimitText,
      loginPreviewUrl,
      browserLogoPreviewUrl,
      loginPreviewStyle,
      themePreviewStyle,
      themePresets: THEME_PRESETS,
      colorGroups,
      getPresetSwatches,
      beforeLoginImgUpload,
      beforeBrowserLogoUpload,
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
  border-top: 1px solid var(--dt-border);
}

.section-title {
  margin: 0 0 18px;
  color: var(--dt-text);
  font-size: 15px;
  font-weight: 700;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.switch-setting,
.appearance-setting {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hint {
  color: var(--dt-text-muted);
  font-size: 12px;
}

.preview {
  margin-top: 12px;
  width: 100%;
}

.preview-title {
  color: var(--dt-text-muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.login-preview-box {
  width: 100%;
  max-width: 900px;
  height: 240px;
  border-radius: 10px;
  border: 1px dashed var(--dt-border-strong);
  background-color: var(--dt-surface-soft);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-empty {
  color: var(--dt-text-muted);
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
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: 8px 8px 0 0;
  box-sizing: border-box;
}

.favicon-dot {
  width: 8px;
  height: 8px;
  background: var(--dt-border-strong);
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
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-bottom-color: var(--dt-surface);
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
  color: var(--dt-text);
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
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
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
  color: var(--dt-text);
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
  border: 2px solid var(--dt-surface);
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
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
}

.custom-color-title {
  margin-bottom: 10px;
  color: var(--dt-text);
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
  color: var(--dt-text);
  font-size: 13px;
  font-weight: 600;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
}

.theme-preview {
  display: flex;
  flex-direction: column;
  height: 190px;
  margin-top: 16px;
  overflow: hidden;
  background: var(--preview-page-bg);
  border: 1px solid var(--preview-border);
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
  background: var(--preview-page-bg);
}

.theme-preview-header {
  height: 20px;
  width: 46%;
  background: var(--preview-surface);
  border: 1px solid var(--preview-border);
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
  background: color-mix(in srgb, var(--preview-text-muted) 34%, var(--preview-surface));
  border-radius: 999px;
}

.theme-preview-lines span:nth-child(2) {
  width: 78%;
}

.theme-preview-lines span:nth-child(3) {
  width: 52%;
}
</style>
