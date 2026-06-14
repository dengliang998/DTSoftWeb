import http from './http'

/**
 * API密钥管理接口服务
 */

/**
 * 查询API密钥列表
 * @param {Object} params - 查询参数
 * @param {string} params.KeyName - 密钥名称（可选，支持模糊查询）
 * @param {boolean} params.Enabled - 是否启用（可选）
 * @returns {Promise}
 */
export const getApiKeyList = (params = {}) => {
  return http.post('/api/ApiKeyAuth/list', params)
}

/**
 * 创建API密钥
 * @param {Object} data - 创建参数
 * @param {string} data.KeyName - 密钥名称（必填，唯一，最多100字符）
 * @param {string} data.Description - 描述信息（可选，最多500字符）
 * @param {string} data.ExpireTime - 过期时间（可选，ISO 8601格式）
 * @returns {Promise}
 */
export const createApiKey = (data) => {
  return http.post('/api/ApiKeyAuth/create', data)
}

/**
 * 更新API密钥
 * @param {Object} data - 更新参数
 * @param {number} data.ItemId - 主键ID（必填）
 * @param {string} data.Description - 描述信息（可选）
 * @param {boolean} data.Enabled - 是否启用（必填）
 * @param {string} data.ExpireTime - 过期时间（可选）
 * @returns {Promise}
 */
export const updateApiKey = (data) => {
  return http.put('/api/ApiKeyAuth/update', data)
}

/**
 * 删除API密钥
 * @param {number} itemId - 主键ID
 * @returns {Promise}
 */
export const deleteApiKey = (itemId) => {
  return http.delete('/api/ApiKeyAuth/delete', {
    data: { ItemId: itemId }
  })
}
