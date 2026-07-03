import http from './http'

export const getMenu = () => http.get('/api/Menu/GetMenu')

export const addMenu = (data) => http.post('/api/Menu/AddMenu', data)

export const updateMenu = (data) => http.post('/api/Menu/UpdateMenu', data)

export const deleteMenu = (data) => http.post('/api/Menu/DelMenu', data)

export const getMenuUrl = (pageCode) => http.post(`/api/Menu/GetMenuUrl?PageCode=${encodeURIComponent(pageCode || '')}`)

export const getRoleMenuMap = (roleId) => http.post(`/api/Menu/GetRoleMenuMap?RoleId=${encodeURIComponent(roleId)}`)

export const getFatherMenu = (roleId) => http.post('/api/Menu/GetFatherMenu', { RoleID: roleId })

export const getChildrenMenu = ({ roleId, menuId }) =>
  http.post('/api/Menu/GetChildrenMenu', {
    RoleID: roleId,
    MenuID: [menuId]
  })

export const updateMenuAuthority = ({ roleId, menuIds }) =>
  http.post('/api/Menu/UpdateMenuAuthority', {
    RoleID: roleId,
    MenuID: menuIds
  })
