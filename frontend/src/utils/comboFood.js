export const DANH_SACH_COMBO_MAC_DINH = [
  {
    ma: 'COMBO_1_PHIM',
    ten: 'Solo Combo',
    moTa: '1 Bắp + 1 Nước',
    chiTiet: ['1 Bắp ngọt', '1 Nước ngọt size M'],
    gia: 69000,
    icon: 'popcorn',
    hinhAnh: '',
    loai: 'COMBO',
  },
  {
    ma: 'COMBO_2_PHIM',
    ten: 'Sweet Combo 69oz',
    moTa: '1 Bắp Lớn + 2 Nước',
    chiTiet: ['1 Bắp lớn', '2 Nước ngọt size M'],
    gia: 99000,
    icon: 'couple',
    hinhAnh: '',
    loai: 'COMBO',
  },
  {
    ma: 'COMBO_GIA_DINH',
    ten: 'Family Combo',
    moTa: '2 Bắp + 4 Nước',
    chiTiet: ['2 Bắp lớn', '4 Nước ngọt size M'],
    gia: 159000,
    icon: 'family',
    hinhAnh: '',
    loai: 'COMBO',
  },
]

export const chuyenComboTuApi = (combo) => ({
  ma: combo.maCombo,
  ten: combo.tenCombo,
  moTa: combo.moTa || '',
  chiTiet: combo.moTa ? combo.moTa.split(/[,+]/).map((m) => m.trim()).filter(Boolean) : [],
  gia: Number(combo.giaTien) || 0,
  icon: combo.loai === 'BAP' ? 'popcorn' : combo.loai === 'NUOC' ? 'couple' : 'family',
  hinhAnh: combo.hinhAnh || '',
  loai: combo.loai,
})

export const taoSoLuongComboRong = (danhSach = DANH_SACH_COMBO_MAC_DINH) =>
  Object.fromEntries(danhSach.map((combo) => [combo.ma, 0]))

export const tinhTienCombo = (soLuongTheoMa = {}, danhSach = DANH_SACH_COMBO_MAC_DINH) => danhSach.reduce(
  (tong, combo) => tong + (soLuongTheoMa[combo.ma] || 0) * combo.gia,
  0,
)

export const taoDanhSachComboDat = (soLuongTheoMa = {}, danhSach = DANH_SACH_COMBO_MAC_DINH) => danhSach
  .filter((combo) => (soLuongTheoMa[combo.ma] || 0) > 0)
  .map((combo) => ({
    maCombo: combo.ma,
    tenCombo: combo.ten,
    soLuong: soLuongTheoMa[combo.ma],
    donGia: combo.gia,
  }))

export const demTongSoCombo = (soLuongTheoMa = {}) => Object.values(soLuongTheoMa).reduce((tong, sl) => tong + (sl || 0), 0)
