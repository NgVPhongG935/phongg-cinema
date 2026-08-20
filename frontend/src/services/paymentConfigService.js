import apiClient from './apiClient'

export const layCauHinhThanhToan = () =>
  apiClient.get('/payment-config').then((r) => r.data)

export const luuCauHinhThanhToan = (duLieu) =>
  apiClient.post('/payment-config', duLieu).then((r) => r.data)
