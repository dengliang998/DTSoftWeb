import http from './http'

export const getLogActionList = (params = {}) => {
  const formData = new URLSearchParams()
  const formParams = {
    PageNum: params.PageNum ?? params.pageNum ?? 1,
    PageSize: params.PageSize ?? params.pageSize ?? 10,
    LogDateStart: params.LogDateStart ?? params.logDateStart ?? '',
    LogDateEnd: params.LogDateEnd ?? params.logDateEnd ?? '',
    UserAcc: params.UserAcc ?? params.userAcc ?? '',
    ClientIP: params.ClientIP ?? params.clientIP ?? '',
    ActionName: params.ActionName ?? params.actionName ?? '',
    Param: params.Param ?? params.param ?? '',
    Result: params.Result ?? params.result ?? '',
    Keyword: params.Keyword ?? params.keyword ?? ''
  }

  Object.entries(formParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value)
    }
  })

  return http.post('/api/Log/GetLogActionList', formData)
}
