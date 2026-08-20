import apiClient from './apiClient'

export const layDanhSachCombo = (tatCa = true) =>
  apiClient.get('/combos', { params: tatCa ? {} : {} }).then((phanHoi) => phanHoi.data)

export const themCombo = (duLieu) =>
  apiClient.post('/combos', duLieu).then((phanHoi) => phanHoi.data)

export const capNhatCombo = (id, duLieu) =>
  apiClient.put(`/combos/${id}`, duLieu).then((phanHoi) => phanHoi.data)

export const xoaCombo = (id) =>
  apiClient.delete(`/combos/${id}`)
