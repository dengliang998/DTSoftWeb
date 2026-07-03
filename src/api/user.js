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
