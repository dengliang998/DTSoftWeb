<template>
  <div class="login_container" :style="loginContainerStyle">
    <div class="login_brand">
      <div class="login_brand-title">{{ systemName }}</div>
      <div class="login_brand-subtitle">安全、清晰、高效的管理工作台</div>
    </div>
    <div class="login_box">
      <!-- 头像区域 -->
      <div class="avatar_box">
        <img :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
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
        <!-- 按钮 -->
        <el-form-item class="btns">
          <el-button type="primary" class="login-btn" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLoginToken, login as loginApi } from '@/api/auth'
import { getUserAvatarUrl } from '@/api/user'
import { getMessage, isSuccessPayload } from '@/core/response'
import { setAuthSession } from '@/core/session'
import { fetchAndCacheSystemInfo, getCachedLoginImgDataUrl, getCachedSystemName } from '@/utils/sysConfig'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loginFormRef = ref(null)
    const loginBgUrl = ref(getCachedLoginImgDataUrl())
    const systemName = ref(getCachedSystemName() || 'DT Program')

    // 这是登录表单的数据绑定对象
    const loginForm = reactive({
      username: '',
      password: ''
    })

    // 默认头像URL
    const defaultAvatarUrl = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png'

    // 头像URL
    const avatarUrl = ref(defaultAvatarUrl)
    let avatarDebounceTimer = null

    // 这是表单的验证规则
    const loginFormRules = {
      username: [{ required: true, message: '请输入登录名称', trigger: 'blur' }],
      password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }]
    }

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

    // 登录处理
    const login = () => {
      // 防止重复提交
      if (!loginFormRef.value) return

      loginFormRef.value.validate((valid) => {
        if (!valid) return

        if (loginForm.username === '') {
          ElMessage.error('用户名不能为空！')
          return
        } else if (loginForm.password === '') {
          ElMessage.error('密码不能为空！')
          return
        }

        //请求认证中心获取 token 完成登录
        loginApi({
          username: loginForm.username,
          password: loginForm.password
        })
          .then(function (response) {
            if (isSuccessPayload(response)) {
              ElMessage.success(getMessage(response, '登录成功'))
              const token = getLoginToken(response)
              if (!token) {
                ElMessage.error('登录失败：服务端未返回有效令牌')
                return
              }
              setAuthSession({ token, account: loginForm.username })
              const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
              router.push(redirect || '/home')
            } else {
              ElMessage.error('登录失败：' + getMessage(response, '未知错误'))
            }
          })
          .catch(function (error) {
            ElMessage.error(getMessage(error.response, '登录失败，请稍后重试！'))
          })
      })
    }

    // 组件挂载时加载头像
    onMounted(() => {
      loadUserAvatar()
      // 加载系统配置（系统名称、登录背景图）
      fetchAndCacheSystemInfo()
        .then(() => {
          loginBgUrl.value = getCachedLoginImgDataUrl()
          const title = getCachedSystemName()
          if (title) {
            systemName.value = title
            document.title = title
          }
        })
        .catch(() => {})
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
      systemName,
      onAvatarError,
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
  height: 100%;
  background-image: url('../assets/imgs/bg-optimized.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login_box {
  width: 450px;
  height: 300px;
  background-color: #fff;
  border-radius: 10px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.avatar_box {
  height: 130px;
  width: 130px;
  border: 1px solid #eee;
  border-radius: 50%;
  padding: 10px;
  box-shadow: 0 0 10px #ddd;
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
}

.avatar_box img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #eee;
}

.login_form {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.btns {
  display: flex;
  justify-content: center;
}

.login-btn {
  width: 100%;
}

/* Modern login refresh */
.login_container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 100%;
  padding: 56px 9vw;
  overflow: hidden;
  background-color: #101828;
}

.login_container::before {
  content: none;
  position: absolute;
  left: 8vw;
  top: 50%;
  width: min(520px, 44vw);
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(42px, 6vw, 78px);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: 0;
  transform: translateY(-58%);
  z-index: 1;
}

.login_container::after {
  content: none;
  position: absolute;
  left: 8vw;
  top: calc(50% + 52px);
  z-index: 1;
  color: rgba(226, 232, 240, 0.86);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0;
}

.login_brand {
  position: absolute;
  left: 8vw;
  top: 50%;
  z-index: 1;
  width: min(560px, 45vw);
  transform: translateY(-56%);
}

.login_brand-title {
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(42px, 6vw, 78px);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: 0;
  word-break: break-word;
}

.login_brand-subtitle {
  margin-top: 22px;
  color: rgba(226, 232, 240, 0.86);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0;
}

.login_box {
  position: relative;
  left: auto;
  top: auto;
  z-index: 2;
  width: 410px;
  height: auto;
  min-height: 380px;
  padding: 78px 34px 34px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  box-shadow: 0 28px 90px rgba(15, 23, 42, 0.36);
  transform: none;
  backdrop-filter: blur(22px);
}

.login_box::before {
  content: '账号登录';
  position: absolute;
  left: 34px;
  top: 28px;
  color: #182230;
  font-size: 22px;
  font-weight: 800;
}

.login_box::after {
  content: '';
  position: absolute;
  left: 34px;
  top: 63px;
  width: 44px;
  height: 4px;
  background: linear-gradient(90deg, #235bff 0%, #00a889 100%);
  border-radius: 999px;
}

.avatar_box {
  left: auto;
  right: 30px;
  top: 28px;
  width: 58px;
  height: 58px;
  padding: 3px;
  border: 1px solid rgba(35, 91, 255, 0.22);
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #eef5ff 100%);
  box-shadow: 0 10px 24px rgba(35, 91, 255, 0.16);
  transform: none;
}

.avatar_box img {
  border-radius: 13px;
  background: #eef2f7;
}

.login_form {
  position: static;
  width: 100%;
  padding: 0;
}

.login_form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login_form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 10px !important;
  box-shadow: 0 0 0 1px #d7e0ec inset !important;
}

.login_form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #235bff inset,
    0 0 0 4px rgba(35, 91, 255, 0.12) !important;
}

.btns {
  margin-bottom: 0 !important;
}

.login-btn {
  height: 44px;
  border-radius: 10px !important;
  font-size: 15px;
  font-weight: 750;
}

/* Login compact refinement */
.login_box {
  width: 400px;
  min-height: 0;
  padding: 30px 32px 32px;
}

.login_box::before {
  top: 28px;
  left: 32px;
  font-size: 24px;
  line-height: 1.2;
}

.login_box::after {
  top: 66px;
  left: 32px;
}

.avatar_box {
  top: 26px;
  right: 32px;
  width: 46px;
  height: 46px;
  padding: 2px;
  border-color: rgba(201, 213, 228, 0.9);
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.12);
}

.avatar_box img {
  border-radius: 50%;
}

.login_form {
  margin-top: 72px;
}

.login_form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login_form :deep(.el-input__wrapper) {
  min-height: 42px;
}

.login-btn {
  height: 42px;
}

@media (max-width: 980px) {
  .login_container {
    justify-content: center;
    padding: 42px 24px;
  }

  .login_container::before,
  .login_container::after,
  .login_brand {
    display: none;
  }
}

@media (max-width: 520px) {
  .login_box {
    width: min(400px, calc(100vw - 40px));
    padding: 28px 24px 28px;
  }

  .login_box::before,
  .login_box::after {
    left: 24px;
  }

  .avatar_box {
    right: 24px;
  }
}
</style>
