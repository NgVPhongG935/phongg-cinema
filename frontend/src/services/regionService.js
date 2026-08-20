import apiClient from './apiClient'

export const layDanhSachKhuVuc = () => apiClient.get('/regions').then((phanHoi) => phanHoi.data.map((muc) => muc.tenKhuVuc))
export const layDanhSachKhuVucDayDu = () => apiClient.get('/regions').then((phanHoi) => phanHoi.data)
export const themKhuVuc = (duLieu) => apiClient.post('/regions/admin', duLieu).then((phanHoi) => phanHoi.data)
export const capNhatKhuVuc = (id, duLieu) => apiClient.put(`/regions/admin/${id}`, duLieu).then((phanHoi) => phanHoi.data)
export const xoaKhuVuc = (id) => apiClient.delete(`/regions/admin/${id}`)
