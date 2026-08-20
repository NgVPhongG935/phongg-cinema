/** Geocoding qua OpenStreetMap Nominatim (miễn phí) */

const TU_TIENG_ANH_LOAI_BO = /\b(street|st\.?|mall|tower|building|bldg|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?|lane|ln\.?|district|ward)\b/gi

const MAP_VIET_TAT = {
  hcmc: 'Hồ Chí Minh',
  hcm: 'Hồ Chí Minh',
  saigon: 'Hồ Chí Minh',
  sg: 'Hồ Chí Minh',
  hn: 'Hà Nội',
  hanoi: 'Hà Nội',
  dn: 'Đà Nẵng',
  danang: 'Đà Nẵng',
}

const MAP_TEN_DUONG = {
  'cao lo': 'Cao Lỗ',
  'cao lỗ': 'Cao Lỗ',
}

const MAP_PHUONG_QUAN = {
  'bình hưng': 'Quận 8',
  'binh hung': 'Quận 8',
}

const THANH_PHO_KNOWN = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']

export const lamSachDiaChi = (chuoi) => {
  if (!chuoi) return ''
  let s = chuoi.trim()

  const phanCoSoNha = s.split(',').map((p) => p.trim()).find((p) => /^\d/.test(p))
  if (phanCoSoNha) s = phanCoSoNha

  s = s.replace(TU_TIENG_ANH_LOAI_BO, ' ')

  for (const [vietTat, dayDu] of Object.entries(MAP_VIET_TAT)) {
    s = s.replace(new RegExp(`\\b${vietTat}\\b`, 'gi'), dayDu)
  }
  for (const [sai, dung] of Object.entries(MAP_TEN_DUONG)) {
    s = s.replace(new RegExp(sai, 'gi'), dung)
  }

  const phuong = Object.keys(MAP_PHUONG_QUAN).find((k) => s.toLowerCase().includes(k))
  if (phuong) {
    const quan = MAP_PHUONG_QUAN[phuong]
    if (!s.toLowerCase().includes(quan.toLowerCase())) {
      s = `${s}, ${quan}`
    }
  }

  const thanhPho = trichThanhPho(s)
  if (thanhPho && !s.toLowerCase().includes(thanhPho.toLowerCase())) {
    s = `${s}, ${thanhPho}`
  }

  return s.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/,\s*$/g, '').trim()
}

export const trichThanhPho = (chuoi) => {
  const s = chuoi.toLowerCase()
  for (const tp of THANH_PHO_KNOWN) {
    if (s.includes(tp.toLowerCase())) return tp
  }
  for (const dayDu of Object.values(MAP_VIET_TAT)) {
    if (s.includes(dayDu.toLowerCase())) return dayDu
  }
  return null
}

export const trichTenDuong = (diaChiSach) => {
  const match = diaChiSach.match(/\d+\s+([^,]+)/)
  if (!match) return null

  let ten = match[1].trim()
  for (const tp of THANH_PHO_KNOWN) {
    ten = ten.replace(new RegExp(tp, 'gi'), '')
  }
  for (const key of Object.keys(MAP_PHUONG_QUAN)) {
    ten = ten.replace(new RegExp(key, 'gi'), '')
  }
  ten = ten.replace(/\b(phường|p\.|quận|q\.)\b/gi, '').replace(/\s+/g, ' ').trim()

  for (const [sai, dung] of Object.entries(MAP_TEN_DUONG)) {
    if (ten.toLowerCase().includes(sai)) return dung
  }

  const tu = ten.split(/\s+/).filter(Boolean)
  return tu.slice(0, 3).join(' ') || null
}

export const taoCacCapDoTimKiem = (tenRap, diaChi) => {
  const diaChiSach = lamSachDiaChi(diaChi)
  const thanhPho = trichThanhPho(diaChiSach) || trichThanhPho(diaChi) || 'Hồ Chí Minh'
  const tenDuong = trichTenDuong(diaChiSach)

  const capDo = [
    { cap: 1, query: diaChiSach },
    { cap: 2, query: [tenRap?.trim(), thanhPho].filter(Boolean).join(', ') },
    { cap: 3, query: [tenDuong, thanhPho].filter(Boolean).join(', ') },
  ]

  const daThay = new Set()
  return capDo.filter(({ query }) => {
    const khoa = query.trim().toLowerCase()
    if (!khoa || daThay.has(khoa)) return false
    daThay.add(khoa)
    return true
  })
}

export const timToaDoTuDiaChi = async (chuoiTimKiem) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(chuoiTimKiem)}&format=json&limit=1&countrycodes=vn`
  const phanHoi = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!phanHoi.ok) throw new Error('Không thể kết nối dịch vụ bản đồ.')
  return phanHoi.json()
}

export const timToaDoThongMinh = async (tenRap, diaChi) => {
  const cacCapDo = taoCacCapDoTimKiem(tenRap, diaChi)

  for (const { cap, query } of cacCapDo) {
    try {
      const ketQua = await timToaDoTuDiaChi(query)

      if (ketQua?.length) {
        return { lat: ketQua[0].lat, lon: ketQua[0].lon, capDo: cap, query }
      }
    } catch {
      // thử cấp fallback tiếp theo
    }
  }

  return null
}
