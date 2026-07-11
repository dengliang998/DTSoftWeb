import http from './http'

export const getMicroAppConfigs = (params = {}) => http.get('/api/MicroApp/GetMicroAppConfigs', { params })

export const addMicroAppConfig = (data) => http.post('/api/MicroApp/AddMicroAppConfig', data)

export const updateMicroAppConfig = (data) => http.post('/api/MicroApp/UpdateMicroAppConfig', data)

export const deleteMicroAppConfig = (itemId) => http.post('/api/MicroApp/DeleteMicroAppConfig', { ItemId: itemId })

const getRuntimePath = (modelName, suffix = '') => `/api/${modelName}${suffix}`

export const getMicroRuntimeList = ({ modelName, params }) => http.get(getRuntimePath(modelName), { params })

export const createMicroRuntimeData = ({ modelName, data }) => http.post(getRuntimePath(modelName), data)

export const updateMicroRuntimeData = ({ modelName, id, data }) => http.put(getRuntimePath(modelName, `/${id}`), data)

export const deleteMicroRuntimeData = ({ modelName, id }) => http.delete(getRuntimePath(modelName, `/${id}`))

export const batchDeleteMicroRuntimeData = ({ modelName, ids }) =>
  http.post(getRuntimePath(modelName, '/batch-delete'), { Ids: ids })

export const exportMicroRuntimeData = ({ modelName, params }) =>
  http.get(getRuntimePath(modelName, '/export'), {
    params,
    responseType: 'blob'
  })

export const importMicroRuntimeData = ({ modelName, data }) =>
  http.post(getRuntimePath(modelName, '/import'), data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
