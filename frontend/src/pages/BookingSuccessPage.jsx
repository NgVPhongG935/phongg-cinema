import { CheckCircle2, Clock, Copy, Film, Home, QrCode, Ticket as TicketIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { dinhDangTien } from '../utils/formatters'
import { hienThongBaoThanhCong } from '../utils/hienThongBao'
import apiClient from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export default function BookingSuccessPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { nguoiDung } = useAuth()

  const [ve, datVe] = useState(location.state?.ve || null)
  const [dangTai, datDangTai] = useState(!location.state?.ve)
  const [daSaoChep, datDaSaoChep] = useState(false)

  useEffect(() => {
    if (ve) return
    let huy = false
    const taiVe = async () => {
      try {
        if (!id) return
        // Thử lấy danh sách vé của người dùng để tìm vé theo id
        const res = await apiClient.get('/tickets/my-tickets', {
          params: { maNguoiDung: nguoiDung?.id },
        })
        const timThay = res.data?.find((v) => v.id === id || v.id?.endsWith(id))
        if (!huy && timThay) {
          datVe(timThay)
        }
      } catch {
        // bỏ qua
      } finally {
        if (!huy) datDangTai(false)
      }
    }
    taiVe()
    return () => { huy = true }
  }, [id, nguoiDung?.id, ve])

  const maHienThi = ve?.id ? `#${ve.id.slice(-8)}` : (id ? `#${id.slice(-8)}` : '#---')

  const saoChepMa = async () => {
    if (!ve?.id && !id) return
    try {
      await navigator.clipboard.writeText(ve?.id || id)
      datDaSaoChep(true)
      hienThongBaoThanhCong('Đã sao chép mã vé!')
      setTimeout(() => datDaSaoChep(false), 2000)
    } catch {
      // bỏ qua
    }
  }

  const danhSachGhe = Array.isArray(ve?.danhSachGhe)
    ? ve.danhSachGhe.join(', ')
    : (Array.isArray(ve?.selectedSeats) ? ve.selectedSeats.join(', ') : 'Chưa có thông tin')

  const tongTien = ve?.tongTien ?? ve?.totalAmount ?? 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14 animate-fade-in-up">
      {/* 1. Thẻ trạng thái nổi bật (Màu vàng/cam/amber) */}
      <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-amber-950/60 p-6 sm:p-7 shadow-2xl backdrop-blur-xl ring-1 ring-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-lg shadow-amber-950/50">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              ĐÃ GHI NHẬN CHUYỂN KHOẢN — CHỜ DUYỆT VÉ
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-black text-white">
              Giao dịch đang chờ xác nhận
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-amber-200/90 font-medium">
              Hệ thống đã nhận được yêu cầu của bạn. Quản trị viên sẽ kiểm tra giao dịch và phê duyệt vé trong vòng <strong className="text-white">3 – 5 phút</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Thẻ Thông tin vé chi tiết */}
      <div className="the-kinh mt-6 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Mã đặt vé</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black tracking-tight text-fuchsia-300">
                {maHienThi}
              </span>
              <button
                type="button"
                onClick={saoChepMa}
                title="Sao chép mã vé"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tổng thanh toán</p>
            <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">
              {dinhDangTien(tongTien)}
            </p>
          </div>
        </div>

        {/* Thông tin suất chiếu & ghế */}
        <div className="mt-6 space-y-4 text-sm">
          {ve?.tenPhim && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-2">
                <Film size={16} className="text-fuchsia-400" /> Phim:
              </span>
              <span className="font-bold text-white text-right max-w-xs">{ve.tenPhim}</span>
            </div>
          )}
          {ve?.tenRap && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Rạp chiếu:</span>
              <span className="font-semibold text-slate-200">{ve.tenRap}</span>
            </div>
          )}
          {ve?.tenPhong && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Phòng chiếu:</span>
              <span className="font-semibold text-slate-200">{ve.tenPhong}</span>
            </div>
          )}
          {ve?.thoiGianChieu && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Suất chiếu:</span>
              <span className="font-semibold text-violet-300">{ve.thoiGianChieu}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Danh sách ghế:</span>
            <span className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 font-mono font-bold text-fuchsia-200">
              {danhSachGhe}
            </span>
          </div>
          {ve?.noiDungChuyenKhoan && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Nội dung CK:</span>
              <span className="font-mono text-xs font-bold text-amber-300">{ve.noiDungChuyenKhoan}</span>
            </div>
          )}
        </div>

        {/* Hộp Trạng thái mã QR check-in */}
        <div className="mt-6 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-4 text-xs leading-relaxed text-sky-200/90">
          <div className="flex items-start gap-2.5">
            <QrCode size={20} className="shrink-0 text-sky-400 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Trạng thái mã QR vào rạp:</strong>
              Mã QR check-in sẽ <strong>tự động kích hoạt</strong> ngay sau khi Admin duyệt thành công. Bạn cũng sẽ nhận được email xác nhận kèm mã QR vé.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hai nút điều hướng chính */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
        <button
          type="button"
          onClick={() => navigate('/my-tickets', { state: { ve } })}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 py-3.5 px-6 font-bold text-white shadow-xl shadow-fuchsia-900/40 transition hover:brightness-110"
        >
          <TicketIcon size={18} />
          Xem danh sách Vé của tôi
        </button>

        <Link
          to="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3.5 px-6 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <Home size={17} />
          Quay về Trang chủ
        </Link>
      </div>
    </div>
  )
}
