import http from './http'

export const getEsbServiceConnections = (params = {}) => http.get('/api/Esb/GetServiceConnections', { params })

export const getEsbServiceConnectionOptions = () => http.get('/api/Esb/GetServiceConnectionOptions')

export const getEsbSupportedDatabaseTypes = () => http.get('/api/Esb/GetSupportedDatabaseTypes')

export const addEsbServiceConnection = (data) => http.post('/api/Esb/AddServiceConnection', data)

export const updateEsbServiceConnection = (data) => http.post('/api/Esb/UpdateServiceConnection', data)

export const deleteEsbServiceConnection = (itemId) => http.post('/api/Esb/DeleteServiceConnection', { ItemId: itemId })

export const testEsbServiceConnection = (data) => http.post('/api/Esb/TestServiceConnection', data)

export const getEsbDataSources = (params = {}) => http.get('/api/Esb/GetDataSources', { params })

export const getEsbDataSourceById = (id) => http.get('/api/Esb/GetDataSourceById', { params: { id } })

export const addEsbDataSource = (data) => http.post('/api/Esb/AddDataSource', data)

export const updateEsbDataSource = (data) => http.post('/api/Esb/UpdateDataSource', data)

export const deleteEsbDataSource = (itemId) => http.post('/api/Esb/DeleteDataSource', { ItemId: itemId })

export const executeEsbDataSource = ({ code, parameters = {}, pageNum, pageSize }) =>
  http.post('/api/Esb/Execute', {
    Code: code,
    Parameters: parameters,
    PageNum: pageNum,
    PageSize: pageSize
  })
