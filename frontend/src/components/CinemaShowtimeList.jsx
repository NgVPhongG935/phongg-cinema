import { Calendar, CalendarClock, ChevronRight, Clock, Film, Loader2, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { layLichChieuHomNayTheoRap } from '../services/showtimeService'
import { dinhDangGio } from '../utils/formatters'
import { hienThiDoTuoi } from '../utils/locPhim'
import AnhPosterPhim from './AnhPosterPhim'

function taoDanhSach7Ngay() {
  const danhSach = []
  const homNay = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(homNay)
    d.setDate(homNay.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const thu = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' })
    const ngay = d.getDate()
    const thang = `Th${d.getMonth() + 1}`
    const ngayThang = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    danhSach.push({ iso, thu, ngay, thang, ngayThang, isToday: i === 0 })
  }
  return danhSach
}

export default function CinemaShowtimeList({ maRap, tenRap }) {
  const dieuHuong = useNavigate()
  const [danhSachPhim, datDanhSachPhim] = useState([])
  const [dangTai, datDangTai] = useState(false)
  const [ngayChieu, datNgayChieu] = useState(() => new Date().toISOString().slice(0, 10))

  const danhSach7Ngay = useMemo(() => taoDanhSach7Ngay(), [])

  useEffect(() => {
    if (!maRap) {
      datDanhSachPhim([])
      return
    }
    datDangTai(true)
    layLichChieuHomNayTheoRap(maRap, ngayChieu)
      .then(datDanhSachPhim)
      .catch(() => datDanhSachPhim([]))
      .finally(() => datDangTai(false))
  }, [maRap, ngayChieu])

  if (!maRap) return null

  const tongSoSuat = danhSachPhim.reduce((tong, p) => tong + (p.danhSachSuat?.length || 0), 0)

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-cinema-900/60 via-cinema-950/80 to-fuchsia-950/20 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      {/* Header Lịch Chiếu */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            <CalendarClock size={15} />
            Suất Chiếu Tại Rạp
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            {tenRap ? tenRap : 'Suất chiếu tại rạp đã chọn'}
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>{danhSachPhim.length} phim · {tongSoSuat} suất chiếu</span>
        </div>
      </div>

      {/* 2. THANH CHỌN NGÀY 7 NGÀY TIẾP THEO (DATE BAR) */}
      <div className="mb-6">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pb-1 pt-1">
          {danhSach7Ngay.map((item) => {
            const dangChon = item.iso === ngayChieu
            return (
              <button
                key={item.iso}
                type="button"
                onClick={() => datNgayChieu(item.iso)}
                className={`group relative flex min-w-[80px] shrink-0 flex-col items-center justify-center rounded-2xl border py-2.5 transition-all duration-200 ${
                  dangChon
                    ? 'scale-105 border-fuchsia-400 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-cinema-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.45)] ring-1 ring-fuchsia-400'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`text-[11px] font-semibold ${dangChon ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.thu}
                </span>
                <span className="my-0.5 text-base font-black tracking-tight sm:text-lg">
                  {item.ngay}
                </span>
                <span className={`text-[10px] ${dangChon ? 'text-white/90' : 'text-slate-500'}`}>
                  {item.thang}
                </span>

                {item.isToday && (
                  <span className="absolute -top-1 right-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Danh sách suất chiếu */}
      {dangTai && (
        <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
          <Loader2 size={22} className="animate-spin text-fuchsia-400" />
          <span>Đang tải suất chiếu...</span>
        </div>
      )}

      {!dangTai && danhSachPhim.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center text-slate-400">
          <Film size={36} className="mx-auto mb-2 text-slate-600" />
          <p className="font-semibold text-slate-300">Không có suất chiếu cho ngày đã chọn</p>
          <p className="mt-1 text-xs text-slate-500">Hãy thử chọn ngày khác hoặc đổi rạp chiếu lân cận.</p>
        </div>
      )}

      {!dangTai && danhSachPhim.length > 0 && (
        <div className="space-y-4">
          {danhSachPhim.map((phim) => (
            <article
              key={phim.movieId || phim.id}
              onClick={() => dieuHuong(`/movies/${phim.movieId || phim.id}`)}
              className="group/card flex cursor-pointer flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:border-fuchsia-500/40 hover:bg-white/[0.06] hover:shadow-xl sm:flex-row sm:items-center"
            >
              {/* 1. KHU VỰC BÊN TRÁI: Click xem Chi tiết phim */}
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-cinema-800 shadow-md transition group-hover/card:scale-105">
                  <AnhPosterPhim
                    src={phim.posterUrl}
                    alt={phim.title}
                    className="h-full w-full object-cover"
                    placeholderText="Poster"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-bold text-white transition group-hover/card:text-fuchsia-300 sm:text-base">
                    {phim.title}
                  </h4>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    {phim.ageRating && (
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                        {hienThiDoTuoi(phim.ageRating)}
                      </span>
                    )}
                    {phim.duration && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock size={13} className="text-fuchsia-400" />
                        {phim.duration} phút
                      </span>
                    )}
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 group-hover/card:text-slate-400">
                    <span>Xem chi tiết phim</span>
                    <ChevronRight size={13} />
                  </p>
                </div>
              </div>

              {/* 1. KHU VỰC BÊN PHẢI: Click chọn Giờ chiếu chuyển thẳng sang Đặt vé */}
              <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end lg:max-w-xl">
                {(phim.showtimes || phim.danhSachSuat)?.map((suat) => (
                  <button
                    key={suat.id}
                    type="button"
                    disabled={suat.hetHan}
                    onClick={(e) => {
                      e.stopPropagation() // Chặn sự kiện nổi bọt lên Card cha
                      dieuHuong(`/booking/${suat.id}`)
                    }}
                    title={suat.dinhDang ? `${suat.dinhDang} · ${dinhDangGio(suat.thoiGianBatDau)}` : undefined}
                    className={`group/slot relative flex min-w-[4.8rem] flex-col items-center rounded-xl border px-3 py-2 text-sm font-bold transition duration-200 ${
                      suat.hetHan
                        ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600 line-through opacity-40'
                        : 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 hover:scale-105 hover:border-fuchsia-400 hover:bg-fuchsia-600 hover:text-white hover:shadow-lg hover:shadow-fuchsia-900/50'
                    }`}
                  >
                    <span>{dinhDangGio(suat.thoiGianBatDau)}</span>
                    {!suat.hetHan && (
                      <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium opacity-75 group-hover/slot:opacity-100">
                        <Ticket size={10} />
                        Đặt vé
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
