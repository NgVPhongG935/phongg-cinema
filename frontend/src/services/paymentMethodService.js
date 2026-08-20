import apiClient from './apiClient'

export const layDanhSachHinhThucThanhToan = () =>
  apiClient.get('/payments/methods').then((r) => r.data)

export const layDanhSachHinhThucAdmin = () =>
  apiClient.get('/payments/admin/methods').then((r) => r.data)

export const themHinhThucThanhToan = (duLieu) =>
  apiClient.post('/payments/admin/methods', duLieu).then((r) => r.data)

export const capNhatHinhThucThanhToan = (ma, duLieu) =>
  apiClient.put(`/payments/admin/methods/${ma}`, duLieu).then((r) => r.data)

export const xoaHinhThucThanhToan = (ma) =>
  apiClient.delete(`/payments/admin/methods/${ma}`)

export const uploadQrThanhToan = (ma, file) => {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post(`/payments/admin/methods/${ma}/qr`, form).then((r) => r.data)
}
