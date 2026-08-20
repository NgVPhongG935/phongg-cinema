import QRCode from 'react-qr-code'
import { Search, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { layDanhSachVeCuaToi } from '../services/ticketService'
import { dinhDangKhoangGio, dinhDangNgayGio, dinhDangTien } from '../utils/formatters'
import { taoMaQrVe } from '../utils/maVeQr'
import { tenHinhThucThanhToan, tenTrangThaiVe } from '../utils/hinhThucThanhToan'

export default function MyTicketsPage() {
  const { nguoiDung } = useAuth()
  const viTri = useLocation()
  const [danhSachVe, datDanhSachVe] = useState([])
  const [tuKhoa, datTuKhoa] = useState('')
  const [veMoi, datVeMoi] = useState(viTri.state?.ve || null)

  useEffect(() => {
    if (!nguoiDung?.id) return
    const timer = setTimeout(() => {
      layDanhSachVeCuaToi(nguoiDung.id, tuKhoa.trim())
        .then((ds) => {
          datDanhSachVe(ds)
          if (veMoi?.id) {
            const capNhat = ds.find((v) => v.id === veMoi.id)
            if (capNhat) datVeMoi(capNhat)
          }
        })
        .catch(() => datDanhSachVe([]))
    }, tuKhoa.trim() ? 300 : 0)
    return () => clearTimeout(timer)
  }, [nguoiDung, tuKhoa, veMoi?.id])

  const danhSachHienThi = useMemo(() => danhSachVe.filter((ve) => ve.id !== veMoi?.id), [danhSachVe, veMoi])

  if (!nguoiDung) return <p className="py-20 text-center text-slate-400">Vui lòng đăng nhập để xem vé của bạn.</p>

  const hienThiVe = (ve) => {
    const movieTitle = ve.movieTitle || ve.title || 'Suất chiếu'
    const thoiGianBatDau = ve.startTime || ve.thoiGianBatDau
    const thoiGianKetThuc = ve.endTime || ve.thoiGianKetThuc
    const tenRap = ve.cinemaName || ve.tenRap
    const maPhong = ve.roomId || ve.maPhong
    const dinhDang = ve.format || ve.dinhDang
    const trangThai = ve.status || ve.trangThai
    const danhSachGhe = ve.selectedSeats || ve.danhSachGheChon || []
    const danhSachCombo = ve.combos || ve.danhSachCombo || []
    const tongTien = ve.totalAmount ?? ve.tongTien
    const tienGhe = ve.seatAmount ?? ve.tienGhe
    const tienBapNuoc = ve.comboAmount ?? ve.tienBapNuoc
    const hinhThucThanhToan = ve.paymentMethod || ve.hinhThucThanhToan
    const ngayTao = ve.createdAt || ve.ngayTao

    return (
      <article key={ve.id} className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cinema-800 to-cinema-950">
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-white/20 p-5">
          <div>
            <p className="text-sm text-slate-400">MÃ VÉ #{ve.id?.slice(-6)}</p>
            <h2 className="mt-1 text-xl font-bold">{movieTitle}</h2>
            <p className="mt-2 text-sm font-medium text-slate-200">{dinhDangKhoangGio(thoiGianBatDau, thoiGianKetThuc)}</p>
            {thoiGianBatDau && (
              <p className="mt-1 text-xs text-slate-400">
                {new Date(thoiGianBatDau).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {[tenRap, maPhong ? `Phòng ${maPhong}` : null, dinhDang].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${trangThai === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : trangThai === 'USED' ? 'bg-slate-500/20 text-slate-300' : trangThai === 'PENDING' ? 'bg-amber-400/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
            {tenTrangThaiVe(trangThai)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="text-sm">
            <p className="text-slate-400">Ghế: <b className="text-white">{danhSachGhe.join(', ')}</b></p>
            {danhSachCombo.length > 0 && (
              <p className="mt-2 text-slate-400">
                Combo: <b className="text-white">{danhSachCombo.map((c) => `${c.comboName || c.tenCombo} ×${c.quantity || c.soLuong}`).join(', ')}</b>
              </p>
            )}
            <p className="mt-2 text-slate-400">
              Thanh toán: <b className="text-white">{dinhDangTien(tongTien)}</b>
              {hinhThucThanhToan && (
                <span className="ml-1 text-xs text-slate-500">· {tenHinhThucThanhToan(hinhThucThanhToan)}</span>
              )}
              {tienBapNuoc > 0 && (
                <span className="ml-1 text-xs text-slate-500">(ghế {dinhDangTien(tienGhe)} + bắp nước {dinhDangTien(tienBapNuoc)})</span>
              )}
            </p>
            {ngayTao && <p className="mt-2 text-xs text-slate-500">Đặt lúc: {dinhDangNgayGio(ngayTao)}</p>}
          </div>
          <div className={`rounded-xl p-2 ${trangThai === 'PAID' || trangThai === 'USED' ? 'bg-white' : 'bg-white/10'}`}>
            {trangThai === 'PAID' || trangThai === 'USED' ? (
              <QRCode value={taoMaQrVe(ve.id)} size={92} />
            ) : (
              <div className="flex h-[92px] w-[92px] items-center justify-center text-center text-[10px] text-slate-400">QR hiện sau khi admin xác nhận thanh toán</div>
            )}
            <p className="mt-1 text-center font-mono text-[10px] text-slate-500">{taoMaQrVe(ve.id)}</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Vé của tôi</h1>
      <p className="mt-2 text-slate-400">Lưu mã QR để soát vé tại rạp</p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          value={tuKhoa}
          onChange={(suKien) => datTuKhoa(suKien.target.value)}
          placeholder="Tìm theo tên phim, giờ chiếu, rạp, ghế..."
          className="o-nhap pl-11"
        />
      </div>

      {veMoi && (
        <section className="mt-8">
          <p className="mb-3 font-semibold uppercase tracking-wider text-fuchsia-300">Vé vừa thanh toán</p>
          {hienThiVe(veMoi)}
        </section>
      )}

      <section className="mt-8 space-y-4">
        {danhSachHienThi.map(hienThiVe)}
        {!veMoi && danhSachHienThi.length === 0 && (
          <div className="the-kinh py-16 text-center text-slate-400">
            <Ticket className="mx-auto mb-3 text-slate-500" size={40} />
            <p>Chưa có vé nào{tuKhoa.trim() ? ` phù hợp với "${tuKhoa}"` : ''}.</p>
          </div>
        )}
      </section>
    </div>
  )
}
