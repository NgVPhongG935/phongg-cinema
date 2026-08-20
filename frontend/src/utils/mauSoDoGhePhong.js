import { GIA_CO_BAN, phuThuTheoLoai } from './soDoGhe'

export const LOAI_PHONG = ['2D', '3D', 'IMAX', '4DX']

export const DANH_SACH_MAU_SO_DO = [
  { ma: 'MAC_DINH', nhan: 'Chọn Mẫu Sơ Đồ Ghế (Mặc định)' },
  { ma: 'VUA', nhan: 'Mẫu sơ đồ ghế vừa (80 ghế: A–H, 10 ghế/hàng)' },
  { ma: 'TRUNG_BINH', nhan: 'Mẫu sơ đồ ghế trung bình (140 ghế: A–J, 14 ghế/hàng)' },
  { ma: 'LON', nhan: 'Mẫu sơ đồ ghế lớn (216 ghế: A–L, 18 ghế/hàng — VIP & ghế đôi hàng cuối)' },
  { ma: 'TUUY_CHINH', nhan: 'Tùy chỉnh sơ đồ riêng (Chuyển sang công cụ chỉnh sửa sơ đồ ghế)' },
]

const taoGhe = (soGhe, loaiGhe) => ({
  soGhe,
  loaiGhe,
  giaVe: GIA_CO_BAN + phuThuTheoLoai(loaiGhe),
})

/** Sinh danhSachGhe phía frontend (đồng bộ logic backend) khi cần gửi trực tiếp */
export function taoDanhSachGheTuMau(maMau) {
  switch (maMau) {
    case 'VUA': {
      const ds = []
      for (let h = 65; h <= 72; h++) {
        for (let so = 1; so <= 10; so++) ds.push(taoGhe(`${String.fromCharCode(h)}${so}`, 'STANDARD'))
      }
      return ds
    }
    case 'TRUNG_BINH': {
      const ds = []
      for (let h = 65; h <= 74; h++) {
        for (let so = 1; so <= 14; so++) ds.push(taoGhe(`${String.fromCharCode(h)}${so}`, 'STANDARD'))
      }
      return ds
    }
    case 'LON': {
      const ds = []
      for (let h = 65; h <= 75; h++) {
        for (let so = 1; so <= 18; so++) {
          const hang = String.fromCharCode(h)
          const laVip = h >= 68 && h <= 75 && so >= 5 && so <= 14
          ds.push(taoGhe(`${hang}${so}`, laVip ? 'VIP' : 'STANDARD'))
        }
      }
      for (let so = 1; so <= 18; so += 2) {
        ds.push(taoGhe(`L${so}`, 'COUPLE'))
        ds.push(taoGhe(`L${so + 1}`, 'COUPLE'))
      }
      return ds
    }
  }
  return null
}

export function goiYTenPhong(soPhongHienTai = 0) {
  return `P${101 + soPhongHienTai}`
}

export function taoMaPhongTuTen(tenPhong) {
  const s = (tenPhong || '').trim().toUpperCase().replace(/\s+/g, '')
  return s || 'P101'
}
