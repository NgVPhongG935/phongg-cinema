function chuanHoaGio(item) {
  const raw = item?.startTime || item?.thoiGianBatDau || ''
  const d = raw ? new Date(raw) : null
  if (d && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 16)
  return String(raw)
}

export function khoaSuatChieu(item) {
  const gio = chuanHoaGio(item)
  const phong = item?.roomId || item?.maPhong || ''
  if (gio || phong) return `${gio}|${phong}`
  return String(item?.id || item?._id || Math.random())
}

export function locSuatChieuDuyNhat(showtimes = []) {
  const uniqueShowtimes = Array.from(
    new Map(showtimes.map((item) => [khoaSuatChieu(item), item])).values(),
  ).sort(
    (a, b) =>
      new Date(a.startTime || a.thoiGianBatDau) - new Date(b.startTime || b.thoiGianBatDau),
  )
  return uniqueShowtimes
}

export function nhomSuatTheoDinhDang(showtimes = []) {
  return locSuatChieuDuyNhat(showtimes).reduce((ketQua, suat) => {
    const khoa = suat.format || suat.dinhDang || '2D Lồng Tiếng'
    if (!ketQua[khoa]) ketQua[khoa] = []
    ketQua[khoa].push(suat)
    return ketQua
  }, {})
}

/** Nhóm Phim/Rạp/Ngày/Định dạng → khung giờ, phòng là chip con. */
export function nhomSuatTheoGio(showtimes = []) {
  const map = new Map()
  for (const suat of locSuatChieuDuyNhat(showtimes)) {
    const dinhDang = suat.format || suat.dinhDang || '2D Lồng Tiếng'
    const gio = chuanHoaGio(suat)
    const khoa = `${dinhDang}|${gio}`
    if (!map.has(khoa)) {
      map.set(khoa, {
        dinhDang,
        gioKey: gio,
        startTime: suat.startTime || suat.thoiGianBatDau,
        endTime: suat.endTime || suat.thoiGianKetThuc,
        price: suat.price ?? suat.giaVeTu,
        phong: [],
      })
    }
    map.get(khoa).phong.push(suat)
  }
  const theoDinhDang = {}
  for (const nhom of map.values()) {
    if (!theoDinhDang[nhom.dinhDang]) theoDinhDang[nhom.dinhDang] = []
    theoDinhDang[nhom.dinhDang].push(nhom)
  }
  for (const ds of Object.values(theoDinhDang)) {
    ds.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }
  return theoDinhDang
}

export function tenPhongSuat(suat) {
  return suat?.roomId || suat?.maPhong || suat?.tenPhong || ''
}
