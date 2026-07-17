import http from './http'

export const getDictionaryTypes = (params = {}) => http.post('/api/Dictionary/GetTypes', params)

export const saveDictionaryType = (data) => http.post('/api/Dictionary/SaveType', data)

export const deleteDictionaryType = (itemId) => http.post('/api/Dictionary/DeleteType', { ItemId: itemId })

export const sortDictionaryTypes = (data) => http.post('/api/Dictionary/SortTypes', data)

export const getDictionaryItems = (params = {}) => http.post('/api/Dictionary/GetItems', params)

export const getDictionaryItemsByCode = (dictCode) =>
  http.get('/api/Dictionary/GetItemsByCode', { params: { dictCode } })

export const saveDictionaryItem = (data) => http.post('/api/Dictionary/SaveItem', data)

export const deleteDictionaryItem = (itemId) => http.post('/api/Dictionary/DeleteItem', { ItemId: itemId })

export const sortDictionaryItems = (data) => http.post('/api/Dictionary/SortItems', data)
