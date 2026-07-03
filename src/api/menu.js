import http from './http'

export const getMenu = () => http.get('/api/Menu/GetMenu')
