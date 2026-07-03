export const getPayload = (responseOrPayload) => responseOrPayload?.data ?? responseOrPayload ?? {}

export const getStatusCode = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  return payload.statusCode ?? payload.StatusCode ?? payload.Code ?? payload.code
}

export const getMessage = (responseOrPayload, fallback = '') => {
  const payload = getPayload(responseOrPayload)
  return payload.Message || payload.message || payload.Msg || payload.msg || fallback
}

export const getData = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  return payload.Data ?? payload.data ?? payload
}

export const isUnauthorizedPayload = (responseOrPayload) => Number(getStatusCode(responseOrPayload)) === 401

export const isSuccessPayload = (responseOrPayload) => {
  const payload = getPayload(responseOrPayload)
  const statusCode = getStatusCode(payload)

  return payload.success === true || payload.Success === true || Number(statusCode) === 200 || Number(statusCode) === 0
}
