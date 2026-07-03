<template>
  <div class="login_container" :style="loginContainerStyle">
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
          if (title) document.title = title
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
</style>
