export const DANH_SACH_THE_LOAI = [

  { ma: 'TAT_CA', nhan: 'Tất cả' },

  { ma: 'HANH_DONG', nhan: 'Hành động', tuKhoa: ['Hành động', 'Hành Động'] },

  { ma: 'TINH_CAM', nhan: 'Tình cảm', tuKhoa: ['Tình cảm', 'Tình Cảm', 'Lãng mạn'] },

  { ma: 'HAI_HUOC', nhan: 'Hài hước', tuKhoa: ['Hài', 'Hài hước', 'Hài Hước'] },

  { ma: 'CO_TRANG', nhan: 'Cổ trang', tuKhoa: ['Cổ trang', 'Cổ Trang'] },

  { ma: 'TAM_LY', nhan: 'Tâm lý', tuKhoa: ['Tâm lý', 'Tâm Lý'] },

  { ma: 'HINH_SU', nhan: 'Hình sự', tuKhoa: ['Hình sự', 'Hình Sự', 'Tội phạm'] },

  { ma: 'CHIEN_TRANH', nhan: 'Chiến tranh', tuKhoa: ['Chiến tranh', 'Chiến Tranh', 'Lịch sử'] },

  { ma: 'THE_THAO', nhan: 'Thể thao', tuKhoa: ['Thể thao', 'Thể Thao'] },

  { ma: 'VO_THUAT', nhan: 'Võ thuật', tuKhoa: ['Võ thuật', 'Võ Thuật'] },

  { ma: 'HOAT_HINH', nhan: 'Hoạt hình', tuKhoa: ['Hoạt hình', 'Hoạt Hình'] },

  { ma: 'KINH_DI', nhan: 'Kinh dị', tuKhoa: ['Kinh dị', 'Kinh Dị', 'Horror'] },

  { ma: 'PHIEU_LUU', nhan: 'Phiêu lưu', tuKhoa: ['Phiêu lưu', 'Phiêu Lưu'] },

  { ma: 'GIA_DINH', nhan: 'Gia đình', tuKhoa: ['Gia đình', 'Gia Đình'] },

  { ma: 'KHOA_HOC', nhan: 'Khoa học viễn tưởng', tuKhoa: ['Khoa học viễn tưởng', 'Khoa Học Viễn Tưởng'] },

]



export const DANH_SACH_DINH_DANG = [

  { ma: 'TAT_CA', nhan: 'Tất cả' },

  { ma: '2D Lồng Tiếng', nhan: '2D Lồng Tiếng' },

  { ma: '2D Phụ Đề', nhan: '2D Phụ Đề' },

  { ma: '2D', nhan: '2D' },

  { ma: '3D', nhan: '3D' },

  { ma: 'IMAX', nhan: 'IMAX' },

]



export const DANH_SACH_DO_TUOI = [

  { ma: 'TAT_CA', nhan: 'Tất cả' },

  { ma: 'P', nhan: 'P (Mọi lứa tuổi)' },

  { ma: 'K', nhan: 'K' },

  { ma: '13', nhan: '13+' },

  { ma: '16', nhan: '16+' },

  { ma: '18', nhan: '18+' },

]



export const KIEU_SAP_XEP = {

  MOI_NHAT: 'MOI_NHAT',

  PHO_BIEN: 'PHO_BIEN',

  DANH_GIA: 'DANH_GIA',

}



export { RAP_GAN_NHAT } from './viTriRap'



export const taoDanhSachRap = (danhSachRap = []) => [
  { ma: 'TAT_CA', nhan: 'Tất cả rạp' },
  { ma: 'GAN_NHAT', nhan: '📍 Rạp gần nhất (Dùng GPS)' },
  ...danhSachRap.map((rap) => ({ ma: rap.id, nhan: rap.khuVuc ? `${rap.khuVuc} · ${rap.tenRap}` : rap.tenRap })),
]



export const chuanHoaDoTuoi = (tuoi) => {

  if (!tuoi) return ''

  const chuoi = String(tuoi).trim().toUpperCase()

  if (chuoi.startsWith('C') && /^\d+$/.test(chuoi.slice(1))) return chuoi.slice(1)

  return chuoi

}



export const hienThiDoTuoi = (tuoi) => {

  const daChuanHoa = chuanHoaDoTuoi(tuoi)

  if (!daChuanHoa) return ''

  if (daChuanHoa === 'P' || daChuanHoa === 'K') return daChuanHoa

  if (/^\d+$/.test(daChuanHoa)) return daChuanHoa

  return daChuanHoa

}



export const hienThiDoTuoiDayDu = (tuoi) => {

  const daChuanHoa = hienThiDoTuoi(tuoi)

  if (/^\d+$/.test(daChuanHoa)) return `${daChuanHoa}+`

  return daChuanHoa

}



const bamHash = (chuoi = '') => [...chuoi].reduce((tong, kyTu) => tong + kyTu.charCodeAt(0), 0)



export const CHI_SO_LOC_RONG = { rapTheoPhim: {}, dinhDangTheoPhim: {} }



export const ganMetaPhim = (phim, chiSoLocPhim = CHI_SO_LOC_RONG) => {
  const title = phim.title || phim.tenPhim || ''
  const hash = bamHash(phim.id || title)
  const dinhDangs = chiSoLocPhim?.dinhDangTheoPhim?.[phim.id] || []
  const duration = phim.duration ?? phim.thoiLuong ?? 90
  const ratingCalculated = Number((7 + (hash % 26) / 10).toFixed(1))
  const rating = phim.rating ?? ratingCalculated

  return {
    ...phim,
    title,
    genres: phim.genres || phim.theLoai || [],
    duration,
    ageRating: phim.ageRating || phim.doTuoi || 'P',
    posterUrl: phim.posterUrl || phim.anhPoster || '',
    trailerUrl: phim.trailerUrl || phim.urlTrailer || '',
    description: phim.description || phim.moTa || '',
    dinhDang: dinhDangs[0] || '2D Lồng Tiếng',
    danhSachDinhDang: dinhDangs,
    rating,
    mucPhoBien: duration + (hash % 40),
  }
}

const khopTheLoai = (phim, maTheLoai) => {
  if (maTheLoai === 'TAT_CA') return true
  const muc = DANH_SACH_THE_LOAI.find((item) => item.ma === maTheLoai)
  if (!muc?.tuKhoa) return true
  const theLoais = phim.genres || []
  return theLoais.some((theLoai) => muc.tuKhoa.some((tuKhoa) => theLoai.toLowerCase().includes(tuKhoa.toLowerCase())))
}

const khopRap = (phim, maRap, chiSoLocPhim) => {
  if (maRap === 'TAT_CA') return true
  const rapCuaPhim = chiSoLocPhim?.rapTheoPhim?.[phim.id] || []
  return rapCuaPhim.includes(maRap)
}

const khopDinhDang = (phim, maDinhDang, chiSoLocPhim) => {
  if (maDinhDang === 'TAT_CA') return true
  const dinhDangs = chiSoLocPhim?.dinhDangTheoPhim?.[phim.id] || phim.danhSachDinhDang || []
  return dinhDangs.includes(maDinhDang)
}

const khopDoTuoi = (phim, maDoTuoi) => {
  if (maDoTuoi === 'TAT_CA') return true
  return chuanHoaDoTuoi(phim.ageRating) === chuanHoaDoTuoi(maDoTuoi)
}



const coTrailer = (phim) => {
  const trailer = phim?.trailerUrl || ''
  return Boolean(String(trailer).trim())
}

const sapXepPhim = (danhSach, kieuSapXep) => {
  const saoChep = [...danhSach]

  return saoChep.sort((a, b) => {
    const trailerA = coTrailer(a)
    const trailerB = coTrailer(b)

    // Cấp 1: Phim có trailer lên trước
    if (trailerA !== trailerB) {
      return trailerB ? 1 : -1
    }

    // Cấp 2: Phổ biến
    if (kieuSapXep === KIEU_SAP_XEP.PHO_BIEN) {
      return (b.mucPhoBien ?? 0) - (a.mucPhoBien ?? 0)
    }

    // Cấp 2: Điểm đánh giá cao hơn lên trước
    if (kieuSapXep === KIEU_SAP_XEP.DANH_GIA) {
      const diemA = parseFloat(a.rating ?? 0)
      const diemB = parseFloat(b.rating ?? 0)
      if (diemB !== diemA) return diemB - diemA
    }

    // Mặc định MOI_NHAT: Điểm đánh giá cao hơn lên trước, sau đó tới ID mới hơn
    const diemA = parseFloat(a.rating ?? 0)
    const diemB = parseFloat(b.rating ?? 0)
    if (diemB !== diemA) return diemB - diemA

    return (b.id || '').localeCompare(a.id || '')
  })
}



export const locVaSapXepPhim = (

  danhSachPhim,

  { theLoaiDuocChon, rapDuocChon, dinhDangDuocChon, doTuoiDuocChon, kieuSapXep, rapGanNhatId },

  chiSoLocPhim = CHI_SO_LOC_RONG,

) => {

  const maRapLoc = rapDuocChon === 'GAN_NHAT' ? rapGanNhatId : rapDuocChon

  const daGanMeta = danhSachPhim.map((phim) => ganMetaPhim(phim, chiSoLocPhim))

  const daLoc = daGanMeta.filter((phim) =>

    khopTheLoai(phim, theLoaiDuocChon)

    && khopRap(phim, maRapLoc, chiSoLocPhim)

    && khopDinhDang(phim, dinhDangDuocChon, chiSoLocPhim)

    && khopDoTuoi(phim, doTuoiDuocChon),

  )

  return sapXepPhim(daLoc, kieuSapXep)

}



export const layNhanMuc = (danhSach, ma) => danhSach.find((muc) => muc.ma === ma)?.nhan || 'Tất cả'

