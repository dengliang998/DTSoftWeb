import http from './http'
import { getToken } from '@/core/session'

export const getUploadHeaders = () => ({
  Authorization: `Bearer ${getToken()}`
})

export const getFileList = ({ pageNum = 1, pageSize = 10, keyword = '' } = {}) => {
  const params = new URLSearchParams()
  params.append('PageNum', pageNum)
  params.append('PageSize', pageSize)
  params.append('Keyword', keyword || '')
  return http.post('/api/File/GetFileList', params)
}

export const removeFile = (fileId) => {
  const params = new URLSearchParams()
  params.append('FileID', fileId)
  return http.post('/api/File/RemoveFile', params)
}

export const previewOfficeFile = (fileId) => {
  const params = new URLSearchParams()
  params.append('FileID', fileId)
  return http.post('/api/File/FilePreview', params)
}

export const getFileDownloadUrl = (fileId) => `/api/File/Download?FileID=${encodeURIComponent(fileId)}`
