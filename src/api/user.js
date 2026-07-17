import http from './http'

export const getUserAvatarUrl = (account, paramName = 'Account') => {
  if (!account) return ''
  return `/api/User/GetUserAvatar?${paramName}=${encodeURIComponent(account)}`
}

export const getUserDetailByAccount = (account) => {
  const params = new URLSearchParams()
  params.append('account', account || '')
  return http.post('/api/User/GetUserDetailByAccount', params)
}

export const modifyPassword = ({ account, oldPassword, newPassword }) => {
  const params = new URLSearchParams()
  params.append('Account', account || '')
  params.append('OldPassWord', oldPassword || '')
  params.append('NewPassWord', newPassword || '')
  return http.post('/api/User/ModifyPassword', params)
}

export const getUserList = ({ keyword = '', pageNum = 1, pageSize = 10, ouId } = {}) => {
  const params = new URLSearchParams()
  params.append('Keyword', keyword || '')
  params.append('PageNum', pageNum)
  params.append('PageSize', pageSize)
  if (ouId) {
    params.append('OuId', ouId)
  }
  return http.post('/api/User/GetUserList', params)
}

export const getOnlineUsers = () => http.post('/api/User/GetOnlineUsers')

export const createUser = (params) => http.post('/api/User/CreateUser', params)

export const modifyUserInfo = (params) => http.post('/api/User/ModifyUserInfo', params)

export const resetPassword = ({ account, password }) => {
  const params = new URLSearchParams()
  params.append('Account', account || '')
  params.append('PassWord', password || '')
  return http.post('/api/User/ResetPassword', params)
}

export const deleteUser = (account) => {
  const params = new URLSearchParams()
  params.append('Account', account || '')
  return http.post('/api/User/DelUser', params)
}
