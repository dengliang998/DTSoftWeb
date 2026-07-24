<template>
  <div class="login_container" :style="loginContainerStyle">
    <div class="login_shell">
      <section class="login_brand" aria-label="系统信息">
        <div class="brand_copy">
          <div class="login_brand-title">{{ systemName }}</div>
          <div class="login_brand-subtitle">安全、清晰、高效的管理工作台</div>
        </div>
      </section>

      <section class="login_box" aria-label="账号登录">
        <div class="login_box-header">
          <div>
            <h1>账号登录</h1>
            <p>使用工作台账号继续</p>
          </div>
          <!-- 头像区域 -->
          <div class="avatar_box">
            <img :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
          </div>
        </div>

        <!-- 登录表单区域 -->
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="0px" class="login_form">
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User"></el-input>
          </el-form-item>
          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
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
                placeholder="请输入验证码"
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
                title="点击刷新验证码"
                @click="loadCaptcha"
              >
                <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
                <span v-else>刷新</span>
              </button>
            </div>
          </el-form-item>
          <!-- 按钮 -->
          <el-form-item class="btns">
            <el-button type="primary" class="login-btn" :loading="loggingIn" @click="login">登录</el-button>
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
  getCachedSystemName
} from '@/utils/sysConfig'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loginFormRef = ref(null)
    const loginBgUrl = ref(getCachedLoginImgDataUrl())
    const systemName = ref(getCachedSystemName() || 'DT Program')
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
      username: [{ required: true, message: '请输入登录名称', trigger: 'blur' }],
      password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
      captchaCode: captchaEnabled.value ? [{ required: true, message: '请输入验证码', trigger: 'blur' }] : []
    }))

    const securityNote = computed(() => (captchaEnabled.value ? '加密传输 · 验证码保护' : '加密传输'))

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
          ElMessage.error('验证码加载失败，请刷新后重试')
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
          ElMessage.error('用户名不能为空！')
          return
        } else if (loginForm.password === '') {
          ElMessage.error('密码不能为空！')
          return
        }

        if (captchaEnabled.value && !loginForm.captchaId) {
          ElMessage.error('请先获取验证码')
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
              ElMessage.success(getMessage(response, '登录成功'))
              const token = getLoginToken(response)
              if (!token) {
                ElMessage.error('登录失败：服务端未返回有效令牌')
                if (captchaEnabled.value) loadCaptcha()
                return
              }
              setAuthSession({ token, account: loginForm.username })
              const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
              router.push(redirect || '/home')
            } else {
              ElMessage.error('登录失败：' + getMessage(response, '未知错误'))
              if (captchaEnabled.value) loadCaptcha()
            }
          })
          .catch(function (error) {
            ElMessage.error(getMessage(error.response || error, '登录失败，请稍后重试！'))
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
        .then(() => {
          loginBgUrl.value = getCachedLoginImgDataUrl()
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
  max-width: 560px;
}

.brand_copy {
  width: 100%;
}

.login_brand-title {
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(30px, 4.5vw, 52px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
  word-break: break-word;
}

.login_brand-subtitle {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0;
  text-shadow: 0 1px 12px rgba(15, 23, 42, 0.22);
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

  .brand_copy {
    padding: 0;
  }

  .login_brand-title {
    font-size: 34px;
  }

  .login_brand-subtitle {
    margin-top: 14px;
    font-size: 16px;
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

  .login_brand-title {
    font-size: 30px;
  }

  .login_brand-subtitle {
    font-size: 15px;
  }

  .captcha-row {
    grid-template-columns: 1fr 106px;
    gap: 10px;
  }
}
</style>
