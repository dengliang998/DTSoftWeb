import http from './http'

/**
 * 系统配置接口服务
 */

/**
 * 获取系统信息（系统名称、登录背景图base64）
 * @returns {Promise}
 */
export const getSystemInfo = () => {
  return http.get('/api/SysConfig/GetSystemInfo')
}

/**
 * 获取系统运行信息
 * @returns {Promise}
 */
export const getSystemRuntimeInfo = () => {
  return http.get('/api/SysConfig/GetSystemRuntimeInfo')
}

/**
 * 设置系统信息（form-data）
 * @param {Object} params
 * @param {string} params.SystemName - 系统名称
 * @param {File|null|undefined} params.LoginImg - 登录背景图文件（可选）
 * @param {File|null|undefined} params.BrowserLogo - 浏览器标签页小logo文件（可选）
 * @param {string|null|undefined} params.ThemeConfig - 系统主题配置JSON（可选）
 * @returns {Promise}
 */
export const setSystemInfo = ({ SystemName, LoginImg, BrowserLogo, ThemeConfig }) => {
  const formData = new FormData()
  formData.append('SystemName', SystemName ?? '')
  if (LoginImg) {
    formData.append('LoginImg', LoginImg)
  }
  if (BrowserLogo) {
    formData.append('BrowserLogo', BrowserLogo)
  }
  if (ThemeConfig) {
    formData.append('ThemeConfig', ThemeConfig)
  }
  return http.post('/api/SysConfig/SetSystemInfo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
