// 后端接口代理目标地址，通过环境变量配置，默认指向开发环境后端
const apiProxyTarget = process.env.VUE_APP_API_TARGET || 'http://100.65.45.46:8000/api'

module.exports = {
  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'static',
  runtimeCompiler: true,
  configureWebpack: {
    performance: {
      hints: false
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        ws: true,
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  }
}
