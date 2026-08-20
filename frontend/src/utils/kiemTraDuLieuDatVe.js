/** Lỗi validation dữ liệu đặt vé — không gọi API khi thiếu field */
export class LoiDuLieuDatVe extends Error {
  constructor(thongDiep) {
    super(thongDiep)
    this.name = 'LoiDuLieuDatVe'
  }
}

function locChuoi(val) {
  if (val == null) return ''
  return String(val).trim()
}

function locDanhSachGhe(danhSach) {
  if (!Array.isArray(danhSach)) return []
  return [...new Set(danhSach.map((g) => locChuoi(g)).filter(Boolean))]
}

export function kiemTraGiuGhe(maSuatChieu, danhSachGheChon, maNguoiDung) {
  const loi = []
  if (!locChuoi(maSuatChieu)) loi.push('Thiếu mã suất chiếu')
  if (!locChuoi(maNguoiDung)) loi.push('Vui lòng đăng nhập để giữ ghế')
  const ghe = locDanhSachGhe(danhSachGheChon)
  if (!ghe.length) loi.push('Chưa chọn ghế — vui lòng quay lại chọn ghế')

  return {
    hopLe: loi.length === 0,
    thongDiep: loi.join('. '),
    duLieu: {
      maSuatChieu: locChuoi(maSuatChieu),
      danhSachGheChon: ghe,
      maNguoiDung: locChuoi(maNguoiDung),
    },
  }
}

export function kiemTraTaoVe(duLieu) {
  const loi = []
  const maSuatChieu = locChuoi(duLieu?.maSuatChieu)
  const maNguoiDung = locChuoi(duLieu?.maNguoiDung)
  const danhSachGhe = locDanhSachGhe(duLieu?.danhSachGhe)
  const hinhThucThanhToan = locChuoi(duLieu?.hinhThucThanhToan)

  if (!maSuatChieu) loi.push('Thiếu mã suất chiếu')
  if (!maNguoiDung) loi.push('Vui lòng đăng nhập')
  if (!danhSachGhe.length) loi.push('Chưa chọn ghế')
  if (!hinhThucThanhToan) loi.push('Vui lòng chọn hình thức thanh toán')

  const tongTien = Number(duLieu?.tongTien)
  const tienGhe = Number(duLieu?.tienGhe)
  const tienBapNuoc = Number(duLieu?.tienBapNuoc ?? 0)
  if (!Number.isFinite(tongTien) || tongTien < 0) loi.push('Tổng tiền không hợp lệ')
  if (!Number.isFinite(tienGhe) || tienGhe < 0) loi.push('Tiền ghế không hợp lệ')
  if (!Number.isFinite(tienBapNuoc) || tienBapNuoc < 0) loi.push('Tiền bắp nước không hợp lệ')

  const payload = {
    maSuatChieu,
    maNguoiDung,
    danhSachGhe,
    tongTien: Math.max(0, tongTien),
    tienGhe: Math.max(0, tienGhe),
    tienBapNuoc: Math.max(0, tienBapNuoc),
    danhSachCombo: Array.isArray(duLieu?.danhSachCombo) ? duLieu.danhSachCombo : [],
    hinhThucThanhToan,
    kenhDatVe: locChuoi(duLieu?.kenhDatVe) || 'WEB',
    ...(duLieu?.maCodeGiamGia ? { maCodeGiamGia: locChuoi(duLieu.maCodeGiamGia) } : {}),
    ...(duLieu?.noiDungChuyenKhoan ? { noiDungChuyenKhoan: locChuoi(duLieu.noiDungChuyenKhoan) } : {}),
  }

  return {
    hopLe: loi.length === 0,
    thongDiep: loi.join('. '),
    duLieu: payload,
  }
}

export function kiemTraMaVe(maVe) {
  const id = locChuoi(maVe)
  if (!id) {
    return { hopLe: false, thongDiep: 'Chưa có mã vé — vui lòng thử đặt vé lại', maVe: '' }
  }
  return { hopLe: true, thongDiep: '', maVe: id }
}
