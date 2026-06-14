const apiProxyTarget = 'http://100.65.45.46:8000/api'

module.exports = {
    publicPath: './',
    outputDir: 'dist',
    assetsDir: 'static',
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
