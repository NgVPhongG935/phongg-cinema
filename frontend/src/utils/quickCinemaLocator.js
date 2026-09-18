export const DANH_SACH_QUAN_HCM = [
  'Quận 1',
  'Quận 5',
  'Quận 10',
  'Thủ Đức',
  'Tân Phú',
  'Gò Vấp',
  'Bình Thạnh',
]

export const TEN_RAP_MAC_DINH = 'Hùng Vương Plaza'
export const THANH_PHO_MAC_DINH = 'Tp. Hồ Chí Minh'
export const KHOA_RAP_DA_CHON = 'phongg_rap_da_chon'
export const HOTLINE_RAP_MAC_DINH = '1900 2224'
export const THANH_PHO_MAU = ['Hà Nội', 'Tp. Hồ Chí Minh', 'Đà Nẵng']

export function chuanHoaTimKiem(chuoi) {
  return String(chuoi || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function locRapThongMinh(danhSachRap = [], tuKhoa) {
  const q = chuanHoaTimKiem(tuKhoa)
  if (!q) return danhSachRap
  return danhSachRap.filter((rap) => {
    const hay = [rap.tenRap, rap.diaChi, rap.khuVuc].map(chuanHoaTimKiem).join(' ')
    return hay.includes(q)
  })
}

export function tenRapNgan(ten) {
  const goc = String(ten || '').trim()
  return goc
    .replace(/^PhongG Cinema\s*[-–:]\s*/i, '')
    .replace(/^Phong Cinema\s*[-–:]\s*/i, '')
    .trim() || goc
}

export function docRapDaChon() {
  try {
    return localStorage.getItem(KHOA_RAP_DA_CHON) || ''
  } catch {
    return ''
  }
}

export function luuRapDaChon(maRap) {
  try {
    if (!maRap) localStorage.removeItem(KHOA_RAP_DA_CHON)
    else localStorage.setItem(KHOA_RAP_DA_CHON, maRap)
  } catch {
    /* ignore quota / private mode */
  }
}

export function hotlineRap(rap) {
  return rap?.hotline || rap?.soDienThoai || rap?.phone || HOTLINE_RAP_MAC_DINH
}

export function locRapTheoQuan(danhSachRap = [], tenQuan) {
  if (!tenQuan) return []
  return danhSachRap.filter((rap) => rap.diaChi?.toLowerCase().includes(tenQuan.toLowerCase()))
}

export function locRapTheoThanhPho(danhSachRap = [], tenThanhPho) {
  if (!tenThanhPho) return []
  return danhSachRap.filter((rap) => rap.khuVuc === tenThanhPho)
}

export function layDanhSachRapCoSuat(chiSoLocPhim) {
  const tapHop = new Set()
  const rapTheoPhim = chiSoLocPhim?.rapTheoPhim || {}
  Object.values(rapTheoPhim).forEach((ds) => ds?.forEach((id) => tapHop.add(id)))
  return tapHop
}

function coSuatChieu(rapId, danhSachRapCoSuat) {
  if (!danhSachRapCoSuat || danhSachRapCoSuat.size === 0) return true
  return danhSachRapCoSuat.has(rapId)
}

function locRapCoSuat(danhSachRap, danhSachRapCoSuat) {
  return danhSachRap.filter((rap) => coSuatChieu(rap.id, danhSachRapCoSuat))
}

export function chonRapUuTien(danhSachRap = [], { viTri, tinhRapGan, danhSachRapCoSuat } = {}) {
  if (!danhSachRap.length) return null

  if (viTri?.viDo && tinhRapGan) {
    const ganCoSuat = locRapCoSuat(tinhRapGan(danhSachRap), danhSachRapCoSuat)
    if (ganCoSuat.length) return ganCoSuat[0]
  }

  const hungVuong = danhSachRap.find(
    (rap) => rap.tenRap?.includes(TEN_RAP_MAC_DINH) && coSuatChieu(rap.id, danhSachRapCoSuat),
  )
  if (hungVuong) return hungVuong

  const coSuat = locRapCoSuat(danhSachRap, danhSachRapCoSuat)
  if (coSuat.length) return coSuat[0]

  return danhSachRap[0]
}

export function chonRapNoiBat(danhSachRap = [], viTri, tinhRapGan, danhSachRapCoSuat) {
  return chonRapUuTien(danhSachRap, { viTri, tinhRapGan, danhSachRapCoSuat })
}
