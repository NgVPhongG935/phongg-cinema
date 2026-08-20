export const KHOA_VI_TRI = 'phongg_vi_tri_rap'
export const RAP_GAN_NHAT = 'GAN_NHAT'
export const KHOANG_CACH_TOI_DA_KM = 50

const BAN_KINH_TRAI_DAT_KM = 6371

export const docViTriDaLuu = () => {
  try {
    const duLieu = JSON.parse(localStorage.getItem(KHOA_VI_TRI) || 'null')
    if (!duLieu || typeof duLieu !== 'object') return null
    return duLieu
  } catch {
    return null
  }
}

export const luuViTri = (duLieu) => {
  localStorage.setItem(KHOA_VI_TRI, JSON.stringify({ ...duLieu, thoiGian: Date.now() }))
}

export const tinhKhoangCachKm = (viDo1, kinhDo1, viDo2, kinhDo2) => {
  if ([viDo1, kinhDo1, viDo2, kinhDo2].some((giaTri) => giaTri == null || Number.isNaN(Number(giaTri)))) return null
  const rad = (gocDo) => (gocDo * Math.PI) / 180
  const dViDo = rad(viDo2 - viDo1)
  const dKinhDo = rad(kinhDo2 - kinhDo1)
  const a = Math.sin(dViDo / 2) ** 2
    + Math.cos(rad(viDo1)) * Math.cos(rad(viDo2)) * Math.sin(dKinhDo / 2) ** 2
  return BAN_KINH_TRAI_DAT_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const dinhDangKhoangCach = (km) => {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

export const coToaDoRap = (rap) => rap?.viDo != null && rap?.kinhDo != null

export const ganKhoangCachRap = (rap, viTri) => {
  if (!viTri?.viDo || !coToaDoRap(rap)) return { ...rap, khoangCachKm: null }
  return {
    ...rap,
    khoangCachKm: tinhKhoangCachKm(viTri.viDo, viTri.kinhDo, rap.viDo, rap.kinhDo),
  }
}

export const sapXepRapTheoKhoangCach = (danhSachRap = [], viTri) => {
  if (!viTri?.viDo) return danhSachRap.map((rap) => ganKhoangCachRap(rap, viTri))
  return [...danhSachRap]
    .map((rap) => ganKhoangCachRap(rap, viTri))
    .filter((rap) => rap.khoangCachKm == null || rap.khoangCachKm <= KHOANG_CACH_TOI_DA_KM)
    .sort((a, b) => {
      if (a.khoangCachKm == null) return 1
      if (b.khoangCachKm == null) return -1
      return a.khoangCachKm - b.khoangCachKm
    })
}

export const layLinkChiDuong = (rap) => {
  if (coToaDoRap(rap)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${rap.viDo},${rap.kinhDo}`
  }
  if (rap?.diaChi) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rap.diaChi)}`
  }
  return null
}

export const yeuCauViTriGps = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Trình duyệt không hỗ trợ định vị.'))
    return
  }
  navigator.geolocation.getCurrentPosition(
    (viTri) => resolve({ viDo: viTri.coords.latitude, kinhDo: viTri.coords.longitude }),
    (loi) => reject(loi),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
  )
})
