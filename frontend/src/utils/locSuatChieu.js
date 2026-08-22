function layGioGoc(item) {
  return item?.startTime || item?.start_time || item?.thoiGianBatDau || ''
}

/** HH:mm theo giờ địa phương — không dùng toISOString (UTC) kẻo lệch key. */
export function chuanHoaGio(item) {
  const raw = typeof item === 'string' ? item : layGioGoc(item)
  const d = raw ? new Date(raw) : null
  if (d && !Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const m = String(raw).match(/T(\d{2}:\d{2})/)
  return m ? m[1] : String(raw)
}

export function maRapSuat(item) {
  return item?.cinemaId || item?.maRap || ''
}

export function tenPhongSuat(suat) {
  return suat?.roomId || suat?.maPhong || suat?.tenPhong || suat?.room || ''
}

export function chuanHoaDinhDang(st) {
  const s = String(st?.format || st?.dinhDang || '2D').toLowerCase()
  if (s.includes('3d')) return '3D'
  if (s.includes('imax')) return 'IMAX'
  if (s.includes('lồng') || s.includes('long')) return '2D Lồng tiếng'
  if (s.includes('phụ') || s.includes('phu')) return '2D Phụ đề'
  return st?.format || st?.dinhDang || '2D'
}

export function khoaSuatChieu(item) {
  return `${chuanHoaGio(item)}-${maRapSuat(item)}-${tenPhongSuat(item)}`
}

export function getUniqueShowtimes(showtimes = []) {
  const map = new Map()
  showtimes.forEach((st) => {
    const key = khoaSuatChieu(st)
    if (!map.has(key)) map.set(key, st)
  })
  return Array.from(map.values()).sort((a, b) => new Date(layGioGoc(a)) - new Date(layGioGoc(b)))
}

export const locSuatChieuDuyNhat = getUniqueShowtimes

/** Một nút / một mốc HH:mm / một rạp / một định dạng. */
export function gioChieuDuyNhat(showtimes = []) {
  const map = new Map()
  getUniqueShowtimes(showtimes).forEach((st) => {
    const key = `${chuanHoaGio(st)}|${chuanHoaDinhDang(st)}|${maRapSuat(st)}`
    if (!map.has(key)) map.set(key, st)
  })
  return Array.from(map.values()).sort((a, b) => new Date(layGioGoc(a)) - new Date(layGioGoc(b)))
}

export function nhomTheoDinhDangVaGio(showtimes = []) {
  const ketQua = {}
  gioChieuDuyNhat(showtimes).forEach((st) => {
    const dinhDang = chuanHoaDinhDang(st)
    if (!ketQua[dinhDang]) ketQua[dinhDang] = []
    ketQua[dinhDang].push(st)
  })
  return ketQua
}

export function gomSuatPhim(phim) {
  const gop = [...(phim?.showtimes || []), ...(phim?.danhSachSuat || [])]
  const unique = gioChieuDuyNhat(gop)
  return { ...phim, showtimes: unique, danhSachSuat: unique }
}

export function nhomSuatTheoGio(showtimes = []) {
  return nhomTheoDinhDangVaGio(showtimes)
}

export function nhomSuatTheoDinhDang(showtimes = []) {
  return nhomTheoDinhDangVaGio(showtimes)
}
