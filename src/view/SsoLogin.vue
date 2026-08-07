<template>
  <div class="sso-container">
    <section class="sso-card">
      <span class="sso-icon">
        <el-icon><Key /></el-icon>
      </span>
      <h1>{{ statusTitle }}</h1>
      <p>{{ statusText }}</p>
      <el-button v-if="failed" type="primary" @click="goLogin">{{ $t('sso.backToLogin') }}</el-button>
    </section>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import { setAuthSession } from '@/core/session'
import { translate } from '@/i18n'

const INTERNAL_PATH_RE = /^\/(?!\/)/
const ACCOUNT_CLAIMS = [
  'unique_name',
  'name',
  'sub',
  'nameid',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
]

const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value)

const normalizeRedirect = (value) => {
  const redirect = getQueryValue(value)
  if (!redirect || !INTERNAL_PATH_RE.test(redirect)) return '/home'
  return redirect
}

const base64UrlDecode = (value) => {
  const base64 = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(value || '').length / 4) * 4, '=')
  const binary = window.atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

const getAccountFromToken = (token) => {
  try {
    const payloadPart = String(token || '').split('.')[1]
    if (!payloadPart) return ''

    const payload = JSON.parse(base64UrlDecode(payloadPart))
    for (const claim of ACCOUNT_CLAIMS) {
      if (payload[claim]) return String(payload[claim])
    }
  } catch (error) {
    return ''
  }

  return ''
}

export default defineComponent({
  name: 'SsoLogin',
  components: {
    Key
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const failed = ref(false)
    const statusTitle = ref(translate('sso.processingTitle'))
    const statusText = ref(translate('sso.processingText'))

    const goLogin = () => {
      router.replace('/login')
    }

    onMounted(() => {
      const token = getQueryValue(route.query.token) || getQueryValue(route.query.access_token)
      const account =
        getQueryValue(route.query.account) ||
        getQueryValue(route.query.userAccount) ||
        getQueryValue(route.query.UserAccount) ||
        getAccountFromToken(token)

      if (!token || !account) {
        failed.value = true
        statusTitle.value = translate('sso.failedTitle')
        statusText.value = translate('sso.missingTokenText')
        ElMessage.error(statusText.value)
        return
      }

      setAuthSession({ token, account })
      ElMessage.success(translate('sso.success'))
      router.replace(normalizeRedirect(route.query.redirect))
    })

    return {
      failed,
      statusTitle,
      statusText,
      goLogin
    }
  }
})
</script>

<style scoped>
.sso-container {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  color: var(--dt-text);
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--dt-primary) 12%, transparent), transparent 30%),
    var(--dt-page-bg);
}

.sso-card {
  width: min(420px, 100%);
  padding: 28px;
  text-align: center;
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-radius: 8px;
  box-shadow: var(--dt-shadow);
}

.sso-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: #ffffff;
  background: var(--dt-primary);
  border-radius: 8px;
  font-size: 22px;
}

.sso-card h1 {
  margin: 18px 0 0;
  color: var(--dt-text);
  font-size: 22px;
  font-weight: 800;
}

.sso-card p {
  margin: 10px 0 20px;
  color: var(--dt-text-muted);
  font-size: 14px;
  line-height: 1.6;
}
</style>
