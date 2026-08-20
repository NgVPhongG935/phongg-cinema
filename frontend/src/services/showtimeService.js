import apiClient from './apiClient'
import { kiemTraGiuGhe, LoiDuLieuDatVe } from '../utils/kiemTraDuLieuDatVe'

export const layDanhSachRap = (khuVuc) => apiClient.get('/cinemas', { params: khuVuc ? { khuVuc } : {} }).then((phanHoi) => phanHoi.data)
export const layChiSoLocPhim = () => apiClient.get('/showtimes/filter-index').then((phanHoi) => phanHoi.data)
export const themRapMoi = (duLieu) => apiClient.post('/cinemas/admin', duLieu).then((phanHoi) => phanHoi.data)
export const layLichChieuHomNayTheoRap = (maRap, ngayChieu) => apiClient.get('/showtimes/cinema-day', { params: { maRap, ngayChieu } }).then((phanHoi) => phanHoi.data)
export const layLichChieu = (maPhim, ngayChieu, maRap) => apiClient.get('/showtimes', { params: { maPhim, ngayChieu, ...(maRap ? { maRap } : {}) } }).then((phanHoi) => phanHoi.data)
export const layLichSuSuatChieu = () => apiClient.get('/showtimes/admin/history').then((phanHoi) => phanHoi.data)
export const laySoDoGhe = (id) => apiClient.get(`/showtimes/${id}/seats`).then((phanHoi) => {
  const duLieu = phanHoi.data
  if (Array.isArray(duLieu)) return { giaVeTu: 0, danhSachGhe: duLieu }
  return { giaVeTu: duLieu.giaVeTu ?? 0, danhSachGhe: duLieu.danhSachGhe ?? [] }
})

export const giuGheTamThoi = async (maSuatChieu, danhSachGheChon, maNguoiDung) => {
  const kt = kiemTraGiuGhe(maSuatChieu, danhSachGheChon, maNguoiDung)
  if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)

  const payload = { danhSachGheChon: kt.duLieu.danhSachGheChon }
  const params = { maNguoiDung: kt.duLieu.maNguoiDung }
  console.log(`[API] POST /showtimes/${kt.duLieu.maSuatChieu}/hold-seats`, { body: payload, params })

  try {
    return (await apiClient.post(`/showtimes/${kt.duLieu.maSuatChieu}/hold-seats`, payload, { params })).data
  } catch (loi) {
    console.error('[API] hold-seats failed', loi?.response?.data || loi.message)
    throw loi
  }
}

export const taoSuatChieu = (duLieu) => apiClient.post('/showtimes/admin', duLieu).then((phanHoi) => phanHoi.data)
export const goiYSuatChieu = (duLieu) => apiClient.post('/showtimes/admin/preview-slots', duLieu).then((phanHoi) => phanHoi.data)
export const taoHangLoatSuatChieu = (duLieu) => apiClient.post('/showtimes/admin/batch', duLieu).then((phanHoi) => phanHoi.data)
export const goiYXepLichAi = (duLieu) => apiClient.post('/showtimes/ai-generate', duLieu, { timeout: 90000 }).then((phanHoi) => phanHoi.data)
export const taoSuatChieuTuDong = (duLieu = {}) => apiClient.post('/showtimes/admin/auto-seed', duLieu).then((phanHoi) => phanHoi.data)
export const capNhatSuatChieu = (id, duLieu) => apiClient.put(`/showtimes/admin/${id}`, duLieu).then((phanHoi) => phanHoi.data)
export const xoaSuatChieu = (id) => apiClient.delete(`/showtimes/admin/${id}`)
