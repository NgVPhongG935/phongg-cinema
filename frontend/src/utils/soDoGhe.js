export const GIA_CO_BAN = 90000
export const SO_COT = 20
export const KHU_VUC_COT = [[1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], [17, 18, 19, 20]]

export const CONG_CU_GHE = {
  STANDARD: { nhan: 'Thường', mau: 'bg-purple-600' },
  VIP: { nhan: 'VIP', mau: 'bg-red-600' },
  COUPLE: { nhan: 'Ghế đôi', mau: 'bg-pink-600' },
  ERASER: { nhan: 'Xóa ô', mau: 'bg-slate-700' },
}

export const phuThuTheoLoai = (loaiGhe) => {
  if (loaiGhe === 'VIP') return 20000
  if (loaiGhe === 'COUPLE') return 80000
  return 0
}

export const giaGheTheoLoai = (loaiGhe) => GIA_CO_BAN + phuThuTheoLoai(loaiGhe)

const parseSoGhe = (soGhe) => {
  const khop = String(soGhe).match(/^([A-Z]+)(\d+)$/)
  if (!khop) return { hang: 'A', so: 1 }
  return { hang: khop[1], so: parseInt(khop[2], 10) }
}

export const taoHangRong = (hang) => ({ hang, cot: Array(SO_COT).fill(null) })

export const mauCoBan = () => {
  const luoi = []
  for (let i = 0; i < 5; i++) luoi.push(taoHangRong(String.fromCharCode(65 + i)))
  luoi.forEach((hang) => {
    for (let so = 0; so < 10; so++) hang.cot[so] = 'STANDARD'
  })
  return luoi
}

export const mauTieuChuan = () => {
  const danhSachGhe = []
  for (let hang = 65; hang <= 67; hang++) {
    for (let so = 1; so <= 20; so++) danhSachGhe.push({ soGhe: `${String.fromCharCode(hang)}${so}`, loaiGhe: 'STANDARD' })
  }
  for (let hang = 68; hang <= 75; hang++) {
    for (let so = 1; so <= 20; so++) {
      danhSachGhe.push({ soGhe: `${String.fromCharCode(hang)}${so}`, loaiGhe: so >= 4 && so <= 17 ? 'VIP' : 'STANDARD' })
    }
  }
  for (let so = 1; so <= 16; so += 2) {
    danhSachGhe.push({ soGhe: `L${so}`, loaiGhe: 'COUPLE' })
    danhSachGhe.push({ soGhe: `L${so + 1}`, loaiGhe: 'COUPLE' })
  }
  return gheSangLuoi(danhSachGhe)
}

export const gheSangLuoi = (danhSachGhe = []) => {
  const hangMap = {}
  danhSachGhe.forEach((ghe) => {
    const { hang, so } = parseSoGhe(ghe.soGhe)
    if (!hangMap[hang]) hangMap[hang] = Array(SO_COT).fill(null)
    if (so >= 1 && so <= SO_COT) hangMap[hang][so - 1] = ghe.loaiGhe
  })
  if (Object.keys(hangMap).length === 0) return [taoHangRong('A')]
  return Object.keys(hangMap).sort().map((hang) => ({ hang, cot: hangMap[hang] }))
}

export const luoiSangGhe = (luoi) => {
  const danhSachGhe = []
  luoi.forEach(({ hang, cot }) => {
    cot.forEach((loai, idx) => {
      if (!loai) return
      danhSachGhe.push({
        soGhe: `${hang}${idx + 1}`,
        loaiGhe: loai,
        giaVe: giaGheTheoLoai(loai),
      })
    })
  })
  return danhSachGhe
}

export const demGhe = (luoi) => luoiSangGhe(luoi).length

export const chuanHoaGheDatVe = (ghe, giaVeTu) => {
  const soGhe = ghe?.seatNumber || ghe?.soGhe || ''
  const loaiGhe = ghe?.seatType || ghe?.loaiGhe || 'STANDARD'
  const trangThai = ghe?.status || ghe?.trangThai || 'AVAILABLE'
  const phuThu = ghe?.surcharge ?? ghe?.phuThu ?? 0
  const giaGhe = ghe?.price ?? ghe?.giaGhe ?? (Number(giaVeTu || 0) + phuThu)
  return {
    ...ghe,
    soGhe,
    seatNumber: soGhe,
    loaiGhe,
    seatType: loaiGhe,
    trangThai,
    status: trangThai,
    phuThu,
    surcharge: phuThu,
    giaGhe,
    price: giaGhe,
  }
}

export const layCapGheDoi = (soGhe) => {
  const so = parseInt(String(soGhe).replace(/^L/, ''), 10)
  const soDoi = so % 2 === 0 ? so - 1 : so + 1
  return [`L${so}`, `L${soDoi}`]
}

export const nhomGheTheoHang = (danhSachGhe) => {
  const hangMap = {}
  danhSachGhe.forEach((ghe) => {
    const { hang } = parseSoGhe(ghe.seatNumber || ghe.soGhe)
    if (!hangMap[hang]) hangMap[hang] = []
    hangMap[hang].push(chuanHoaGheDatVe(ghe))
  })
  return Object.keys(hangMap).sort().map((hang) => ({
    hang,
    danhSachGhe: hangMap[hang].sort((a, b) => parseSoGhe(a.seatNumber || a.soGhe).so - parseSoGhe(b.seatNumber || b.soGhe).so),
  }))
}
