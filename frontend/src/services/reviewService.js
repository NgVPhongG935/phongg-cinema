import apiClient from './apiClient'

export const layTomTatDanhGia = (maPhim) =>
  apiClient.get(`/movies/${maPhim}/reviews/summary`).then((r) => r.data)

export const layDanhSachDanhGia = (maPhim, page = 0, size = 10) =>
  apiClient.get(`/movies/${maPhim}/reviews`, { params: { page, size } }).then((r) => r.data)

export const guiDanhGia = (maPhim, duLieu) =>
  apiClient.post(`/movies/${maPhim}/reviews`, duLieu).then((r) => r.data)

export const xoaDanhGiaCuaToi = (maPhim) =>
  apiClient.delete(`/movies/${maPhim}/reviews/me`)

export const guiPhanHoiDanhGia = (maPhim, maDanhGia, noiDung) =>
  apiClient.post(`/movies/${maPhim}/reviews/${maDanhGia}/replies`, { noiDung }).then((r) => r.data)

export const xoaPhanHoiDanhGia = (maPhim, maDanhGia, maPhanHoi) =>
  apiClient.delete(`/movies/${maPhim}/reviews/${maDanhGia}/replies/${maPhanHoi}`)
