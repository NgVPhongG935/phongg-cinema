import apiClient from './apiClient'

export const layDanhSachVoucher = () =>
  apiClient.get('/vouchers/admin').then((phanHoi) => phanHoi.data)

export const themVoucher = (duLieu) =>
  apiClient.post('/vouchers/admin', duLieu).then((phanHoi) => phanHoi.data)

export const capNhatVoucher = (id, duLieu) =>
  apiClient.put(`/vouchers/admin/${id}`, duLieu).then((phanHoi) => phanHoi.data)

export const voHieuHoaVoucher = (id) =>
  apiClient.delete(`/vouchers/admin/${id}`)

export const apDungMaGiamGia = (maCode, tongTien) =>
  apiClient.post('/vouchers/apply', { maCode, tongTien }).then((phanHoi) => phanHoi.data)
