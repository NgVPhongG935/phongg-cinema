import apiClient from './apiClient'

export const layDanhSachNguoiDung = (thamSo = {}) =>
  apiClient.get('/users', { params: thamSo }).then((phanHoi) => phanHoi.data)

export const layChiTietNguoiDung = (id) =>
  apiClient.get(`/users/${id}`).then((phanHoi) => phanHoi.data)

export const taoNguoiDung = (duLieu) =>
  apiClient.post('/users', duLieu).then((phanHoi) => phanHoi.data)

export const capNhatNguoiDung = (id, duLieu) =>
  apiClient.put(`/users/${id}`, duLieu).then((phanHoi) => phanHoi.data)

export const xoaNguoiDung = (id) =>
  apiClient.delete(`/users/${id}`).then((phanHoi) => phanHoi.data)

export const capNhatVaiTroNguoiDung = (id, vaiTro) =>
  apiClient.put(`/users/${id}/role`, { vaiTro }).then((phanHoi) => phanHoi.data)

export const capNhatTrangThaiNguoiDung = (id, biKhoa) =>
  apiClient.put(`/users/${id}/status`, { biKhoa }).then((phanHoi) => phanHoi.data)

// English Aliases
export const getUsers = layDanhSachNguoiDung
export const getUser = layChiTietNguoiDung
export const createUser = taoNguoiDung
export const updateUser = capNhatNguoiDung
export const deleteUser = xoaNguoiDung
export const updateUserRole = capNhatVaiTroNguoiDung
export const updateUserStatus = capNhatTrangThaiNguoiDung
