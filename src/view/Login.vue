<template>
  <div class="login_container" :style="loginContainerStyle">
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
    <div class="login_shell">
      <section class="login_box" :aria-label="$t('login.loginAria')">
        <div class="login_box-header">
          <div>
            <h1>{{ $t('login.title') }}</h1>
            <p>{{ $t('login.subtitle') }}</p>
          </div>
          <div class="avatar_box">
            <img :src="avatarUrl" :alt="$t('login.avatarAlt')" @error="onAvatarError" />
          </div>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="0px" class="login_form">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="$t('login.usernamePlaceholder')"
              prefix-icon="User"
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              :placeholder="$t('login.passwordPlaceholder')"
              prefix-icon="Lock"
              show-password
              @keyup.enter="login"
            ></el-input>
          </el-form-item>
          <el-form-item v-if="captchaEnabled" prop="captchaCode">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.captchaCode"
                maxlength="4"
                :placeholder="$t('login.captchaPlaceholder')"
                prefix-icon="Key"
                autocomplete="off"
                @input="formatCaptchaCode"
                @keyup.enter="login"
              ></el-input>
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

        <div class="security_note">{{ securityNote }}</div>
      </section>
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha, getLoginToken, loadLoginEncryptionKey, login as loginApi } from '@/api/auth'
import { getEnabledLanguages } from '@/api/language'
import { getUserAvatarUrl } from '@/api/user'
import { getData, getMessage, isSuccessPayload } from '@/core/response'
import { setAuthSession } from '@/core/session'
import {
  fetchAndCacheSystemInfo,
  getCachedLoginCaptchaEnabled,
  getCachedLoginImgDataUrl,
  getCachedSystemName,
  normalizeBase64Image
} from '@/utils/sysConfig'
import { cacheEnabledLanguages, getCurrentLanguage, i18nState, setLanguage, translate } from '@/i18n'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loginFormRef = ref(null)
    const loginBgUrl = ref(getCachedLoginImgDataUrl())
    const captchaEnabled = ref(getCachedLoginCaptchaEnabled())
    const captchaImage = ref('')
    const captchaLoading = ref(false)
    const loggingIn = ref(false)

    const loginForm = reactive({
      username: '',
      password: '',
      captchaId: '',
      captchaCode: ''
    })

    const defaultAvatarUrl = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'
    const avatarUrl = ref(defaultAvatarUrl)
    let avatarDebounceTimer = null

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
    const getLanguageShortLabel = (language) =>
      String(language?.LanguageCode || '')
        .toLowerCase()
        .startsWith('zh')
        ? '中'
        : 'EN'

    const refreshDefaultSystemName = () => {
      if (!getCachedSystemName()) {
        document.title = translate('login.defaultSystemName')
      }
    }

    const handleLanguageChange = (language) => {
      if (!language || language === currentLanguage.value) return
      setLanguage(language)
      refreshDefaultSystemName()
      loginFormRef.value?.clearValidate?.()
    }

    const loadEnabledLanguages = async () => {
      try {
        const { data: res } = await getEnabledLanguages()
        if (res?.success && Array.isArray(res.data)) {
          cacheEnabledLanguages(res.data)
        }
      } catch {
        // App.vue also attempts to load this; keep the current fallback if the request fails here.
      }
    }

    const onAvatarError = () => {
      avatarUrl.value = defaultAvatarUrl
    }

    const loadUserAvatar = () => {
      const username = loginForm.username.trim()
      if (!username) {
        avatarUrl.value = defaultAvatarUrl
        return
      }

      const avatarApiUrl = getUserAvatarUrl(username, 'account')
      const img = new Image()
      img.onload = () => {
        avatarUrl.value = avatarApiUrl
      }
      img.onerror = onAvatarError
      img.src = avatarApiUrl
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
      loadUserAvatar()
      loadEnabledLanguages()
      loadLoginEncryptionKey().catch(() => {})
      fetchAndCacheSystemInfo()
        .then((res) => {
          loginBgUrl.value = normalizeBase64Image(res?.data?.loginImg) || getCachedLoginImgDataUrl()
          captchaEnabled.value = getCachedLoginCaptchaEnabled()
          const title = getCachedSystemName()
          if (title) {
            document.title = title
          }
          loadCaptcha()
        })
        .catch(() => {
          loadCaptcha()
        })
    })

    watch(
      () => loginForm.username,
      () => {
        if (avatarDebounceTimer) {
          clearTimeout(avatarDebounceTimer)
        }
        avatarDebounceTimer = setTimeout(() => {
          loadUserAvatar()
        }, 300)
      }
    )

    watch(
      () => i18nState.language,
      () => {
        refreshDefaultSystemName()
      }
    )

    onUnmounted(() => {
      if (avatarDebounceTimer) {
        clearTimeout(avatarDebounceTimer)
      }
    })

    return {
      loginFormRef,
      loginForm,
      loginFormRules,
      avatarUrl,
      captchaEnabled,
      captchaImage,
      captchaLoading,
      currentLanguage,
      enabledLanguages,
      loggingIn,
      securityNote,
      getLanguageShortLabel,
      onAvatarError,
      loadCaptcha,
      formatCaptchaCode,
      handleLanguageChange,
      login,
      loginContainerStyle: computed(() => {
        if (!loginBgUrl.value) return {}
        return { backgroundImage: `url('${loginBgUrl.value}')` }
      })
    }
  }
})
</script>

<style lang="less" scoped>
.login_container {
  --login-card-bg: rgba(255, 255, 255, 0.95);
  --login-card-border: rgba(255, 255, 255, 0.78);
  --login-text: #182230;
  --login-muted: #667085;
  --login-input-border: #d7e0ec;
  --login-avatar-bg: #ffffff;
  --login-captcha-bg: #eef5ff;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #101828 url('../assets/imgs/bg-optimized.png') center / cover no-repeat;
}

.login-language {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 1;
  display: flex;
  padding: 2px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.72);
  border-radius: 7px;
}

.login-language-choice {
  width: 32px;
  height: 26px;
  padding: 0;
  color: #334155;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.login-language-choice.is-active {
  color: #ffffff;
  background: var(--dt-primary);
}

.login_shell {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: min(1120px, calc(100% - 96px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 56px 0;
  box-sizing: border-box;
}

.login_box {
  width: 400px;
  padding: 30px 32px 28px;
  color: var(--login-text);
  background: var(--login-card-bg);
  border: 1px solid var(--login-card-border);
  border-radius: 12px;
  box-sizing: border-box;
}

.login_box-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 26px;
}

.login_box h1,
.login_box p {
  margin: 0;
  letter-spacing: 0;
}

.login_box h1 {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
}

.login_box p,
.security_note {
  color: var(--login-muted);
  font-weight: 500;
}

.login_box p {
  margin-top: 10px;
  font-size: 13px;
}

.avatar_box {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  padding: 2px;
  overflow: hidden;
  background: var(--login-avatar-bg);
  border: 1px solid var(--login-input-border);
  border-radius: 50%;
  box-sizing: border-box;
}

.avatar_box img {
  display: block;
  width: 100%;
  height: 100%;
  background: #eef2f7;
  border-radius: 50%;
  object-fit: cover;
}

.login_form {
  width: 100%;
}

.login_form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login_form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 8px !important;
}

.login_form :deep(.el-input__inner) {
  font-weight: 500;
}

.btns {
  margin-bottom: 0 !important;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px !important;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 118px;
  gap: 12px;
}

.captcha-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0;
  overflow: hidden;
  color: var(--login-muted);
  background: var(--login-captcha-bg);
  border: 1px solid var(--login-input-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.captcha-image:disabled {
  cursor: wait;
  opacity: 0.72;
}

.captcha-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.security_note {
  margin-top: 18px;
  font-size: 12px;
  text-align: center;
}

html[data-theme='dark'] .login_container {
  --login-card-bg: rgba(15, 23, 42, 0.82);
  --login-card-border: color-mix(in srgb, var(--dt-text) 14%, transparent);
  --login-text: var(--dt-text);
  --login-muted: var(--dt-text-muted);
  --login-input-border: var(--dt-border);
  --login-avatar-bg: var(--dt-surface);
  --login-captcha-bg: var(--dt-surface-soft);
  background-color: #09111d;
}

html[data-theme='dark'] .login_container::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background: rgba(2, 6, 23, 0.48);
}

@media (max-width: 980px) {
  .login_shell {
    width: min(460px, calc(100% - 48px));
    justify-content: center;
    padding: 42px 0;
  }
}

@media (max-width: 520px) {
  .login-language {
    top: 14px;
    right: 18px;
  }

  .login-language-choice {
    width: 30px;
    height: 24px;
  }

  .login_shell {
    width: min(400px, calc(100% - 36px));
    padding: 34px 0;
  }

  .login_box {
    width: 100%;
    padding: 28px 24px;
  }

  .captcha-row {
    grid-template-columns: 1fr 106px;
    gap: 10px;
  }
}
</style>
