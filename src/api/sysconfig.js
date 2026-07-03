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
 * 设置系统信息（form-data）
 * @param {Object} params
 * @param {string} params.SystemName - 系统名称
 * @param {File|null|undefined} params.LoginImg - 登录背景图文件（可选）
 * @returns {Promise}
 */
export const setSystemInfo = ({ SystemName, LoginImg }) => {
  const formData = new FormData()
  formData.append('SystemName', SystemName ?? '')
  if (LoginImg) {
    formData.append('LoginImg', LoginImg)
  }
  return http.post('/api/SysConfig/SetSystemInfo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
