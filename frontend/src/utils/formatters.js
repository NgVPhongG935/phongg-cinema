export const dinhDangTien = (soTien) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTien || 0)
export const dinhDangGiaNgan = (soTien) => {
  const so = Number(soTien) || 0
  if (so >= 1000) return `${Math.round(so / 1000)}K`
  return `${so}`
}
export const dinhDangNgay = (thoiGian) => thoiGian ? new Date(thoiGian).toLocaleString('vi-VN') : ''
export const dinhDangNgayGio = (thoiGian) => {
  if (!thoiGian) return ''
  return new Date(thoiGian).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
export const dinhDangGio = (thoiGian) => {
  if (!thoiGian) return ''
  const ngay = new Date(thoiGian)
  return `${String(ngay.getHours()).padStart(2, '0')}:${String(ngay.getMinutes()).padStart(2, '0')}`
}
export const dinhDangKhoangGio = (batDau, ketThuc) => {
  const gioBatDau = dinhDangGio(batDau)
  const gioKetThuc = dinhDangGio(ketThuc)
  if (!gioBatDau || !gioKetThuc) return gioBatDau || gioKetThuc
  return `${gioBatDau} - ${gioKetThuc}`
}
