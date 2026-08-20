export const MAC_DINH_PHAN_TRAM_VIP = 25
export const MAC_DINH_PHAN_TRAM_COUPLE = 80

export const lamTronNghin = (gia) => Math.round(Number(gia || 0) / 1000) * 1000

export const layPhanTramVip = (rap) => rap?.phanTramGheVip ?? MAC_DINH_PHAN_TRAM_VIP
export const layPhanTramCouple = (rap) => rap?.phanTramGheCouple ?? MAC_DINH_PHAN_TRAM_COUPLE

export const tinhGiaTheoPhanTram = (giaVeTu, phanTram) => lamTronNghin(Number(giaVeTu || 0) * (1 + Number(phanTram || 0) / 100))

export const tinhGiaGhe = (giaVeTu, loaiGhe, rap) => {
  const gia = Number(giaVeTu || 0)
  if (!gia) return 0
  if (loaiGhe === 'VIP') return tinhGiaTheoPhanTram(gia, layPhanTramVip(rap))
  if (loaiGhe === 'COUPLE') return tinhGiaTheoPhanTram(gia, layPhanTramCouple(rap))
  return lamTronNghin(gia)
}

export const phuThuTheoLoaiVaRap = (giaVeTu, loaiGhe, rap) => tinhGiaGhe(giaVeTu, loaiGhe, rap) - lamTronNghin(giaVeTu)
