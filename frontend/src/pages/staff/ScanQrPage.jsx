import { Camera, CheckCircle2, Clock3, Film, History, ImageUp, Loader2, QrCode, ScanLine, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { Html5Qrcode } from 'html5-qrcode'
import ConfirmPrintModal from '../../components/ConfirmPrintModal'
import AnhPosterPhim from '../../components/AnhPosterPhim'
import NutInVe from '../../components/NutInVe'
import PrintTicketTemplate from '../../components/PrintTicketTemplate'
import { useInVePhim } from '../../hooks/useInVePhim'
import { layDanhSachPhim } from '../../services/movieService'
import { traCuuVeQrcode, soatVeQrcode, layVeDaSoatHomNay } from '../../services/ticketService'
import { dinhDangKhoangGio, dinhDangNgayGio, dinhDangTien } from '../../utils/formatters'
import { tenHinhThucThanhToan } from '../../utils/hinhThucThanhToan'
import { chuanHoaMaQuet, taoMaQrVe } from '../../utils/maVeQr'

const TAB = { SOAT: 'soat', LICH_SU: 'lich-su' }

const tenTrangThaiSoat = (trangThai) => {
  if (trangThai === 'USED') return 'Đã soát vé'
  if (trangThai === 'PAID') return 'Đã thanh toán'
  if (trangThai === 'CANCELLED') return 'Đã hủy'
  return 'Chờ xác nhận'
}

const mauTrangThaiSoat = (trangThai) => {
  if (trangThai === 'USED') return 'bg-purple-500/20 text-purple-200 ring-purple-400/40'
  if (trangThai === 'PAID') return 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40'
  if (trangThai === 'CANCELLED') return 'bg-red-500/20 text-red-200 ring-red-400/40'
  return 'bg-amber-500/20 text-amber-200 ring-amber-400/40'
}

function KhungQuetCamera({ hienThi }) {
  if (!hienThi) return null
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[72%] w-[72%] max-h-[280px] max-w-[280px]">
          <span className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          <span className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          <span className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          <span className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">
        Giữ QR trong khung · Tránh ánh sáng trực tiếp
      </p>
    </>
  )
}

function BangThongTin({ tieuDe, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] ${className}`}>
      {tieuDe && <p className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{tieuDe}</p>}
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function DongThongTin({ nhan, giaTri }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-400">{nhan}</span>
      <span className="text-right font-medium text-white">{giaTri || '—'}</span>
    </div>
  )
}

function ChiTietVeQuet({ ve, thongTinPhim, dangSoat, onSoatVe, onInVe }) {
  const ngayChieu = ve.thoiGianBatDau
    ? new Date(ve.thoiGianBatDau).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'
  const posterUrl = ve.posterUrl || thongTinPhim?.posterUrl
  const genres = (ve.genres?.length ? ve.genres : thongTinPhim?.genres)?.join(', ') || '—'
  const duration = ve.duration || thongTinPhim?.duration
  const thoiLuongHien = duration ? `${duration} phút` : '—'
  const doTuoi = ve.ageRating || thongTinPhim?.ageRating || '—'
  const title = ve.movieTitle || ve.title || '—'

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300">Chi tiết vé</p>
        <NutInVe onClick={() => onInVe?.(ve, thongTinPhim)} />
      </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
            <AnhPosterPhim
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Phim</p>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {[ve.tenRap, ve.maPhong ? `Phòng ${ve.maPhong}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <BangThongTin tieuDe="Thông tin xuất chiếu">
          <DongThongTin nhan="Thời lượng" giaTri={thoiLuongHien} />
          <DongThongTin nhan="Độ tuổi" giaTri={doTuoi} />
          <DongThongTin nhan="Định dạng" giaTri={ve.dinhDang || '—'} />
          <DongThongTin nhan="Thể loại" giaTri={genres} />
          <DongThongTin nhan="Lịch chiếu" giaTri={`${ngayChieu} · ${dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc)}`} />
          <DongThongTin nhan="Địa điểm rạp" giaTri={ve.tenRap} />
        </BangThongTin>

        <BangThongTin tieuDe="Ghế đã đặt">
          <p className="text-sm font-semibold text-white">{(ve.danhSachGheChon || []).join(', ') || '—'}</p>
          <p className="mt-2 text-sm text-slate-400">
            Tổng tiền ghế: <span className="font-bold text-cinema-400">{dinhDangTien(ve.tienGhe ?? 0)}</span>
          </p>
        </BangThongTin>

        {ve.danhSachCombo?.length > 0 && (
          <BangThongTin tieuDe="Combo bắp nước">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">Tên combo</th>
                  <th className="pb-2 font-medium text-center">SL</th>
                  <th className="pb-2 font-medium text-right">Giá</th>
                </tr>
              </thead>
              <tbody>
                {ve.danhSachCombo.map((combo) => (
                  <tr key={combo.maCombo || combo.tenCombo} className="border-t border-white/5">
                    <td className="py-2 text-white">{combo.tenCombo}</td>
                    <td className="py-2 text-center text-slate-300">{combo.soLuong}</td>
                    <td className="py-2 text-right text-slate-300">{dinhDangTien((combo.donGia || 0) * (combo.soLuong || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ve.tienBapNuoc > 0 && (
              <p className="mt-2 border-t border-white/10 pt-2 text-sm text-slate-400">
                Tổng combo: <span className="font-bold text-white">{dinhDangTien(ve.tienBapNuoc)}</span>
              </p>
            )}
          </BangThongTin>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${mauTrangThaiSoat(ve.trangThai)}`}>
              {tenTrangThaiSoat(ve.trangThai)}
            </span>
            {ve.tongTien != null && (
              <span className="text-sm font-bold text-cinema-400">{dinhDangTien(ve.tongTien)}</span>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <DongThongTin nhan="Thời gian thanh toán" giaTri={dinhDangNgayGio(ve.ngayTao)} />
            <DongThongTin nhan="Hình thức thanh toán" giaTri={tenHinhThucThanhToan(ve.hinhThucThanhToan)} />
            {ve.thoiGianSoatVe && (
              <DongThongTin nhan="Thời gian soát vé" giaTri={dinhDangNgayGio(ve.thoiGianSoatVe)} />
            )}
          </div>

          <div className="mt-5 flex flex-col items-center rounded-xl bg-white p-4">
            <QRCode value={taoMaQrVe(ve.id)} size={120} />
            <p className="mt-3 font-mono text-xs text-slate-600">{taoMaQrVe(ve.id)}</p>
          </div>
        </div>

        <BangThongTin tieuDe="Thông tin người đặt">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cinema-500/20 text-cinema-400">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">
                {ve.hoTenNguoiDung || (ve.maNguoiDung ? `Tài khoản #${ve.maNguoiDung.slice(-6)}` : 'Khách hàng')}
              </p>
              <p className="text-xs text-slate-500">Mã người dùng: {ve.maNguoiDung || '—'}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <DongThongTin nhan="Email" giaTri={ve.emailNguoiDung} />
            <DongThongTin nhan="Số điện thoại" giaTri={ve.soDienThoaiNguoiDung} />
          </div>
        </BangThongTin>

        {ve.thongBaoSoat && (
          <p className={`rounded-xl px-4 py-3 text-sm font-medium ${ve.coTheSoat ? 'bg-emerald-500/15 text-emerald-200' : ve.trangThai === 'USED' ? 'bg-purple-500/15 text-purple-200' : 'bg-rose-500/10 text-rose-200'}`}>
            {ve.thongBaoSoat}
          </p>
        )}

        {ve.trangThai === 'PAID' && ve.coTheSoat && (
          <button type="button" onClick={onSoatVe} disabled={dangSoat} className="nut-chinh w-full">
            {dangSoat ? 'Đang xử lý...' : 'Xác nhận soát vé — cho vào rạp'}
          </button>
        )}
      </div>
    </div>
    </div>
  )
}

export default function ScanQrPage() {
  const [tab, datTab] = useState(TAB.SOAT)
  const [maQrCode, datMaQrCode] = useState('')
  const [maQuet, datMaQuet] = useState('')
  const [ve, datVe] = useState(null)
  const [thongTinPhim, datThongTinPhim] = useState(null)
  const [ketQua, datKetQua] = useState(null)
  const [loi, datLoi] = useState('')
  const [dangQuet, datDangQuet] = useState(false)
  const [dangTraCuu, datDangTraCuu] = useState(false)
  const [dangSoat, datDangSoat] = useState(false)
  const [danhSachDaSoat, datDanhSachDaSoat] = useState([])
  const [dangTaiLichSu, datDangTaiLichSu] = useState(false)
  const boQuet = useRef(null)
  const quetGanDay = useRef('')
  const inputAnhRef = useRef(null)
  const {
    moXacNhanIn,
    veCanIn,
    thongTinPhimCanIn,
    hienTemplateIn,
    yeuCauInVe,
    huyInVe,
    xacNhanInVe,
  } = useInVePhim()

  const taiLichSu = useCallback(async () => {
    datDangTaiLichSu(true)
    try {
      const ds = await layVeDaSoatHomNay()
      datDanhSachDaSoat(ds)
    } catch {
      datDanhSachDaSoat([])
    } finally {
      datDangTaiLichSu(false)
    }
  }, [])

  useEffect(() => {
    layVeDaSoatHomNay().then(datDanhSachDaSoat).catch(() => datDanhSachDaSoat([]))
  }, [])

  useEffect(() => {
    if (tab === TAB.LICH_SU) taiLichSu()
  }, [tab, taiLichSu])

  useEffect(() => {
    const movieTitle = ve?.movieTitle || ve?.title
    if (!movieTitle) {
      datThongTinPhim(null)
      return
    }
    if (ve.posterUrl && ve.duration) {
      datThongTinPhim(null)
      return
    }
    layDanhSachPhim({ tuKhoa: movieTitle, size: 10 })
      .then((phanHoi) => {
        const ds = phanHoi.content || phanHoi
        const danhSach = Array.isArray(ds) ? ds : []
        datThongTinPhim(danhSach.find((p) => (p.title || p.movieTitle) === movieTitle) || danhSach[0] || null)
      })
      .catch(() => datThongTinPhim(null))
  }, [ve?.movieTitle, ve?.title, ve?.posterUrl, ve?.duration])

  const tatCamera = async () => {
    if (boQuet.current?.isScanning) {
      try { await boQuet.current.stop() } catch { /* ignore */ }
    }
    if (boQuet.current) {
      try { boQuet.current.clear() } catch { /* ignore */ }
    }
    boQuet.current = null
    datDangQuet(false)
  }

  const traCuu = async (ma = maQrCode) => {
    const maChuan = chuanHoaMaQuet(ma.trim()) || ma.trim()
    if (!maChuan) return
    datDangTraCuu(true)
    datLoi('')
    datVe(null)
    datKetQua(null)
    datMaQuet(maChuan)
    datMaQrCode(ma.trim())
    try {
      const chiTiet = await traCuuVeQrcode(maChuan)
      datVe(chiTiet)
    } catch (err) {
      datLoi(err.response?.data?.message || err.message || 'Không tìm thấy vé')
    } finally {
      datDangTraCuu(false)
    }
  }

  const xuLySoatVe = async () => {
    if (!maQuet || !ve?.coTheSoat) return
    datDangSoat(true)
    datLoi('')
    try {
      const ketQuaVe = await soatVeQrcode(maQuet)
      datVe(ketQuaVe)
      datKetQua({ thanhCong: true, noiDung: 'Vé đã soát — khách có thể vào rạp' })
      datMaQrCode('')
      datMaQuet('')
      taiLichSu()
    } catch (err) {
      datLoi(err.response?.data?.message || err.message || 'Soát vé thất bại')
    } finally {
      datDangSoat(false)
    }
  }

  const apDauLocCamera = () => {
    const video = document.querySelector('#khung-camera video')
    if (video) video.classList.add('quet-camera-video')
  }

  const quetTuAnh = async (suKien) => {
    const file = suKien.target.files?.[0]
    suKien.target.value = ''
    if (!file) return
    datLoi('')
    datDangTraCuu(true)
    try {
      const quetTam = new Html5Qrcode('khung-quet-anh-an')
      const maDoc = await quetTam.scanFile(file, false)
      await quetTam.clear()
      await traCuu(maDoc)
    } catch {
      datLoi('Không đọc được QR trong ảnh. Chọn ảnh rõ hơn hoặc nhập mã PHONGG:... bên dưới.')
    } finally {
      datDangTraCuu(false)
    }
  }

  const batCamera = async () => {
    datLoi('')
    datDangQuet(true)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    await new Promise((resolve) => setTimeout(resolve, 200))
    try {
      const khung = document.getElementById('khung-camera')
      if (!khung) throw new Error('Không tìm thấy vùng hiển thị camera')
      boQuet.current = new Html5Qrcode('khung-camera', { verbose: false })
      await boQuet.current.start(
        { facingMode: { ideal: 'environment' } },
        {
          fps: 8,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
          },
        },
        (maDocDuoc) => {
          if (!maDocDuoc || maDocDuoc === quetGanDay.current) return
          quetGanDay.current = maDocDuoc
          tatCamera()
          traCuu(maDocDuoc)
          setTimeout(() => { quetGanDay.current = '' }, 2000)
        },
        () => {},
      )
      setTimeout(apDauLocCamera, 300)
    } catch {
      datDangQuet(false)
      datLoi('Không thể mở camera. Hãy quét từ ảnh hoặc nhập mã vé bên dưới.')
    }
  }

  useEffect(() => () => { tatCamera() }, [])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit rounded-2xl bg-cinema-500/20 p-4 text-cinema-500">
          <QrCode size={34} />
        </div>
        <h1 className="text-3xl font-black">Soát vé QR</h1>
        <p className="mt-2 text-slate-400">Quét mã → kiểm tra ngày/giờ → xác nhận soát vé</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => datTab(TAB.SOAT)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === TAB.SOAT ? 'bg-cinema-500 text-white' : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
        >
          <ScanLine size={16} /> Soát vé
        </button>
        <button
          type="button"
          onClick={() => datTab(TAB.LICH_SU)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === TAB.LICH_SU ? 'bg-emerald-600 text-white' : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
        >
          <History size={16} /> Đã soát hôm nay ({danhSachDaSoat.length})
        </button>
      </div>

      {tab === TAB.SOAT ? (
        <div className="the-kinh mt-6 p-6">
          <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <strong>Mẹo:</strong> Camera quá sáng? Bấm <b>Quét từ ảnh</b> (chụp màn hình vé) hoặc nhập mã <span className="font-mono">PHONGG:...</span> / mã vé bên dưới.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={batCamera}
              disabled={dangQuet}
              className="flex items-center justify-center gap-2 rounded-xl border border-cinema-500 py-3 text-cinema-500 hover:bg-cinema-500/10 disabled:opacity-50"
            >
              <Camera size={19} />
              Mở camera quét QR
            </button>
            <button
              type="button"
              onClick={() => inputAnhRef.current?.click()}
              disabled={dangTraCuu}
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/40 py-3 text-violet-200 hover:bg-violet-500/10 disabled:opacity-50"
            >
              <ImageUp size={19} />
              Quét từ ảnh
            </button>
          </div>
          <input
            ref={inputAnhRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={quetTuAnh}
          />

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            HOẶC NHẬP MÃ TAY
          </div>

          <form
            onSubmit={(suKien) => {
              suKien.preventDefault()
              traCuu()
            }}
            className="flex gap-2"
          >
            <input
              className="o-nhap"
              value={maQrCode}
              onChange={(suKien) => datMaQrCode(suKien.target.value)}
              placeholder="PHONGG:6af114d3... hoặc mã vé"
            />
            <button type="submit" className="nut-chinh px-4" disabled={dangTraCuu}>
              <ScanLine size={19} />
            </button>
          </form>

          {maQuet && (
            <div className="mt-4 rounded-xl border border-cinema-500/30 bg-cinema-500/10 p-3">
              <p className="text-xs text-slate-400">Mã đã quét / nhập</p>
              <p className="font-mono text-sm font-bold text-cinema-500">{maQuet}</p>
            </div>
          )}

          {dangTraCuu && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="animate-spin" size={18} /> Đang tra cứu vé...
            </div>
          )}

          {loi && <p className="mt-4 text-sm text-rose-300">{loi}</p>}

          {ve && (
            <ChiTietVeQuet
              ve={ve}
              thongTinPhim={thongTinPhim}
              dangSoat={dangSoat}
              onSoatVe={xuLySoatVe}
              onInVe={yeuCauInVe}
            />
          )}

          {ketQua && (
            <div className="mt-5 flex gap-3 rounded-xl bg-emerald-500/15 p-4 text-emerald-200">
              <CheckCircle2 className="shrink-0" />
              <p>{ketQua.noiDung}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="the-kinh mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Vé đã soát hôm nay</h2>
            <button type="button" onClick={taiLichSu} disabled={dangTaiLichSu} className="text-sm text-cinema-500 hover:underline">
              {dangTaiLichSu ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          {dangTaiLichSu ? (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={18} /> Đang tải...</div>
          ) : danhSachDaSoat.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Clock3 className="mx-auto mb-2 text-amber-300" size={28} />
              Chưa có vé nào được soát hôm nay.
            </div>
          ) : (
            <div className="space-y-3">
              {danhSachDaSoat.map((item) => (
                <article key={item.id} className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">MÃ VÉ #{item.id?.slice(-8)}</p>
                      <p className="font-bold text-white">{item.movieTitle || item.title || '—'}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.tenRap} · Phòng {item.maPhong} · Ghế {(item.danhSachGheChon || []).join(', ')}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Suất: {dinhDangKhoangGio(item.thoiGianBatDau, item.thoiGianKetThuc)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      Đã soát
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-emerald-300">
                    Soát lúc: {dinhDangNgayGio(item.thoiGianSoatVe)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {dangQuet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
              <div id="khung-camera" className="relative min-h-[320px] w-full bg-black" />
              <KhungQuetCamera hienThi />
            </div>
            <button
              type="button"
              onClick={tatCamera}
              className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-center text-sm text-slate-300 hover:bg-white/5"
            >
              Quét từ ảnh / nhập mã tay
            </button>
            <button
              type="button"
              onClick={tatCamera}
              className="mt-2 w-full rounded-full bg-red-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500"
            >
              Dừng quét
            </button>
          </div>
        </div>
      )}

      <ConfirmPrintModal mo={moXacNhanIn} onXacNhan={xacNhanInVe} onHuy={huyInVe} />
      <PrintTicketTemplate ve={veCanIn} thongTinPhim={thongTinPhimCanIn} hienThi={hienTemplateIn} />
      <div id="khung-quet-anh-an" className="hidden" aria-hidden />
    </div>
  )
}
