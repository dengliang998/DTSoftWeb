<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>{{ PMenuName }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ MenuName }}</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图区域 -->
    <el-card>
      <iframe
        id="bdIframe"
        ref="bdIframe"
        :src="html"
        style="width: 100%"
        frameborder="0"
        scrolling="yes"
        referrerpolicy="no-referrer"
        @load="onIframeLoad"
      />
    </el-card>
  </div>
</template>

<script>
import axios from '@/api/http'

export default {
  name: 'JumpPage',
  data() {
    return {
      html: '',
      MenuName: '',
      PMenuName: ''
    }
  },
  watch: {
    $route(to, from) {
      //监听路由是否变化
      if (to.query.PageCode != from.query.PageCode && to.query.PageCode != null) {
        this.LoadPage() //调接口，请求数据
      }
    }
  },
  created() {
    this.LoadPage()
  },
  mounted() {
    this.updateIframeHeight()
    window.addEventListener('resize', this.updateIframeHeight)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateIframeHeight)
  },
  methods: {
    updateIframeHeight() {
      const iframe = this.$refs.bdIframe
      if (!iframe) return
      const deviceHeight = document.documentElement.clientHeight
      iframe.style.height = Number(deviceHeight) - 170 + 'px'
    },
    LoadPage() {
      let me = this
      let query = me.$route.query
      axios
        .post('/api/Menu/GetMenuUrl?PageCode=' + query.PageCode)
        .then(function (response) {
          if (response.data.success) {
            const token = localStorage.getItem('token')
            const pageUrl = response.data.PageUrl
            const targetUrl = new URL(pageUrl, window.location.origin)
            if (targetUrl.origin === window.location.origin && token) {
              targetUrl.searchParams.set('token', token)
            }
            me.html = targetUrl.toString()
            me.MenuName = response.data.MenuName
            me.PMenuName = response.data.PMenuName
          } else {
            me.$message.error(response.data.Msg)
          }
        })
        .catch(function () {
          me.$message.error('加载错误，请稍后重试！')
        })
    },
    onIframeLoad() {
      const token = localStorage.getItem('token')
      const iframe = this.$refs.bdIframe
      if (!iframe || !iframe.contentWindow || !token) return
      iframe.contentWindow.postMessage({ type: 'DT_AUTH_TOKEN', token }, '*')
    }
  }
}
</script>

<style scoped></style>
