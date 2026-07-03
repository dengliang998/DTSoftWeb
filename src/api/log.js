import http from './http'

export const getLogActionList = ({ pageNum = 1, pageSize = 10, actionName = '' } = {}) => {
  const params = new URLSearchParams()
  params.append('PageNum', pageNum)
  params.append('PageSize', pageSize)
  params.append('ActionName', actionName || '')
  return http.post('/api/Log/GetLogActionList', params)
}
