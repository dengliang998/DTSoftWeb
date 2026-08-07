<template>
  <div class="login_container" :style="loginContainerStyle">
    <div class="login_shell">
      <section class="login_brand" :aria-label="$t('login.systemAria')">
        <div class="brand_panel">
          <div class="brand_copy">
            <div class="login_brand-title">{{ systemName }}</div>
          </div>
        </div>
      </section>

      <section class="login_box" :aria-label="$t('login.loginAria')">
        <div class="login_box-header">
          <div>
            <h1>{{ $t('login.title') }}</h1>
            <p>{{ $t('login.subtitle') }}</p>
          </div>
          <!-- 头像区域 -->
          <div class="avatar_box">
            <img :src="avatarUrl" :alt="$t('login.avatarAlt')" @error="onAvatarError" />
          </div>
        </div>

        <!-- 登录表单区域 -->
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="0px" class="login_form">
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="$t('login.usernamePlaceholder')"
              prefix-icon="User"
            ></el-input>
          </el-form-item>
          <!-- 密码 -->
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
          <!-- 验证码 -->
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
                :class="{ 'is-loading': captchaLoading }"
                :disabled="captchaLoading"
                :title="$t('login.captchaRefreshTitle')"
                @click="loadCaptcha"
              >
                <img v-if="captchaImage" :src="captchaImage" :alt="$t('login.captchaAlt')" />
                <span v-else>{{ $t('login.refreshCaptcha') }}</span>
              </button>
            </div>
          </el-form-item>
          <!-- 按钮 -->
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
import { translate } from '@/i18n'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loginFormRef = ref(null)
    const loginBgUrl = ref(getCachedLoginImgDataUrl())
    const systemName = ref(getCachedSystemName() || translate('login.defaultSystemName'))
    const captchaEnabled = ref(getCachedLoginCaptchaEnabled())
    const captchaImage = ref('')
    const captchaLoading = ref(false)
    const loggingIn = ref(false)

    // 这是登录表单的数据绑定对象
    const loginForm = reactive({
      username: '',
      password: '',
      captchaId: '',
      captchaCode: ''
    })

    // 默认头像URL
    const defaultAvatarUrl = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

    // 头像URL
    const avatarUrl = ref(defaultAvatarUrl)
    let avatarDebounceTimer = null

    // 这是表单的验证规则
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

    // 当头像加载失败时，使用默认头像
    const onAvatarError = () => {
      avatarUrl.value = defaultAvatarUrl
    }

    // 加载用户头像
    const loadUserAvatar = () => {
      if (loginForm.username) {
        const avatarApiUrl = getUserAvatarUrl(loginForm.username, 'account')

        // 创建一个新的Image对象来检测图像是否可加载
        const img = new Image()
        img.onload = () => {
          // 如果图像加载成功，则更新头像URL
          avatarUrl.value = avatarApiUrl
        }
        img.onerror = () => {
          // 如果图像加载失败，则使用默认头像
          avatarUrl.value = defaultAvatarUrl
        }
        img.src = avatarApiUrl
      } else {
        // 如果没有用户名，则使用默认头像
        avatarUrl.value = defaultAvatarUrl
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

    // 登录处理
    const login = () => {
      // 防止重复提交
      if (!loginFormRef.value || loggingIn.value) return

      loginFormRef.value.validate((valid) => {
        if (!valid) return

        if (loginForm.username === '') {
          ElMessage.error(translate('login.usernameEmpty'))
          return
        } else if (loginForm.password === '') {
          ElMessage.error(translate('login.passwordEmpty'))
          return
        }

        if (captchaEnabled.value && !loginForm.captchaId) {
          ElMessage.error(translate('login.captchaMissing'))
          loadCaptcha()
          return
        }

        //请求认证中心获取 token 完成登录
        loggingIn.value = true
        loginApi({
          username: loginForm.username,
          password: loginForm.password,
          captchaId: captchaEnabled.value ? loginForm.captchaId : '',
          captchaCode: captchaEnabled.value ? loginForm.captchaCode : ''
        })
          .then(function (response) {
            if (isSuccessPayload(response)) {
              ElMessage.success(getMessage(response, translate('login.success')))
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
                `${translate('login.failedPrefix')}：${getMessage(response, translate('welcome.unknownError'))}`
              )
              if (captchaEnabled.value) loadCaptcha()
            }
          })
          .catch(function (error) {
            ElMessage.error(getMessage(error.response || error, translate('login.failedRetry')))
            if (captchaEnabled.value) loadCaptcha()
          })
          .finally(function () {
            loggingIn.value = false
          })
      })
    }

    // 组件挂载时加载头像
    onMounted(() => {
      loadUserAvatar()
      loadLoginEncryptionKey().catch(() => {})
      // 加载系统配置（系统名称、登录背景图、登录验证码开关）
      fetchAndCacheSystemInfo()
        .then((res) => {
          loginBgUrl.value = normalizeBase64Image(res?.data?.loginImg) || getCachedLoginImgDataUrl()
          captchaEnabled.value = getCachedLoginCaptchaEnabled()
          const title = getCachedSystemName()
          if (title) {
            systemName.value = title
            document.title = title
          }
          loadCaptcha()
        })
        .catch(() => {
          loadCaptcha()
        })
    })

    // 监听用户名变化，动态加载头像
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
      loggingIn,
      securityNote,
      systemName,
      onAvatarError,
      loadCaptcha,
      formatCaptchaCode,
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
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-image: url('../assets/imgs/bg-optimized.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #101828;
}

.login_container::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(
      90deg,
      rgba(8, 20, 36, 0.52) 0%,
      rgba(8, 20, 36, 0.34) 28%,
      rgba(8, 20, 36, 0.12) 56%,
      rgba(8, 20, 36, 0.02) 100%
    ),
    linear-gradient(180deg, rgba(8, 20, 36, 0.08) 0%, rgba(8, 20, 36, 0.2) 100%);
  content: '';
}

.login_shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) 400px;
  gap: 7vw;
  align-items: center;
  width: min(1120px, calc(100% - 96px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 56px 0;
  box-sizing: border-box;
}

.login_brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  max-width: 640px;
  min-height: 100%;
}

.brand_panel {
  position: relative;
  width: min(100%, 620px);
  padding: 0 0 0 34px;
  color: #f8fafc;
  box-sizing: border-box;
}

.brand_panel::before {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    color-mix(in srgb, var(--dt-primary-light) 72%, transparent) 58%,
    transparent 100%
  );
  border-radius: 999px;
  content: '';
  pointer-events: none;
}

.brand_copy {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.login_brand-title {
  position: relative;
  color: rgba(255, 255, 255, 0.98);
  font-size: clamp(44px, 5.3vw, 72px);
  font-weight: 850;
  line-height: 1.08;
  letter-spacing: 0;
  word-break: break-word;
  text-shadow:
    0 1px 2px rgba(2, 6, 23, 0.88),
    0 12px 34px rgba(2, 6, 23, 0.58);
}

.login_box {
  width: 400px;
  padding: 30px 32px 28px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 12px;
  box-shadow: 0 28px 90px rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(22px);
  box-sizing: border-box;
}

.login_box-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 26px;
}

.login_box h1 {
  margin: 0;
  color: #182230;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0;
}

.login_box h1::after {
  content: '';
  display: block;
  width: 44px;
  height: 4px;
  margin-top: 8px;
  background: linear-gradient(90deg, var(--dt-primary) 0%, var(--dt-primary-light) 100%);
  border-radius: 999px;
}

.login_box p {
  margin: 10px 0 0;
  color: #667085;
  font-size: 13px;
  font-weight: 500;
}

.avatar_box {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  padding: 2px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(201, 213, 228, 0.9);
  border-radius: 50%;
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.12);
  box-sizing: border-box;
}

.avatar_box img {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #eef2f7;
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
  background: #f8fafc;
  border-radius: 8px !important;
  box-shadow: 0 0 0 1px #d7e0ec inset !important;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.login_form :deep(.el-input__wrapper:hover) {
  background: #ffffff;
}

.login_form :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  box-shadow:
    0 0 0 1px var(--dt-primary) inset,
    0 0 0 4px color-mix(in srgb, var(--dt-primary) 12%, transparent) !important;
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
  box-shadow: 0 10px 22px color-mix(in srgb, var(--dt-primary) 24%, transparent);
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 118px;
  gap: 12px;
  width: 100%;
}

.captcha-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0;
  overflow: hidden;
  color: #475467;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  background: #eef5ff;
  border: 1px solid #d7e0ec;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.captcha-image:hover,
.captcha-image:focus-visible {
  background: #ffffff;
  border-color: var(--dt-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dt-primary) 12%, transparent);
  outline: none;
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
  color: #667085;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

@media (max-width: 980px) {
  .login_container::before {
    background:
      linear-gradient(180deg, rgba(8, 20, 36, 0.48) 0%, rgba(8, 20, 36, 0.22) 42%, rgba(8, 20, 36, 0.34) 100%),
      rgba(8, 20, 36, 0.08);
  }

  .login_shell {
    grid-template-columns: 1fr;
    width: min(460px, calc(100% - 48px));
    gap: 28px;
    justify-items: center;
    padding: 42px 0;
  }

  .login_brand {
    align-items: center;
    text-align: center;
  }

  .brand_panel {
    min-height: auto;
    padding: 0;
  }

  .brand_copy {
    margin-top: 0;
  }

  .brand_panel::before {
    display: none;
  }

  .login_brand-title {
    font-size: 34px;
  }
}

@media (max-width: 520px) {
  .login_shell {
    width: min(400px, calc(100% - 36px));
    padding: 34px 0;
  }

  .login_box {
    width: 100%;
    padding: 28px 24px 28px;
  }

  .brand_panel {
    padding: 0;
  }

  .brand_copy {
    margin-top: 0;
  }

  .login_brand-title {
    font-size: 30px;
  }

  .captcha-row {
    grid-template-columns: 1fr 106px;
    gap: 10px;
  }
}

html[data-theme='dark'] .login_container {
  background-color: #09111d;
}

html[data-theme='dark'] .login_brand-title {
  color: rgba(241, 245, 249, 0.96);
}

html[data-theme='dark'] .login_box {
  background: rgba(15, 23, 42, 0.82);
  border-color: color-mix(in srgb, var(--dt-text) 14%, transparent);
  box-shadow: 0 28px 90px rgba(2, 6, 23, 0.5);
}

html[data-theme='dark'] .login_box h1 {
  color: var(--dt-text);
}

html[data-theme='dark'] .login_box p,
html[data-theme='dark'] .security_note {
  color: var(--dt-text-muted);
}

html[data-theme='dark'] .avatar_box {
  background: var(--dt-surface);
  border-color: var(--dt-border);
  box-shadow: 0 8px 18px rgba(2, 6, 23, 0.28);
}

html[data-theme='dark'] .avatar_box img {
  background-color: var(--dt-surface-soft);
}

html[data-theme='dark'] .login_form :deep(.el-input__wrapper) {
  background: color-mix(in srgb, var(--dt-surface-soft) 88%, #0f172a 12%);
  box-shadow: 0 0 0 1px var(--dt-border) inset !important;
}

html[data-theme='dark'] .login_form :deep(.el-input__wrapper:hover),
html[data-theme='dark'] .login_form :deep(.el-input__wrapper.is-focus) {
  background: var(--dt-surface);
}

html[data-theme='dark'] .login_form :deep(.el-input__inner),
html[data-theme='dark'] .login_form :deep(.el-input__prefix-inner),
html[data-theme='dark'] .login_form :deep(.el-input__suffix-inner) {
  color: var(--dt-text);
}

html[data-theme='dark'] .login_form :deep(.el-input__inner::placeholder) {
  color: var(--dt-text-muted);
}

html[data-theme='dark'] .captcha-image {
  color: var(--dt-text-muted);
  background: var(--dt-surface-soft);
  border-color: var(--dt-border);
}

html[data-theme='dark'] .captcha-image:hover,
html[data-theme='dark'] .captcha-image:focus-visible {
  background: var(--dt-surface);
  border-color: var(--dt-primary);
}
</style>
