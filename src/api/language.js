import http from './http'

export const getEnabledLanguages = () => http.get('/api/Language/GetEnabledLanguages')

export const getLanguageResources = () => http.get('/api/Language/GetLanguageResources')

export const getLanguageResourceValues = (languageCode) =>
  http.get(`/api/Language/GetLanguageResourceValues?languageCode=${encodeURIComponent(languageCode || '')}`)

export const saveLanguageResource = (data) => http.post('/api/Language/SaveLanguageResource', data)

export const deleteLanguageResource = (itemId) =>
  http.post(`/api/Language/DeleteLanguageResource?itemId=${encodeURIComponent(itemId)}`)
