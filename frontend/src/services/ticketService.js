import apiClient from './apiClient'
import { kiemTraTaoVe, LoiDuLieuDatVe } from '../utils/kiemTraDuLieuDatVe'

export const taoVeMoi = async (duLieu) => {
  const kt = kiemTraTaoVe(duLieu)
  if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)
  console.log('[API] POST /bookings/create-ticket', kt.duLieu)
  try {
    return (await apiClient.post('/bookings/create-ticket', kt.duLieu)).data
  } catch (loi) {
    console.error('[API] create-ticket failed', loi?.response?.data || loi.message)
    throw loi
  }
}

export const taoVaGuiYeuCauCk = async (duLieu) => {
  const kt = kiemTraTaoVe(duLieu)
  if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)
  console.log('[API] POST /bookings/confirm-pending', kt.duLieu)
  try {
    return (await apiClient.post('/bookings/confirm-pending', kt.duLieu)).data
  } catch (loi) {
    if (loi?.response?.status === 404 || loi?.response?.status === 405) {
      const ve = await taoVeMoi(kt.duLieu)
      return (await apiClient.put(`/bookings/${ve.id}/submit-payment`)).data
    }
    console.error('[API] confirm-pending failed', loi?.response?.data || loi.message)
    throw loi
  }
}

export const guiYeuCauThanhToan = (maVe) => apiClient.put(`/bookings/${maVe}/submit-payment`).then((r) => r.data)
export const confirmTransfer = (maVe) => apiClient.post(`/bookings/${maVe}/confirm-transfer`).then((r) => r.data)
export const xacNhanChuyenKhoan = confirmTransfer
export const huyVeTam = (maVe, maNguoiDung) =>
  apiClient.delete(`/bookings/${maVe}/cancel-pending`, { params: { maNguoiDung } })
export const duyetVeBooking = (maVe) => apiClient.put(`/bookings/${maVe}/approve`).then((r) => r.data)
export const layDanhSachVeCuaToi = (maNguoiDung, tuKhoa = '') => apiClient.get('/tickets/my-tickets', { params: { maNguoiDung, ...(tuKhoa ? { tuKhoa } : {}) } }).then((phanHoi) => phanHoi.data)
export const layVeChoThanhToan = () => apiClient.get('/tickets/admin/pending').then((phanHoi) => phanHoi.data)
export const layVeDaXacNhan = () => apiClient.get('/tickets/admin/confirmed').then((phanHoi) => phanHoi.data)
export const traCuuVeQrcode = (maQrCode) =>
  apiClient.get('/tickets/staff/preview-qr', { params: { maQrCode } }).then((phanHoi) => phanHoi.data)
export const layVeDaSoatHomNay = () =>
  apiClient.get('/tickets/staff/scanned-today').then((phanHoi) => phanHoi.data)
export const soatVeQrcode = (maQrCode) => apiClient.post('/tickets/staff/scan-qr', null, { params: { maQrCode } }).then((phanHoi) => phanHoi.data)
