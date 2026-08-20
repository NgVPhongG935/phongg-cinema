import { taoNoiDungChuyenKhoan } from './hinhThucThanhToan'

/** Ma ngan hang theo chuan VietQR Quicklink (BANK-STK, khong phai STK-BANK) */
const MAP_MA_NGAN_HANG = {
  'MB Bank': 'MB',
  'Vietcombank': 'VCB',
  'Techcombank': 'TCB',
  'BIDV': 'BIDV',
  CHUYEN_KHOAN_MB: 'MB',
  CHUYEN_KHOAN_VCB: 'VCB',
  CHUYEN_KHOAN_BIDV: 'BIDV',
  BANK_TRANSFER: 'MB',
}

export const layMaNganHangVietQr = (nganHang, maHinhThuc) =>
  MAP_MA_NGAN_HANG[nganHang] || MAP_MA_NGAN_HANG[maHinhThuc] || 'MB'

const chuanHoaSdt = (sdt) => {
  const s = String(sdt || '').replace(/\D/g, '')
  if (s.startsWith('84') && s.length >= 11) return `0${s.slice(2)}`
  return s
}

const taoQueryVietQr = (soTien, noiDung, tenChu) => {
  const qs = new URLSearchParams()
  const tien = Math.round(Number(soTien) || 0)
  if (tien > 0) qs.set('amount', String(tien))
  if (noiDung) qs.set('addInfo', noiDung)
  if (tenChu) qs.set('accountName', tenChu)
  return qs.toString()
}

/** URL QR VietQR dong ngan hang — amount + noi dung CK (addInfo) khi quet */
export const taoUrlVietQr = ({ soTaiKhoan, nganHang, maHinhThuc, soTien, noiDung, tenChu }) => {
  if (!soTaiKhoan) return null
  const maNganHang = layMaNganHangVietQr(nganHang, maHinhThuc)
  const query = taoQueryVietQr(soTien, noiDung, tenChu)
  return `https://img.vietqr.io/image/${maNganHang}-${soTaiKhoan}-compact2.png${query ? `?${query}` : ''}`
}

/** URL QR MoMo dong qua VietQR — SĐT + amount + addInfo */
export const taoUrlQrMoMo = ({ soDienThoai, soTien, noiDung, tenChu }) => {
  const sdt = chuanHoaSdt(soDienThoai)
  if (!sdt) return null
  const query = taoQueryVietQr(soTien, noiDung, tenChu)
  return `https://img.vietqr.io/image/momo-${sdt}-compact2.png${query ? `?${query}` : ''}`
}

/** Ngan hang / MoMo: VietQR dong; fallback anh upload neu khong co STK/SĐT */
export const layUrlQrThanhToan = (chiTiet, ve) => {
  if (!chiTiet || !ve) return null
  const noiDung = taoNoiDungChuyenKhoan(ve.id)
  if (chiTiet.ma === 'MOMO' || (chiTiet.soDienThoai && !chiTiet.soTaiKhoan)) {
    if (chiTiet.soDienThoai) {
      return taoUrlQrMoMo({
        soDienThoai: chiTiet.soDienThoai,
        soTien: ve.tongTien,
        noiDung,
        tenChu: chiTiet.tenTaiKhoan,
      })
    }
    return chiTiet.anhQr || null
  }
  if (chiTiet.soTaiKhoan) {
    return taoUrlVietQr({
      soTaiKhoan: chiTiet.soTaiKhoan,
      nganHang: chiTiet.chiNhanh,
      maHinhThuc: chiTiet.ma,
      soTien: ve.tongTien,
      noiDung,
      tenChu: chiTiet.tenTaiKhoan,
    })
  }
  return chiTiet.anhQr || null
}
