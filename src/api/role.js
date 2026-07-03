import http from './http'

export const getRoleList = ({ pageNum = 1, pageSize = 10, roleName = '' } = {}) => {
  const params = new URLSearchParams()
  params.append('PageNum', pageNum)
  params.append('PageSize', pageSize)
  params.append('RoleName', roleName || '')
  return http.post('/api/Role/GetRoleList', params)
}

export const getRoleMemberList = (roleId) => {
  const params = new URLSearchParams()
  params.append('RoleID', roleId)
  return http.post('/api/Role/GetRoleMemberList', params)
}

export const addRoleMember = ({ roleId, roleMembers }) =>
  http.post('/api/Role/AddRoleMember', {
    ItemId: roleId,
    RoleMember: roleMembers
  })

export const createRole = (roleName) => {
  const params = new URLSearchParams()
  params.append('RoleName', roleName || '')
  return http.post('/api/Role/CreateRole', params)
}

export const getRole = (roleId) =>
  http.get('/api/Role/GetRole', {
    params: { RoleId: roleId }
  })

export const updateRole = ({ itemId, roleName }) => {
  const params = new URLSearchParams()
  params.append('ItemId', itemId)
  params.append('RoleName', roleName || '')
  return http.post('/api/Role/ModifyRoleInfo', params)
}

export const deleteRole = (roleId) => {
  const params = new URLSearchParams()
  params.append('RoleID', roleId)
  return http.post('/api/Role/DelRole', params)
}
