import apiClient from './apiClient'
import { kiemTraMaVe, LoiDuLieuDatVe } from '../utils/kiemTraDuLieuDatVe'

function logPayload(endpoint, payload) {
  console.log(`[API] POST ${endpoint}`, payload)
}

export const taoLienKetVnpay = async (maVe) => {
  const kt = kiemTraMaVe(maVe)
  if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)
  const payload = { maVe: kt.maVe }
  logPayload('/payments/vnpay/create', payload)
  try {
    return (await apiClient.post('/payments/vnpay/create', payload)).data
  } catch (loi) {
    console.error('[API] vnpay/create failed', loi?.response?.data || loi.message)
    throw loi
  }
}

export const taoLienKetMomo = async (maVe) => {
  const kt = kiemTraMaVe(maVe)
  if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)
  const payload = { maVe: kt.maVe }
  logPayload('/payments/momo/create', payload)
  try {
    return (await apiClient.post('/payments/momo/create', payload)).data
  } catch (loi) {
    console.error('[API] momo/create failed', loi?.response?.data || loi.message)
    throw loi
  }
}
