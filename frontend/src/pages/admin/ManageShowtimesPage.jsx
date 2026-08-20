import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import { CalendarPlus, Layers, Loader2, Pencil, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { layDanhSachPhim } from '../../services/movieService'
import { capNhatSuatChieu, goiYXepLichAi, goiYSuatChieu, layDanhSachRap, layLichSuSuatChieu, taoHangLoatSuatChieu, taoSuatChieu, xoaSuatChieu } from '../../services/showtimeService'
import { dinhDangGiaNgan, dinhDangKhoangGio, dinhDangNgay, dinhDangTien } from '../../utils/formatters'
import { lamTronNghin, tinhGiaGhe } from '../../utils/tinhGiaVe'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const DINH_DANG_MAC_DINH = ['2D Lồng Tiếng', '2D Phụ Đề', '3D']
const DU_LIEU_RONG = { maPhim: '', maRap: '', maPhong: '', thoiGianBatDau: '', thoiGianKetThuc: '', giaVeTu: '69000', dinhDang: '2D Lồng Tiếng' }
const HANG_LOAT_RONG = {
  maPhim: '', maRap: '', maPhong: '', dinhDang: '2D Lồng Tiếng',
  tuNgay: new Date().toISOString().slice(0, 10),
  denNgay: new Date().toISOString().slice(0, 10),
  tuGio: '09:00', denGio: '23:45',
  thoiGianNghiPhut: '15', buocLamTronPhut: '15',
  giaVeTuNgay: '69000', giaVeTuToi: '75000', gioApGiaToi: '18',
}
const AI_RONG = {
  maRap: '',
  ngayChieu: new Date().toISOString().slice(0, 10),
  dinhDang: '2D Lồng Tiếng',
  danhSachMaPhim: [],
}

const GIOI_HAN_PHIM_AI = 8

const chuyenLocalDatetime = (thoiGian) => {
  if (!thoiGian) return ''
  const ngay = new Date(thoiGian)
  const pad = (n) => String(n).padStart(2, '0')
  return `${ngay.getFullYear()}-${pad(ngay.getMonth() + 1)}-${pad(ngay.getDate())}T${pad(ngay.getHours())}:${pad(ngay.getMinutes())}`
}

export default function ManageShowtimesPage() {
  const [danhSachPhim, datDanhSachPhim] = useState([])
  const [danhSachRap, datDanhSachRap] = useState([])
  const [lichSu, datLichSu] = useState([])
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)
  const [hangLoat, datHangLoat] = useState(HANG_LOAT_RONG)
  const [goiY, datGoiY] = useState([])
  const [daChon, datDaChon] = useState(new Set())
  const [suatSua, datSuatSua] = useState(null)
  const [dangMo, datDangMo] = useState(false)
  const [dangMoHangLoat, datDangMoHangLoat] = useState(false)
  const [dangMoAi, datDangMoAi] = useState(false)
  const [aiDuLieu, datAiDuLieu] = useState(AI_RONG)
  const [goiYAi, datGoiYAi] = useState([])
  const [daChonAi, datDaChonAi] = useState(new Set())
  const [nguonAi, datNguonAi] = useState('')
  const [dangXuLyAi, datDangXuLyAi] = useState(false)
  const [tuKhoa, datTuKhoa] = useState('')
  const [locRap, datLocRap] = useState('')
  const [locPhim, datLocPhim] = useState('')
  const [thongBaoAi, datThongBaoAi] = useState('')
  const [thongBao, datThongBao] = useState('')
  const vungKetQuaAiRef = useRef(null)

  const taiDuLieu = () => {
    layDanhSachPhim({ size: 100 }).then((phanHoi) => datDanhSachPhim(phanHoi.content || phanHoi))
    layDanhSachRap().then(datDanhSachRap)
    layLichSuSuatChieu().then(datLichSu).catch(() => datLichSu([]))
  }

  useEffect(() => { taiDuLieu() }, [])

  const rapDaChon = danhSachRap.find((rap) => rap.id === duLieu.maRap)
  const giaVeTuNhap = Number(duLieu.giaVeTu) || 0
  const giaThuongPreview = lamTronNghin(giaVeTuNhap)
  const giaVipPreview = tinhGiaGhe(giaVeTuNhap, 'VIP', rapDaChon)
  const giaCouplePreview = tinhGiaGhe(giaVeTuNhap, 'COUPLE', rapDaChon)
  const rapHangLoat = danhSachRap.find((rap) => rap.id === hangLoat.maRap)
  const rapAi = danhSachRap.find((rap) => rap.id === aiDuLieu.maRap)
  const phimHangLoat = danhSachPhim.find((p) => p.id === hangLoat.maPhim)

  const suatDaCoTheoPhong = useMemo(() => {
    if (!hangLoat.maRap || !hangLoat.maPhong || !hangLoat.tuNgay || !hangLoat.denNgay) return []
    const tu = new Date(`${hangLoat.tuNgay}T00:00:00`)
    const den = new Date(`${hangLoat.denNgay}T23:59:59`)
    return lichSu
      .filter((suat) => suat.maRap === hangLoat.maRap && suat.maPhong === hangLoat.maPhong)
      .filter((suat) => {
        const thoiGian = new Date(suat.thoiGianBatDau)
        return thoiGian >= tu && thoiGian <= den
      })
      .sort((a, b) => new Date(a.thoiGianBatDau) - new Date(b.thoiGianBatDau))
  }, [lichSu, hangLoat.maRap, hangLoat.maPhong, hangLoat.tuNgay, hangLoat.denNgay])

  const suatDaCoNhomNgay = useMemo(() => suatDaCoTheoPhong.reduce((kq, suat) => {
    const ngay = suat.thoiGianBatDau.slice(0, 10)
    if (!kq[ngay]) kq[ngay] = []
    kq[ngay].push(suat)
    return kq
  }, {}), [suatDaCoTheoPhong])

  const goiYNhomNgay = useMemo(() => goiY.reduce((kq, suat) => {
    const khoa = suat.ngay
    if (!kq[khoa]) kq[khoa] = []
    kq[khoa].push(suat)
    return kq
  }, {}), [goiY])

  const lichSuLoc = useMemo(() => {
    const chuoi = tuKhoa.trim().toLowerCase()
    return lichSu.filter((suat) => {
      if (locRap && suat.maRap !== locRap) return false
      if (locPhim && suat.maPhim !== locPhim) return false
      if (!chuoi) return true
      const vanBan = [
        suat.movieTitle || suat.title,
        suat.tenRap,
        suat.maPhong,
        suat.dinhDang,
        dinhDangNgay(suat.thoiGianBatDau),
      ].join(' ').toLowerCase()
      return vanBan.includes(chuoi)
    })
  }, [lichSu, tuKhoa, locRap, locPhim])

  const xuLyThayDoi = (suKien) => datDuLieu((cu) => ({ ...cu, [suKien.target.name]: suKien.target.value, ...(suKien.target.name === 'maRap' ? { maPhong: '' } : {}) }))
  const xuLyHangLoat = (suKien) => datHangLoat((cu) => ({ ...cu, [suKien.target.name]: suKien.target.value, ...(suKien.target.name === 'maRap' ? { maPhong: '' } : {}) }))

  const moBieuMau = (suat = null) => {
    datSuatSua(suat)
    datThongBao('')
    if (suat) {
      datDuLieu({
        maPhim: suat.maPhim, maRap: suat.maRap, maPhong: suat.maPhong,
        thoiGianBatDau: chuyenLocalDatetime(suat.thoiGianBatDau),
        thoiGianKetThuc: chuyenLocalDatetime(suat.thoiGianKetThuc),
        giaVeTu: String(suat.giaVeTu || 69000), dinhDang: suat.dinhDang || '2D Lồng Tiếng',
      })
    } else datDuLieu(DU_LIEU_RONG)
    datDangMo(true)
  }

  const moHangLoat = () => {
    datThongBao('')
    datGoiY([])
    datDaChon(new Set())
    datHangLoat(HANG_LOAT_RONG)
    datDangMoHangLoat(true)
  }

  const moAiXepLich = () => {
    datThongBao('')
    datThongBaoAi('')
    datGoiYAi([])
    datDaChonAi(new Set())
    datNguonAi('')
    const phimHot = danhSachPhim.filter((p) => p.trangThai === 'SHOWING').map((p) => p.id)
    const macDinh = phimHot.length ? phimHot.slice(0, GIOI_HAN_PHIM_AI) : danhSachPhim.slice(0, 3).map((p) => p.id)
    datAiDuLieu({
      ...AI_RONG,
      maRap: danhSachRap[0]?.id || '',
      danhSachMaPhim: macDinh,
    })
    datDangMoAi(true)
  }

  const chuyenDoiPhimAi = (maPhim) => {
    datAiDuLieu((cu) => {
      const daCo = cu.danhSachMaPhim.includes(maPhim)
      if (!daCo && cu.danhSachMaPhim.length >= GIOI_HAN_PHIM_AI) {
        datThongBaoAi(`Chỉ chọn tối đa ${GIOI_HAN_PHIM_AI} phim để xếp lịch hiệu quả.`)
        return cu
      }
      return {
        ...cu,
        danhSachMaPhim: daCo
          ? cu.danhSachMaPhim.filter((id) => id !== maPhim)
          : [...cu.danhSachMaPhim, maPhim],
      }
    })
  }

  const taoLichAi = async () => {
    if (!aiDuLieu.maRap) { datThongBaoAi('Chọn rạp trước khi xếp lịch.'); return }
    if (!aiDuLieu.danhSachMaPhim.length) { datThongBaoAi('Chọn ít nhất một phim.'); return }
    if (aiDuLieu.danhSachMaPhim.length > GIOI_HAN_PHIM_AI) {
      datThongBaoAi(`Chọn tối đa ${GIOI_HAN_PHIM_AI} phim để AI xếp lịch nhanh và chính xác hơn.`)
      return
    }
    datDangXuLyAi(true)
    datThongBaoAi('Đang gọi AI xếp lịch, vui lòng chờ...')
    try {
      const ketQua = await goiYXepLichAi({
        maRap: aiDuLieu.maRap,
        ngayChieu: aiDuLieu.ngayChieu,
        dinhDang: aiDuLieu.dinhDang,
        danhSachMaPhim: aiDuLieu.danhSachMaPhim,
      })
      const danhSach = ketQua.danhSachGoiY || []
      const khaDung = danhSach.filter((s) => !s.trungLich)
      datGoiYAi(danhSach)
      datDaChonAi(new Set(khaDung.map((s) => s.maKhoa)))
      datNguonAi(ketQua.nguon === 'GEMINI' ? 'Gemini AI' : 'Quy tắc thông minh')
      const soTrung = danhSach.length - khaDung.length
      datThongBaoAi(`AI gợi ý ${danhSach.length} suất (${khaDung.length} có thể áp dụng${soTrung ? `, ${soTrung} trùng lịch` : ''}). Cuộn xuống để xem chi tiết.`)
      setTimeout(() => vungKetQuaAiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (loi) {
      const maLoi = loi.response?.status
      if (maLoi === 404 || maLoi === 405) {
        datThongBaoAi('Backend chưa có API AI. Chạy stop-backend.cmd rồi start-backend.cmd để khởi động lại.')
      } else if (loi.code === 'ECONNABORTED' || /timeout/i.test(loi.message || '')) {
        datThongBaoAi('Hết thời gian chờ AI. Thử chọn ít phim hơn hoặc khởi động lại backend.')
      } else {
        datThongBaoAi(layThongBaoLoiApi(loi))
      }
    } finally {
      datDangXuLyAi(false)
    }
  }

  const chuyenDoiChonAi = (maKhoa) => {
    const suat = goiYAi.find((s) => s.maKhoa === maKhoa)
    if (suat?.trungLich) return
    datDaChonAi((cu) => {
      const moi = new Set(cu)
      if (moi.has(maKhoa)) moi.delete(maKhoa)
      else moi.add(maKhoa)
      return moi
    })
  }

  const apDungLichAi = async () => {
    const danhSachChon = goiYAi.filter((s) => daChonAi.has(s.maKhoa) && !s.trungLich)
    if (!danhSachChon.length) { datThongBao('Chọn ít nhất một suất không trùng lịch.'); return }
    datDangXuLyAi(true)
    try {
      const nhom = {}
      for (const suat of danhSachChon) {
        const khoa = `${suat.maPhim}|${suat.maPhong}`
        if (!nhom[khoa]) nhom[khoa] = { maPhim: suat.maPhim, maPhong: suat.maPhong, danhSachSuat: [] }
        nhom[khoa].danhSachSuat.push({
          thoiGianBatDau: suat.thoiGianBatDau,
          thoiGianKetThuc: suat.thoiGianKetThuc,
          giaVeTu: suat.giaVeTu,
        })
      }
      let tong = 0
      for (const g of Object.values(nhom)) {
        const ketQua = await taoHangLoatSuatChieu({
          maPhim: g.maPhim,
          maRap: aiDuLieu.maRap,
          maPhong: g.maPhong,
          dinhDang: aiDuLieu.dinhDang,
          danhSachSuat: g.danhSachSuat,
        })
        tong += ketQua.soLuong || 0
      }
      datThongBao(`Đã áp dụng ${tong} suất chiếu từ lịch AI.`)
      datDangMoAi(false)
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể áp dụng lịch AI.')
    } finally {
      datDangXuLyAi(false)
    }
  }

  const taoGoiY = async () => {
    if (!hangLoat.maPhim) { datThongBao('Chọn phim trước khi gợi ý suất.'); return }
    if (!hangLoat.maRap || !hangLoat.maPhong) { datThongBao('Chọn rạp và phòng trước khi gợi ý suất.'); return }
    try {
      const ketQua = await goiYSuatChieu({
        maPhim: hangLoat.maPhim,
        maRap: hangLoat.maRap,
        maPhong: hangLoat.maPhong,
        tuNgay: hangLoat.tuNgay,
        denNgay: hangLoat.denNgay,
        tuGio: hangLoat.tuGio,
        denGio: hangLoat.denGio,
        thoiGianNghiPhut: Number(hangLoat.thoiGianNghiPhut),
        buocLamTronPhut: Number(hangLoat.buocLamTronPhut),
        giaVeTuNgay: Number(hangLoat.giaVeTuNgay),
        giaVeTuToi: Number(hangLoat.giaVeTuToi),
        gioApGiaToi: Number(hangLoat.gioApGiaToi),
      })
      const khaDung = ketQua.filter((s) => !s.trungLich)
      datGoiY(ketQua)
      datDaChon(new Set(khaDung.map((s) => s.maKhoa)))
      const soTrung = ketQua.length - khaDung.length
      datThongBao(`Đã gợi ý ${ketQua.length} suất (${khaDung.length} có thể tạo${soTrung ? `, ${soTrung} trùng lịch phòng` : ''}).`)
    } catch (loi) {
      const maLoi = loi.response?.status
      if (maLoi === 405 || maLoi === 404) {
        datThongBao('Backend chưa cập nhật. Chạy stop-backend.cmd rồi start-backend.cmd để khởi động lại.')
      } else {
        datThongBao(loi.response?.data?.message || 'Không thể gợi ý suất chiếu.')
      }
    }
  }

  const chonTatCa = (chon) => datDaChon(chon ? new Set(goiY.filter((s) => !s.trungLich).map((s) => s.maKhoa)) : new Set())

  const chuyenDoiChon = (maKhoa) => {
    const suat = goiY.find((s) => s.maKhoa === maKhoa)
    if (suat?.trungLich) return
    datDaChon((cu) => {
      const moi = new Set(cu)
      if (moi.has(maKhoa)) moi.delete(maKhoa)
      else moi.add(maKhoa)
      return moi
    })
  }

  const taoHangLoat = async () => {
    if (!hangLoat.maRap || !hangLoat.maPhong) { datThongBao('Chọn rạp và phòng.'); return }
    const danhSachSuat = goiY.filter((s) => daChon.has(s.maKhoa) && !s.trungLich).map((s) => ({
      thoiGianBatDau: s.thoiGianBatDau,
      thoiGianKetThuc: s.thoiGianKetThuc,
      giaVeTu: s.giaVeTu,
    }))
    if (!danhSachSuat.length) { datThongBao('Chọn ít nhất 1 suất.'); return }
    try {
      const ketQua = await taoHangLoatSuatChieu({
        maPhim: hangLoat.maPhim,
        maRap: hangLoat.maRap,
        maPhong: hangLoat.maPhong,
        dinhDang: hangLoat.dinhDang,
        danhSachSuat,
      })
      datThongBao(`Đã tạo ${ketQua.soLuong} suất chiếu.`)
      datDangMoHangLoat(false)
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể tạo hàng loạt.')
    }
  }

  const luuSuatChieu = async (suKien) => {
    suKien.preventDefault()
    try {
      const duLieuGui = { ...duLieu, giaVeTu: Number(duLieu.giaVeTu) }
      if (suatSua) await capNhatSuatChieu(suatSua.id, duLieuGui)
      else await taoSuatChieu(duLieuGui)
      datThongBao(suatSua ? 'Cập nhật suất chiếu thành công.' : 'Tạo suất chiếu thành công.')
      datDangMo(false)
      datSuatSua(null)
      datDuLieu(DU_LIEU_RONG)
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể lưu suất chiếu.')
    }
  }

  const xoaSuat = async (id) => {
    if (!window.confirm('Xóa suất chiếu này?')) return
    try {
      await xoaSuatChieu(id)
      datThongBao('Đã xóa suất chiếu.')
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể xóa suất chiếu (có thể đã có vé đặt).')
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Suất chiếu</h1>
          <p className="mt-1 text-slate-400">Tạo đơn lẻ, tạo hàng loạt, sửa/xóa lịch sử</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={moAiXepLich}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-4 py-2.5 font-semibold text-white shadow-[0_0_18px_rgba(168,85,247,0.45)] transition hover:shadow-[0_0_28px_rgba(168,85,247,0.65)] hover:brightness-110"
          >
            <Sparkles size={18} />✨ AI Xếp Lịch Tự Động
          </button>
          <button type="button" onClick={moHangLoat} className="nut-chinh flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700"><Layers size={18} />Tạo hàng loạt</button>
          <button type="button" onClick={() => moBieuMau()} className="nut-chinh flex items-center gap-2"><CalendarPlus size={18} />Thêm 1 suất</button>
        </div>
      </div>

      {thongBao && <p className="mt-4 text-sm text-cinema-500">{thongBao}</p>}

      {dangMoAi && (
        <AdminModalOverlay onBackdropClick={() => datDangMoAi(false)} maxWidth="max-w-4xl">
          <div className="admin-modal-panel">
            <AdminModalHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">✨ AI Xếp Lịch Chiếu Thông Minh</h2>
                <p className="mt-1 text-sm text-slate-400">Chọn ngày và phim — AI sắp xếp khung giờ tối ưu (09:00–23:00)</p>
              </div>
              <button type="button" onClick={() => datDangMoAi(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>
            </AdminModalHeader>
            <AdminModalBody>
            {thongBaoAi && (
              <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${thongBaoAi.includes('gợi ý') ? 'bg-emerald-500/15 text-emerald-200' : 'bg-cinema-500/10 text-cinema-400'}`}>
                {thongBaoAi}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">Rạp<span className="text-red-400"> *</span>
                <select
                  value={aiDuLieu.maRap}
                  onChange={(e) => datAiDuLieu((cu) => ({ ...cu, maRap: e.target.value }))}
                  className="o-nhap mt-2"
                >
                  <option value="">Chọn rạp</option>
                  {danhSachRap.map((rap) => <option key={rap.id} value={rap.id}>{rap.tenRap}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-300">Ngày cần xếp lịch<span className="text-red-400"> *</span>
                <input
                  type="date"
                  value={aiDuLieu.ngayChieu}
                  onChange={(e) => datAiDuLieu((cu) => ({ ...cu, ngayChieu: e.target.value }))}
                  className="o-nhap mt-2"
                />
              </label>
              <label className="block text-sm text-slate-300 sm:col-span-2">Định dạng
                <select
                  value={aiDuLieu.dinhDang}
                  onChange={(e) => datAiDuLieu((cu) => ({ ...cu, dinhDang: e.target.value }))}
                  className="o-nhap mt-2"
                >
                  {DINH_DANG_MAC_DINH.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-300">Chọn phim muốn chiếu<span className="text-red-400"> *</span></p>
                <p className="text-xs text-slate-500">Tối đa {GIOI_HAN_PHIM_AI} phim · Đã chọn {aiDuLieu.danhSachMaPhim.length}</p>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {danhSachPhim.map((phim) => {
                  const daChon = aiDuLieu.danhSachMaPhim.includes(phim.id)
                  return (
                    <label
                      key={phim.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${daChon ? 'border-purple-400 bg-purple-500/15' : 'border-white/10 bg-white/5'}`}
                    >
                      <input type="checkbox" checked={daChon} onChange={() => chuyenDoiPhimAi(phim.id)} className="accent-purple-500" />
                      <span className="text-sm text-slate-200">
                        {phim.title}
                        <span className="ml-1 text-xs text-slate-400">({phim.duration} phút{phim.status === 'SHOWING' ? ' · Hot' : ''})</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
            {rapAi && (
              <p className="mt-3 text-xs text-slate-400">
                {rapAi.danhSachPhong?.length || 0} phòng tại {rapAi.tenRap} — AI phân bổ không trùng phòng, cộng 20 phút dọn phòng giữa các suất.
              </p>
            )}
            <button
              type="button"
              onClick={taoLichAi}
              disabled={dangXuLyAi}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 py-3 font-semibold text-white shadow-[0_0_18px_rgba(168,85,247,0.4)] transition hover:brightness-110 disabled:opacity-60"
            >
              {dangXuLyAi ? <><Loader2 size={18} className="animate-spin" /> AI đang xếp lịch...</> : 'Tạo Lịch Chiếu Bằng AI'}
            </button>

            {goiYAi.length > 0 && (
              <div ref={vungKetQuaAiRef} className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    Gợi ý từ {nguonAi} ({daChonAi.size}/{goiYAi.filter((s) => !s.trungLich).length} khả dụng)
                  </p>
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => datDaChonAi(new Set(goiYAi.filter((s) => !s.trungLich).map((s) => s.maKhoa)))}
                      className="text-cinema-400 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <button type="button" onClick={() => datDaChonAi(new Set())} className="text-slate-400 hover:underline">Bỏ chọn</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {goiYAi.map((suat) => {
                    const dangChon = daChonAi.has(suat.maKhoa)
                    if (suat.trungLich) {
                      return (
                        <div key={suat.maKhoa} className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 opacity-75">
                          <p className="font-medium text-slate-400 line-through">{suat.movieTitle || suat.title} · {suat.tenPhong || suat.maPhong}</p>
                          <p className="text-sm text-slate-500">{suat.gioHienThi || dinhDangKhoangGio(suat.thoiGianBatDau, suat.thoiGianKetThuc)} — Trùng lịch phòng</p>
                        </div>
                      )
                    }
                    return (
                      <button
                        key={suat.maKhoa}
                        type="button"
                        onClick={() => chuyenDoiChonAi(suat.maKhoa)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${dangChon ? 'border-purple-400 bg-purple-500/20' : 'border-white/10 bg-white/5 hover:border-purple-300/50'}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{suat.movieTitle || suat.title}</p>
                            <p className="text-sm text-slate-300">
                              {suat.tenPhong || suat.maPhong} · {suat.gioHienThi || dinhDangKhoangGio(suat.thoiGianBatDau, suat.thoiGianKetThuc)} · {dinhDangGiaNgan(suat.giaVeTu)}
                            </p>
                          </div>
                          <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs text-purple-200">{suat.dinhDang}</span>
                        </div>
                        {suat.lyDoToiUu && (
                          <p className="mt-2 text-sm text-purple-200/90">💡 {suat.lyDoToiUu}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={apDungLichAi}
                  disabled={dangXuLyAi || daChonAi.size === 0}
                  className="nut-chinh mt-4 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
                >
                  {dangXuLyAi ? 'Đang lưu...' : `Áp Dụng Lịch Này (${daChonAi.size} suất)`}
                </button>
              </div>
            )}
            </AdminModalBody>
          </div>
        </AdminModalOverlay>
      )}

      {dangMoHangLoat && (
        <AdminModalOverlay onBackdropClick={() => datDangMoHangLoat(false)} maxWidth="max-w-4xl">
          <div className="admin-modal-panel">
            <AdminModalHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Tạo suất chiếu hàng loạt</h2>
              <button type="button" onClick={() => datDangMoHangLoat(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>
            </AdminModalHeader>
            <AdminModalBody>
            {thongBao && <p className="mb-4 rounded-lg bg-cinema-500/10 px-4 py-2 text-sm text-cinema-400">{thongBao}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300 sm:col-span-2">Phim <span className="text-red-400">*</span><select required name="maPhim" value={hangLoat.maPhim} onChange={xuLyHangLoat} className="o-nhap mt-2"><option value="">— Chọn phim (bắt buộc) —</option>{danhSachPhim.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.duration} phút)</option>)}</select></label>
              <label className="block text-sm text-slate-300">Rạp<select name="maRap" value={hangLoat.maRap} onChange={xuLyHangLoat} className="o-nhap mt-2"><option value="">Chọn rạp</option>{danhSachRap.map((rap) => <option key={rap.id} value={rap.id}>{rap.tenRap}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Phòng<select name="maPhong" value={hangLoat.maPhong} onChange={xuLyHangLoat} className="o-nhap mt-2" disabled={!rapHangLoat}><option value="">Chọn phòng</option>{rapHangLoat?.danhSachPhong?.map((phong) => <option key={phong.maPhong} value={phong.maPhong}>{phong.tenPhong}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Định dạng<select name="dinhDang" value={hangLoat.dinhDang} onChange={xuLyHangLoat} className="o-nhap mt-2">{DINH_DANG_MAC_DINH.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Từ ngày<input type="date" name="tuNgay" value={hangLoat.tuNgay} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Đến ngày<input type="date" name="denNgay" value={hangLoat.denNgay} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Từ giờ<input type="time" name="tuGio" value={hangLoat.tuGio} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Đến giờ<input type="time" name="denGio" value={hangLoat.denGio} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Nghỉ giữa suất (phút)<input type="number" name="thoiGianNghiPhut" value={hangLoat.thoiGianNghiPhut} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Làm tròn (phút)<input type="number" name="buocLamTronPhut" value={hangLoat.buocLamTronPhut} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Giá suất ngày<input type="number" name="giaVeTuNgay" value={hangLoat.giaVeTuNgay} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
              <label className="block text-sm text-slate-300">Giá suất tối<input type="number" name="giaVeTuToi" value={hangLoat.giaVeTuToi} onChange={xuLyHangLoat} className="o-nhap mt-2" /></label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Hệ thống tự tính suất theo thời lượng phim + thời gian nghỉ, làm tròn lên mỗi {hangLoat.buocLamTronPhut} phút. Giá tối áp dụng từ {hangLoat.gioApGiaToi}:00. Khung giờ trùng với suất đã có trong phòng sẽ bị khóa.</p>

            {suatDaCoTheoPhong.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="font-semibold text-amber-200">Suất đã có trong {rapHangLoat?.danhSachPhong?.find((p) => p.maPhong === hangLoat.maPhong)?.tenPhong || hangLoat.maPhong}</p>
                {Object.entries(suatDaCoNhomNgay).map(([ngay, danhSach]) => (
                  <div key={ngay} className="mt-3">
                    <p className="text-xs font-medium text-amber-100/80">{new Date(ngay).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {danhSach.map((suat) => (
                        <span key={suat.id} className="rounded-lg bg-black/20 px-2 py-1 text-xs text-amber-50">
                          {dinhDangKhoangGio(suat.thoiGianBatDau, suat.thoiGianKetThuc)} · {suat.movieTitle || suat.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={taoGoiY} className="nut-chinh mt-4 w-full">Gợi ý khung giờ</button>

            {goiY.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">Chọn suất để tạo ({daChon.size}/{goiY.filter((s) => !s.trungLich).length} khả dụng)</p>
                  <div className="flex gap-2 text-sm">
                    <button type="button" onClick={() => chonTatCa(true)} className="text-cinema-400 hover:underline">Chọn tất cả</button>
                    <button type="button" onClick={() => chonTatCa(false)} className="text-slate-400 hover:underline">Bỏ chọn</button>
                  </div>
                </div>
                {Object.entries(goiYNhomNgay).map(([ngay, danhSach]) => (
                  <div key={ngay} className="mb-4">
                    <p className="mb-2 text-sm font-medium text-slate-300">{new Date(ngay).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {danhSach.map((suat) => {
                        const dangChon = daChon.has(suat.maKhoa)
                        if (suat.trungLich) {
                          return (
                            <div
                              key={suat.maKhoa}
                              title={suat.lyDo || 'Phòng đã có suất trong khung giờ này'}
                              className="rounded-xl border border-slate-500 bg-slate-800/60 px-2 py-2 text-center text-sm opacity-80"
                            >
                              <p className="text-xs font-semibold leading-tight text-slate-400 line-through sm:text-sm">{dinhDangKhoangGio(suat.thoiGianBatDau, suat.thoiGianKetThuc)}</p>
                              <p className="mt-1 text-xs text-slate-500">Đã có suất</p>
                            </div>
                          )
                        }
                        return (
                          <button
                            key={suat.maKhoa}
                            type="button"
                            onClick={() => chuyenDoiChon(suat.maKhoa)}
                            className={`rounded-xl border px-2 py-2 text-center text-sm transition ${dangChon ? 'border-cinema-500 bg-cinema-500/20 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                          >
                            <p className="text-xs font-semibold leading-tight sm:text-sm">{dinhDangKhoangGio(suat.thoiGianBatDau, suat.thoiGianKetThuc)}</p>
                            <p className="mt-1 text-xs">{dinhDangGiaNgan(suat.giaVeTu)}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={taoHangLoat} className="nut-chinh mt-4 w-full">Tạo {daChon.size} suất đã chọn</button>
              </div>
            )}
            </AdminModalBody>
          </div>
        </AdminModalOverlay>
      )}

      {dangMo && (
        <AdminModalOverlay onBackdropClick={() => datDangMo(false)}>
          <form onSubmit={luuSuatChieu} className="admin-modal-panel">
            <AdminModalHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{suatSua ? 'Sửa suất chiếu' : 'Thêm 1 suất chiếu'}</h2>
              <button type="button" onClick={() => datDangMo(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>
            </AdminModalHeader>
            <AdminModalBody className="space-y-4">
              <label className="block text-sm text-slate-300">Phim<select required name="maPhim" value={duLieu.maPhim} onChange={xuLyThayDoi} className="o-nhap mt-2"><option value="">Chọn phim</option>{danhSachPhim.map((phim) => <option key={phim.id} value={phim.id}>{phim.title}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Rạp<select required name="maRap" value={duLieu.maRap} onChange={xuLyThayDoi} className="o-nhap mt-2"><option value="">Chọn rạp</option>{danhSachRap.map((rap) => <option key={rap.id} value={rap.id}>{rap.khuVuc ? `${rap.khuVuc} · ` : ''}{rap.tenRap}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Phòng<select required name="maPhong" value={duLieu.maPhong} onChange={xuLyThayDoi} className="o-nhap mt-2" disabled={!rapDaChon}><option value="">Chọn phòng</option>{rapDaChon?.danhSachPhong?.map((phong) => <option key={phong.maPhong} value={phong.maPhong}>{phong.tenPhong}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-300">Giá ghế thường (VND)<input required name="giaVeTu" type="number" min="0" step="1000" value={duLieu.giaVeTu} onChange={xuLyThayDoi} className="o-nhap mt-2" /></label>
                <label className="text-sm text-slate-300">Định dạng<select required name="dinhDang" value={duLieu.dinhDang} onChange={xuLyThayDoi} className="o-nhap mt-2">{DINH_DANG_MAC_DINH.map((muc) => <option key={muc} value={muc}>{muc}</option>)}</select></label>
              </div>
              {giaVeTuNhap > 0 && (
                <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                  Xem trước giá: Thường {dinhDangTien(giaThuongPreview)} · VIP {dinhDangTien(giaVipPreview)} · Ghế đôi {dinhDangTien(giaCouplePreview)}
                  {rapDaChon && ` (VIP +${rapDaChon.phanTramGheVip ?? 25}%, đôi +${rapDaChon.phanTramGheCouple ?? 80}%)`}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-300">Bắt đầu<input required name="thoiGianBatDau" type="datetime-local" value={duLieu.thoiGianBatDau} onChange={xuLyThayDoi} className="o-nhap mt-2" /></label>
                <label className="text-sm text-slate-300">Kết thúc<input required name="thoiGianKetThuc" type="datetime-local" value={duLieu.thoiGianKetThuc} onChange={xuLyThayDoi} className="o-nhap mt-2" /></label>
              </div>
            </AdminModalBody>
            <AdminModalFooter>
            <button className="nut-chinh w-full">{suatSua ? 'Cập nhật' : 'Tạo suất chiếu'}</button>
            </AdminModalFooter>
          </form>
        </AdminModalOverlay>
      )}

      <div className="admin-table-panel mt-8 overflow-x-auto p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white">Lịch sử suất chiếu ({lichSuLoc.length}{lichSuLoc.length !== lichSu.length ? ` / ${lichSu.length}` : ''})</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={tuKhoa}
                onChange={(e) => datTuKhoa(e.target.value)}
                placeholder="Tìm phim, rạp, phòng..."
                className="o-nhap w-full pl-10"
              />
            </div>
            <select value={locPhim} onChange={(e) => datLocPhim(e.target.value)} className="o-nhap min-w-[160px]">
              <option value="">Tất cả phim</option>
              {danhSachPhim.map((phim) => <option key={phim.id} value={phim.id}>{phim.title}</option>)}
            </select>
            <select value={locRap} onChange={(e) => datLocRap(e.target.value)} className="o-nhap min-w-[160px]">
              <option value="">Tất cả rạp</option>
              {danhSachRap.map((rap) => <option key={rap.id} value={rap.id}>{rap.tenRap}</option>)}
            </select>
          </div>
        </div>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-3 pr-4">Phim</th>
              <th className="pb-3 pr-4">Rạp / Phòng</th>
              <th className="pb-3 pr-4">Thời gian</th>
              <th className="pb-3 pr-4">Giá / Định dạng</th>
              <th className="pb-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {lichSuLoc.map((suat) => (
              <tr key={suat.id} className="border-t border-white/10">
                <td className="py-3 pr-4 font-medium text-white">{suat.movieTitle || suat.title}</td>
                <td className="py-3 pr-4 text-slate-300">{suat.tenRap}<br /><span className="text-xs text-slate-500">Phòng {suat.maPhong}</span></td>
                <td className="py-3 pr-4 text-slate-300">{dinhDangNgay(suat.thoiGianBatDau)}</td>
                <td className="py-3 pr-4 text-slate-300">{dinhDangGiaNgan(suat.giaVeTu)} · {suat.dinhDang}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moBieuMau(suat)} className="rounded-lg border border-violet-400/30 p-2 text-violet-200 hover:bg-violet-500/10"><Pencil size={16} /></button>
                    <button type="button" onClick={() => xoaSuat(suat.id)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lichSu.length === 0 && <p className="mt-4 text-center text-slate-400">Chưa có suất chiếu nào.</p>}
        {lichSu.length > 0 && lichSuLoc.length === 0 && <p className="mt-4 text-center text-slate-400">Không có suất chiếu phù hợp.</p>}
      </div>
    </div>
  )
}
