<template>
  <div :class="['login_container', loginThemeClass]" :style="loginContainerStyle">
    <div class="login_toolbar">
      <button
        type="button"
        class="login-theme-toggle"
        :aria-label="currentAppearance === 'dark' ? $t('theme.switchToLight') : $t('theme.switchToDark')"
        :title="currentAppearance === 'dark' ? $t('theme.switchToLight') : $t('theme.switchToDark')"
        @click="toggleAppearance"
      >
        <el-icon class="login-theme-toggle__icon">
          <Sunny v-if="currentAppearance === 'dark'" />
          <Moon v-else />
        </el-icon>
      </button>

      <div
        v-if="enabledLanguages.length > 0"
        class="login-language"
        role="group"
        :aria-label="$t('language.switchLabel')"
      >
        <button
          v-for="item in enabledLanguages"
          :key="item.LanguageCode"
          type="button"
          :class="['login-language-choice', { 'is-active': item.LanguageCode === currentLanguage }]"
          :aria-pressed="item.LanguageCode === currentLanguage"
          :title="item.NativeName || item.LanguageName || item.LanguageCode"
          @click="handleLanguageChange(item.LanguageCode)"
        >
          {{ getLanguageShortLabel(item) }}
        </button>
      </div>
    </div>

    <main class="login_shell">
      <section class="login_panel" :aria-label="$t('login.loginAria')">
        <div class="login_panel_header">
          <div class="panel_logo">
            <img :src="brandLogoUrl" alt="" />
          </div>
          <div class="panel_header_text">
            <span>{{ $t('login.panelKicker') }}</span>
            <strong>{{ systemTitle }}</strong>
            <p>{{ $t('login.panelSubtitle') }}</p>
          </div>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="0px" class="login_form">
          <el-form-item prop="username">
            <div class="field_block">
              <label class="field_label">{{ $t('login.usernameLabel') }}</label>
              <el-input
                v-model="loginForm.username"
                :placeholder="$t('login.usernamePlaceholder')"
                prefix-icon="User"
              />
            </div>
          </el-form-item>
          <el-form-item prop="password">
            <div class="field_block">
              <label class="field_label">{{ $t('login.passwordLabel') }}</label>
              <el-input
                v-model="loginForm.password"
                type="password"
                :placeholder="$t('login.passwordPlaceholder')"
                prefix-icon="Lock"
                show-password
                @keyup.enter="login"
              />
            </div>
          </el-form-item>
          <el-form-item v-if="captchaEnabled" prop="captchaCode">
            <div class="captcha-row">
              <div class="field_block captcha-input">
                <label class="field_label">{{ $t('login.captchaLabel') }}</label>
                <el-input
                  v-model="loginForm.captchaCode"
                  maxlength="4"
                  :placeholder="$t('login.captchaPlaceholder')"
                  prefix-icon="CircleCheck"
                  autocomplete="off"
                  @input="formatCaptchaCode"
                  @keyup.enter="login"
                />
              </div>
              <button
                type="button"
                class="captcha-image"
                :disabled="captchaLoading"
                :title="$t('login.captchaRefreshTitle')"
                @click="loadCaptcha"
              >
                <img v-if="captchaImage" :src="captchaImage" :alt="$t('login.captchaAlt')" />
                <span v-else>{{ $t('login.refreshCaptcha') }}</span>
              </button>
            </div>
          </el-form-item>
          <el-form-item class="btns">
            <el-button type="primary" class="login-btn" :loading="loggingIn" @click="login">
              {{ $t('login.submit') }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="panel_footer">
          <span class="security_note">{{ securityNote }}</span>
          <span>{{ $t('login.panelFooter') }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { getCaptcha, getLoginToken, loadLoginEncryptionKey, login as loginApi } from '@/api/auth'
import { getEnabledLanguages } from '@/api/language'
import { getData, getMessage, isSuccessPayload } from '@/core/response'
import { setAuthSession } from '@/core/session'
import defaultHomeLogo from '@/assets/imgs/homelogo.png'
import {
  fetchAndCacheSystemInfo,
  getCachedAppearance,
  getCachedLoginCaptchaEnabled,
  getCachedLoginImgDataUrl,
  getCachedSystemName,
  normalizeBase64Image,
  toggleUserAppearance
} from '@/utils/sysConfig'
import { cacheEnabledLanguages, getCurrentLanguage, i18nState, setLanguage, translate } from '@/i18n'

export default defineComponent({
  name: 'Login',
  components: {
    Moon,
    Sunny
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loginFormRef = ref(null)
    const loginBgUrl = ref(getCachedLoginImgDataUrl() || '')
    const captchaEnabled = ref(getCachedLoginCaptchaEnabled())
    const captchaImage = ref('')
    const captchaLoading = ref(false)
    const loggingIn = ref(false)
    const systemTitle = ref(getCachedSystemName() || translate('login.defaultSystemName'))
    const currentAppearance = ref(getCachedAppearance())

    const loginForm = reactive({
      username: '',
      password: '',
      captchaId: '',
      captchaCode: ''
    })

    const loginFormRules = computed(() => ({
      username: [{ required: true, message: translate('login.usernameRequired'), trigger: 'blur' }],
      password: [{ required: true, message: translate('login.passwordRequired'), trigger: 'blur' }],
      captchaCode: captchaEnabled.value
        ? [{ required: true, message: translate('login.captchaRequired'), trigger: 'blur' }]
        : []
    }))

    const securityNote = computed(() =>
      captchaEnabled.value ? translate('login.securityWithCaptcha') : translate('login.security')
    )
    const enabledLanguages = computed(() => i18nState.enabledLanguages)
    const currentLanguage = computed(() => getCurrentLanguage())
    const brandLogoUrl = defaultHomeLogo
    const loginThemeClass = computed(() => (currentAppearance.value === 'dark' ? 'is-dark' : 'is-light'))

    const refreshSystemTitle = () => {
      systemTitle.value = getCachedSystemName() || translate('login.defaultSystemName')
      document.title = systemTitle.value
    }

    const getLanguageShortLabel = (language) =>
      String(language?.LanguageCode || '')
        .toLowerCase()
        .startsWith('zh')
        ? '中'
        : 'EN'

    const handleLanguageChange = (language) => {
      if (!language || language === currentLanguage.value) return
      setLanguage(language)
      refreshSystemTitle()
      loginFormRef.value?.clearValidate?.()
    }

    const syncAppearance = (appearance) => {
      currentAppearance.value = appearance === 'dark' ? 'dark' : 'light'
    }

    const handleThemeApplied = (event) => {
      syncAppearance(event?.detail?.appearance || getCachedAppearance())
    }

    const toggleAppearance = () => {
      syncAppearance(toggleUserAppearance({ animate: true }))
    }

    const loadEnabledLanguages = async () => {
      try {
        const { data: res } = await getEnabledLanguages()
        if (res?.success && Array.isArray(res.data)) {
          cacheEnabledLanguages(res.data)
        }
      } catch {
        // Ignore and keep fallback language pack.
      }
    }

    const loadCaptcha = () => {
      if (!captchaEnabled.value) {
        loginForm.captchaId = ''
        loginForm.captchaCode = ''
        captchaImage.value = ''
        return Promise.resolve()
      }

      if (captchaLoading.value) return Promise.resolve()

      captchaLoading.value = true
      return getCaptcha()
        .then((response) => {
          const captcha = getData(response)
          loginForm.captchaId = captcha.CaptchaId || captcha.captchaId || ''
          loginForm.captchaCode = ''
          captchaImage.value = captcha.ImageDataUrl || captcha.imageDataUrl || ''
        })
        .catch(() => {
          loginForm.captchaId = ''
          captchaImage.value = ''
          ElMessage.error(translate('login.captchaLoadFailed'))
        })
        .finally(() => {
          captchaLoading.value = false
        })
    }

    const formatCaptchaCode = (value) => {
      loginForm.captchaCode = String(value || '').toUpperCase()
    }

    const loginMessageKeyMap = {
      登录成功: 'login.success',
      用户名或密码错误: 'login.errors.invalidCredentials',
      用户名和密码不能为空: 'login.errors.credentialsRequired',
      '登录参数解密失败，请刷新页面后重试': 'login.errors.decryptionFailed',
      当前在线用户数已达到许可证允许的上限: 'login.errors.concurrentLimitExceeded',
      验证码不能为空: 'login.errors.captchaRequired',
      '验证码已过期，请刷新后重试': 'login.errors.captchaExpired',
      验证码错误: 'login.errors.captchaInvalid'
    }

    const getLocalizedLoginMessage = (responseOrError, fallback) => {
      const message = getMessage(responseOrError, fallback)
      const key = loginMessageKeyMap[message]
      return key ? translate(key) : message || fallback
    }

    const login = () => {
      if (!loginFormRef.value || loggingIn.value) return

      loginFormRef.value.validate((valid) => {
        if (!valid) return

        if (captchaEnabled.value && !loginForm.captchaId) {
          ElMessage.error(translate('login.captchaMissing'))
          loadCaptcha()
          return
        }

        loggingIn.value = true
        loginApi({
          username: loginForm.username,
          password: loginForm.password,
          captchaId: captchaEnabled.value ? loginForm.captchaId : '',
          captchaCode: captchaEnabled.value ? loginForm.captchaCode : ''
        })
          .then(function (response) {
            if (isSuccessPayload(response)) {
              ElMessage.success(getLocalizedLoginMessage(response, translate('login.success')))
              const token = getLoginToken(response)
              if (!token) {
                ElMessage.error(translate('login.missingToken'))
                if (captchaEnabled.value) loadCaptcha()
                return
              }
              setAuthSession({ token, account: loginForm.username })
              const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
              router.push(redirect || '/home')
            } else {
              ElMessage.error(
                `${translate('login.failedPrefix')}：${getLocalizedLoginMessage(response, translate('welcome.unknownError'))}`
              )
              if (captchaEnabled.value) loadCaptcha()
            }
          })
          .catch(function (error) {
            ElMessage.error(getLocalizedLoginMessage(error.response || error, translate('login.failedRetry')))
            if (captchaEnabled.value) loadCaptcha()
          })
          .finally(function () {
            loggingIn.value = false
          })
      })
    }

    onMounted(() => {
      syncAppearance(getCachedAppearance())
      window.addEventListener('dt-theme-applied', handleThemeApplied)
      refreshSystemTitle()
      loadEnabledLanguages()
      loadLoginEncryptionKey().catch(() => {})
      fetchAndCacheSystemInfo()
        .then((res) => {
          loginBgUrl.value = normalizeBase64Image(res?.data?.loginImg) || ''
          captchaEnabled.value = getCachedLoginCaptchaEnabled()
          refreshSystemTitle()
          loadCaptcha()
        })
        .catch(() => {
          loadCaptcha()
        })
    })

    onBeforeUnmount(() => {
      window.removeEventListener('dt-theme-applied', handleThemeApplied)
    })

    watch(
      () => i18nState.language,
      () => {
        refreshSystemTitle()
      }
    )

    return {
      loginFormRef,
      loginForm,
      loginFormRules,
      captchaEnabled,
      captchaImage,
      captchaLoading,
      currentLanguage,
      enabledLanguages,
      currentAppearance,
      loginThemeClass,
      loggingIn,
      securityNote,
      brandLogoUrl,
      systemTitle,
      getLanguageShortLabel,
      handleLanguageChange,
      toggleAppearance,
      loadCaptcha,
      formatCaptchaCode,
      login,
      loginContainerStyle: computed(() => (loginBgUrl.value ? { backgroundImage: `url('${loginBgUrl.value}')` } : {}))
    }
  }
})
</script>

<style lang="less" scoped>
.login_container {
  --login-primary: #2a4fd0;
  --login-primary-hover: #2445b5;
  --login-primary-soft: rgba(42, 79, 208, 0.16);
  --login-page-bg: #0f0f0f;
  --login-surface: rgba(24, 24, 24, 0.78);
  --login-surface-strong: rgba(34, 34, 34, 0.92);
  --login-surface-soft: rgba(24, 24, 24, 0.56);
  --login-border: rgba(64, 64, 64, 0.92);
  --login-border-soft: rgba(34, 34, 34, 0.92);
  --login-text: #ffffff;
  --login-heading: #ffffff;
  --login-muted: #a8a8a8;
  --login-subtle: #888888;
  --login-input-bg: rgba(0, 0, 0, 0.42);
  --login-input-border: rgba(64, 64, 64, 0.96);
  --login-input-text: #ffffff;
  --login-input-placeholder: #888888;
  --login-control-bg: rgba(24, 24, 24, 0.78);
  --login-control-border: rgba(64, 64, 64, 0.94);
  --login-control-text: #ffffff;
  --login-terminal-bg: rgba(0, 0, 0, 0.7);
  --login-terminal-border: rgba(64, 64, 64, 0.92);
  --login-terminal-highlight: rgba(42, 79, 208, 0.16);
  --login-terminal-glow: rgba(42, 79, 208, 0.2);
  --login-terminal-pane: rgba(34, 34, 34, 0.82);
  --login-terminal-pane-strong: rgba(42, 42, 42, 0.94);
  --login-terminal-text: #a8a8a8;
  --login-terminal-title: #ffffff;
  --login-panel-shadow: 0 24px 70px rgba(0, 0, 0, 0.34);
  --login-stage-shadow: 0 18px 48px rgba(0, 0, 0, 0.26);
  --login-captcha-bg: rgba(255, 255, 255, 0.94);
  --login-captcha-text: #182230;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--login-text);
  background:
    linear-gradient(180deg, rgba(15, 15, 15, 0.02) 0%, rgba(15, 15, 15, 0.28) 100%),
    var(--login-page-bg) center / cover no-repeat;
  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    background 0.3s ease;
}

.login_container.is-light {
  --login-page-bg: #e9eef5;
  --login-primary: #315bd4;
  --login-primary-hover: #274ab0;
  --login-primary-soft: color-mix(in srgb, var(--login-primary) 12%, #ffffff);
  --login-surface: rgba(248, 251, 255, 0.9);
  --login-surface-strong: rgba(255, 255, 255, 0.96);
  --login-surface-soft: rgba(248, 251, 255, 0.72);
  --login-border: rgba(120, 146, 186, 0.28);
  --login-border-soft: rgba(120, 146, 186, 0.2);
  --login-text: #142235;
  --login-heading: #0d1724;
  --login-muted: #5f7085;
  --login-subtle: #61748b;
  --login-input-bg: rgba(255, 255, 255, 0.94);
  --login-input-border: rgba(120, 146, 186, 0.24);
  --login-input-text: #122133;
  --login-input-placeholder: #6f8195;
  --login-control-bg: rgba(255, 255, 255, 0.8);
  --login-control-border: rgba(120, 146, 186, 0.2);
  --login-control-text: #142235;
  --login-terminal-bg: rgba(255, 255, 255, 0.76);
  --login-terminal-border: rgba(120, 146, 186, 0.24);
  --login-terminal-highlight: rgba(49, 91, 212, 0.1);
  --login-terminal-glow: rgba(49, 91, 212, 0.12);
  --login-terminal-pane: rgba(255, 255, 255, 0.92);
  --login-terminal-pane-strong: rgba(255, 255, 255, 0.98);
  --login-terminal-text: #5f7085;
  --login-terminal-title: #102030;
  --login-panel-shadow: 0 22px 58px rgba(63, 89, 122, 0.16);
  --login-stage-shadow: 0 20px 44px rgba(63, 89, 122, 0.12);
  --login-captcha-bg: rgba(255, 255, 255, 0.98);
  --login-captcha-text: #122133;
}

.login_container.is-dark {
  color-scheme: dark;
}

.login_container::before,
.login_container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login_container::before {
  background:
    radial-gradient(circle at 19% 18%, rgba(42, 79, 208, 0.1), transparent 28%),
    radial-gradient(circle at 80% 20%, rgba(42, 79, 208, 0.07), transparent 26%),
    linear-gradient(120deg, rgba(15, 15, 15, 0.18) 0%, rgba(15, 15, 15, 0.03) 52%, rgba(15, 15, 15, 0.2) 100%);
  opacity: 1;
}

.login_container.is-light::before {
  background:
    radial-gradient(circle at 18% 18%, rgba(49, 91, 212, 0.08), transparent 30%),
    radial-gradient(circle at 82% 18%, rgba(49, 91, 212, 0.05), transparent 28%),
    linear-gradient(120deg, rgba(232, 238, 245, 0.08) 0%, rgba(232, 238, 245, 0.02) 52%, rgba(232, 238, 245, 0.12) 100%);
}

.login_container::after {
  background:
    linear-gradient(90deg, rgba(64, 64, 64, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(64, 64, 64, 0.08) 1px, transparent 1px);
  background-size: 72px 72px;
  opacity: 0.08;
  animation: loginGridDrift 24s linear infinite;
}

.login_toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--login-control-text);
  cursor: pointer;
  background: var(--login-control-bg);
  border: 1px solid var(--login-control-border);
  border-radius: 8px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.login-theme-toggle:hover,
.login-theme-toggle:focus-visible {
  color: #ffffff;
  border-color: color-mix(in srgb, var(--login-primary) 62%, transparent);
  outline: none;
  transform: translateY(-1px);
}

.login-theme-toggle__icon {
  font-size: 16px;
}

.login-language {
  display: flex;
  padding: 4px;
  background: var(--login-control-bg);
  border: 1px solid var(--login-control-border);
  border-radius: 8px;
  backdrop-filter: blur(16px);
}

.login-language-choice {
  width: 34px;
  height: 28px;
  padding: 0;
  color: var(--login-control-text);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.login-language-choice.is-active {
  color: var(--login-heading);
  background: color-mix(in srgb, var(--login-primary) 8%, var(--login-control-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--login-primary) 18%, transparent);
}

.login_container.is-dark .login-language-choice.is-active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--login-primary) 0%, var(--login-primary-hover) 100%);
  box-shadow: 0 10px 20px color-mix(in srgb, var(--login-primary) 28%, transparent);
}

.login_shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 420px);
  gap: 0;
  justify-content: center;
  align-items: center;
  align-content: center;
  width: min(420px, calc(100% - 40px));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
}

.panel_logo {
  overflow: hidden;
  border: 1px solid var(--login-border);
  border-radius: 14px;
  background: var(--login-surface);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
}

.login_container.is-light .panel_logo {
  background: linear-gradient(135deg, #162238 0%, #0e1628 100%);
  border-color: rgba(24, 38, 64, 0.22);
  box-shadow:
    0 14px 30px rgba(47, 66, 97, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.panel_logo {
  width: 48px;
  height: 48px;
  flex: none;
}

.panel_logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login_panel {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(100%, 420px);
  aspect-ratio: 1 / 1;
  justify-self: center;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--login-border) 88%, transparent);
  border-radius: 16px;
  background: var(--login-surface-strong);
  box-shadow: 0 22px 58px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
  transition:
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.3s ease;
}

.login_panel:hover {
  transform: translateY(-1px);
}

.login_form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.login_panel::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: 16px;
  background: linear-gradient(
    140deg,
    color-mix(in srgb, var(--login-primary) 48%, transparent),
    color-mix(in srgb, var(--login-primary) 12%, transparent),
    color-mix(in srgb, var(--login-heading) 10%, transparent)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

.login_panel_header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.panel_header_text {
  min-width: 0;
}

.panel_header_text span {
  display: inline-flex;
  padding: 5px 10px;
  color: #dfe7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 1px solid color-mix(in srgb, var(--login-primary) 18%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--login-primary) 7%, transparent);
}

.login_container.is-light .panel_header_text span {
  color: var(--login-heading);
}

.panel_header_text strong {
  display: block;
  margin-top: 10px;
  color: var(--login-heading);
  font-size: 21px;
  font-weight: 800;
  line-height: 1.2;
}

.panel_header_text p {
  margin: 8px 0 0;
  color: var(--login-subtle);
  font-size: 13px;
  line-height: 1.6;
}

.login_form {
  width: 100%;
}

.login_form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.login_form :deep(.el-form-item__content) {
  width: 100%;
}

.field_block {
  display: grid;
  gap: 8px;
  width: 100%;
}

.field_label {
  color: var(--login-heading);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.login_form :deep(.el-input__wrapper) {
  height: 44px;
  min-height: 44px;
  background: var(--login-input-bg) !important;
  border: 1px solid var(--login-input-border);
  border-radius: 8px !important;
  box-shadow: none !important;
  transition:
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.login_container.is-light .login_form :deep(.el-input__wrapper) {
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.login_form :deep(.el-input__wrapper.is-focus) {
  border-color: color-mix(in srgb, var(--login-primary) 72%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--login-primary) 12%, transparent) !important;
}

.login_form :deep(.el-input__inner) {
  color: var(--login-input-text);
  font-weight: 500;
}

.login_form :deep(.el-input__inner::placeholder) {
  color: var(--login-input-placeholder);
}

.login_form :deep(.el-input__prefix-inner) {
  color: color-mix(in srgb, var(--login-primary) 85%, var(--login-heading));
}

.btns {
  margin-bottom: 0 !important;
}

.login-btn {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 8px !important;
  background: linear-gradient(135deg, var(--login-primary) 0%, var(--login-primary-hover) 100%) !important;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--login-primary) 14%, transparent) !important;
  font-size: 15px;
  font-weight: 750;
  letter-spacing: 0;
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.2s ease;
}

.login-btn:hover {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--login-primary) 86%, white) 0%,
    color-mix(in srgb, var(--login-primary-hover) 86%, white) 100%
  ) !important;
}

.login-btn:active {
  transform: translateY(1px);
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 134px;
  grid-template-rows: auto 44px;
  gap: 12px;
  width: 100%;
  align-items: stretch;
}

.captcha-input,
.captcha-input :deep(.el-input) {
  width: 100%;
}

.captcha-input {
  grid-column: 1;
  grid-row: 1 / span 2;
}

.captcha-image {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 134px;
  height: 44px;
  min-height: 44px;
  margin-top: -2px;
  padding: 0;
  overflow: hidden;
  color: var(--login-captcha-text);
  cursor: pointer;
  background: var(--login-captcha-bg);
  border: 1px solid color-mix(in srgb, var(--login-primary) 24%, transparent);
  border-radius: 8px;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
}

.captcha-image:hover {
  border-color: color-mix(in srgb, var(--login-primary) 54%, transparent);
  transform: translateY(-1px);
}

.login_container.is-light .captcha-image {
  background: rgba(255, 255, 255, 0.98);
}

.captcha-image img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
  object-position: center;
}

.panel_footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  color: var(--login-muted);
  font-size: 12px;
  line-height: 1.5;
}

.security_note {
  color: color-mix(in srgb, var(--login-primary) 88%, var(--login-heading));
}

@keyframes loginGridDrift {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-72px, -72px, 0);
  }
}

@media (max-width: 1080px) {
  .login_shell {
    width: min(420px, calc(100% - 32px));
    padding: 0;
  }
}

@media (max-width: 640px) {
  .login_panel {
    width: 100%;
    aspect-ratio: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login_container::after {
    animation: none;
  }

  .login-theme-toggle,
  .login-language-choice,
  .login_panel,
  .terminal_pane,
  .captcha-image,
  .login-btn {
    transition: none;
  }
}
</style>
