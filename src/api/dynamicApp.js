import http from './http'

export const getDynamicAppConfigs = (params = {}) => http.get('/api/DynamicApp/GetDynamicAppConfigs', { params })

export const addDynamicAppConfig = (data) => http.post('/api/DynamicApp/AddDynamicAppConfig', data)

export const updateDynamicAppConfig = (data) => http.post('/api/DynamicApp/UpdateDynamicAppConfig', data)

export const deleteDynamicAppConfig = (itemId) =>
  http.post('/api/DynamicApp/DeleteDynamicAppConfig', { ItemId: itemId })

const getRuntimePath = (modelName, suffix = '') => `/api/${modelName}${suffix}`

export const getDynamicRuntimeList = ({ modelName, params }) => http.get(getRuntimePath(modelName), { params })

export const createDynamicRuntimeData = ({ modelName, data }) => http.post(getRuntimePath(modelName), data)

export const updateDynamicRuntimeData = ({ modelName, id, data }) => http.put(getRuntimePath(modelName, `/${id}`), data)

export const deleteDynamicRuntimeData = ({ modelName, id }) => http.delete(getRuntimePath(modelName, `/${id}`))

export const exportDynamicRuntimeData = ({ modelName, params }) =>
  http.get(getRuntimePath(modelName, '/export'), {
    params,
    responseType: 'blob'
  })

export const importDynamicRuntimeData = ({ modelName, data }) =>
  http.post(getRuntimePath(modelName, '/import'), data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
