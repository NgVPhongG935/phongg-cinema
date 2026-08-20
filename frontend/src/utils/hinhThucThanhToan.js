/** Dữ liệu mặc định — dùng khi API chưa tải hoặc vé cũ */
const MAC_DINH = [
  {
    ma: 'CHUYEN_KHOAN_MB',
    ten: 'Chuyển khoản MB Bank (VietQR)',
    moTa: 'Ngân hàng TMCP Quân đội — quét VietQR Napas 247',
    mau: 'from-blue-600 to-indigo-700',
    soTaiKhoan: '2100609032005',
    tenTaiKhoan: 'NGUYEN VU PHONG',
    chiNhanh: 'MB Bank',
    loaiCong: 'MANUAL',
  },
  {
    ma: 'MOMO',
    ten: 'Ví MoMo',
    moTa: 'Quét mã nhận tiền MoMo',
    mau: 'from-pink-600 to-rose-600',
    soDienThoai: '0900000001',
    tenTaiKhoan: 'NGUYEN VU PHONG',
    chiNhanh: 'Mã nhận tiền MoMo',
    loaiCong: 'MANUAL',
  },
  {
    ma: 'VNPAY',
    ten: 'VNPay (thẻ / ngân hàng)',
    moTa: 'Thanh toán qua cổng VNPay sandbox',
    mau: 'from-red-600 to-rose-700',
    tenTaiKhoan: 'Cổng VNPay',
    chiNhanh: 'Sandbox',
    loaiCong: 'GATEWAY',
  },
  {
    ma: 'MOMO_GATEWAY',
    ten: 'MoMo (cổng thanh toán)',
    moTa: 'Thanh toán qua ví MoMo sandbox',
    mau: 'from-pink-600 to-rose-600',
    tenTaiKhoan: 'Cổng MoMo',
    chiNhanh: 'Sandbox',
    loaiCong: 'GATEWAY',
  },
]

export const HINH_THUC_CU = [
  { ma: 'CHUYEN_KHOAN_VCB', ten: 'Chuyển khoản Vietcombank' },
  { ma: 'CHUYEN_KHOAN_BIDV', ten: 'Chuyển khoản BIDV' },
]

let cacheDanhSach = null

export const datCacheHinhThuc = (danhSach) => {
  if (danhSach?.length) cacheDanhSach = danhSach
}

export const layDanhSachHinhThuc = () => cacheDanhSach || MAC_DINH

/** Mã cấu hình UI (CHUYEN_KHOAN_MB) → mã API chuẩn (BANK_TRANSFER) */
export const chuyenMaGuiApi = (ma) => {
  if (!ma) return ma
  if (ma === 'CHUYEN_KHOAN_MB' || ma === 'CHUYEN_KHOAN_VCB' || ma === 'CHUYEN_KHOAN_BIDV') return 'BANK_TRANSFER'
  if (ma === 'BANK_TRANSFER' || ma === 'MOMO' || ma === 'VNPAY' || ma === 'MOMO_GATEWAY') return ma
  const ht = layHinhThucTheoMa(ma)
  if (ht?.loaiCong === 'GATEWAY') return ma.includes('VNPAY') ? 'VNPAY' : 'MOMO_GATEWAY'
  if (ht?.soTaiKhoan) return 'BANK_TRANSFER'
  if (ht?.soDienThoai) return 'MOMO'
  return ma
}

/** Mã lưu trên vé (BANK_TRANSFER) → mã cấu hình để tra QR/STK */
export const layMaCauHinh = (ma) => {
  if (ma === 'BANK_TRANSFER') return 'CHUYEN_KHOAN_MB'
  return ma
}

export const layHinhThucTheoMa = (ma) => {
  const maTim = layMaCauHinh(ma)
  return layDanhSachHinhThuc().find((muc) => muc.ma === maTim)
    || HINH_THUC_CU.find((muc) => muc.ma === maTim)
}

export const taoNoiDungChuyenKhoan = (maVe) => `PHONGG ${maVe?.slice(-8)?.toUpperCase() || 'VE'}`

/** Ma tham chieu tam truoc khi tao ve — dung cho QR CK */
export const taoMaThamChieuTam = () =>
  `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase().slice(0, 8)

const MA_CK_THU_CONG = new Set(['CHUYEN_KHOAN_MB', 'MOMO', 'CHUYEN_KHOAN_VCB', 'CHUYEN_KHOAN_BIDV', 'BANK_TRANSFER'])

export const laChuyenKhoanThuCong = (ma) => {
  if (!ma) return false
  if (MA_CK_THU_CONG.has(ma)) return true
  const ht = layHinhThucTheoMa(ma)
  return ht?.loaiCong === 'MANUAL' && ma !== 'VNPAY' && ma !== 'MOMO_GATEWAY'
}

export const tenTrangThaiVe = (trangThai) => {
  if (trangThai === 'PAID') return 'Đã thanh toán'
  if (trangThai === 'USED') return 'Đã sử dụng'
  if (trangThai === 'CANCELLED') return 'Đã hủy'
  if (trangThai === 'CHO_XAC_NHAN') return 'Chờ xác nhận'
  return 'Chờ thanh toán'
}

export const tenHinhThucThanhToan = (ma) => layHinhThucTheoMa(ma)?.ten || 'Thanh toán online'
