import http from './http'

export const getPlugins = () => {
  return http.get('/api/Plugin/GetPlugins')
}

export const uploadPlugin = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/api/Plugin/Upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const enablePlugin = (id) => {
  const formData = new FormData()
  formData.append('id', id)
  return http.post('/api/Plugin/Enable', formData)
}

export const disablePlugin = (id) => {
  const formData = new FormData()
  formData.append('id', id)
  return http.post('/api/Plugin/Disable', formData)
}

export const removePlugin = (id) => {
  const formData = new FormData()
  formData.append('id', id)
  return http.post('/api/Plugin/Remove', formData)
}
