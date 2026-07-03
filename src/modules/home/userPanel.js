import { getUserAvatarUrl, getUserDetailByAccount, modifyPassword } from '@/api/user'
import { clearAuthSession, getUserAccount } from '@/core/session'

export const createModifyPwdForm = () => ({
  Account: '',
  OldPwd: '',
  NewPwd: '',
  ConfirmPwd: ''
})

export const loadCurrentUserProfile = async () => {
  const account = getUserAccount()
  const response = await getUserDetailByAccount(account)

  if (!response.data.success) {
    throw new Error(response.data.Msg || '用户信息初始化失败')
  }

  return {
    displayName: response.data.DisplayName,
    avatarUrl: getUserAvatarUrl(account)
  }
}

export const prepareModifyPwdForm = (form) => {
  form.OldPwd = ''
  form.Account = getUserAccount()
}

export const submitModifyPassword = (form) =>
  modifyPassword({
    account: form.Account,
    oldPassword: form.OldPwd,
    newPassword: form.ConfirmPwd
  })

export const logoutAndClearSession = () => {
  clearAuthSession()
}
