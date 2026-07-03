import http from './http'

export const getAllOus = () => http.get('/api/Ou/GetAllOus')

export const createOu = (data) => http.post('/api/Ou/CreateOu', data)

export const updateOu = (data) => http.post('/api/Ou/ModifyOuInfo', data)

export const deleteOu = (ouId) => {
  const params = new URLSearchParams()
  params.append('OuId', ouId)
  return http.post('/api/Ou/DelOu', params)
}
