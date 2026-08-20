import apiClient from './apiClient'

/** Upload anh — khong set Content-Type de axios tu gan boundary multipart */
export const uploadAnh = (file) => {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post('/upload', form, {
    transformRequest: [(data, headers) => {
      delete headers['Content-Type']
      return data
    }],
  }).then((r) => r.data)
}
