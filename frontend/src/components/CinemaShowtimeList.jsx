import { Calendar, CalendarClock, ChevronRight, Clock, Film, Loader2, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { layLichChieuHomNayTheoRap } from '../services/showtimeService'
import { dinhDangGio } from '../utils/formatters'
import { hienThiDoTuoi } from '../utils/locPhim'
import { locSuatChieuDuyNhat, nhomSuatTheoGio, tenPhongSuat, khoaSuatChieu } from '../utils/locSuatChieu'
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
      .then((ds) => {
        // #region agent log
        const movies = Array.isArray(ds) ? ds : []
        const suat = movies.flatMap((p) => p.showtimes || p.danhSachSuat || [])
        const ids = suat.map((s) => s.id)
        const slots = suat.map((s) => `${s.startTime || s.thoiGianBatDau}|${s.roomId || s.maPhong}`)
        const gio = suat.map((s) => s.startTime || s.thoiGianBatDau)
        const after = locSuatChieuDuyNhat(suat)
        const gioGroups = Object.values(nhomSuatTheoGio(suat)).reduce((n, ds) => n + ds.length, 0)
        fetch('http://127.0.0.1:7246/ingest/4225d522-756d-4686-a16f-b71753054886',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'12750d'},body:JSON.stringify({sessionId:'12750d',runId:'post-fix',hypothesisId:'C',location:'CinemaShowtimeList.jsx:fetch',message:'home cinema-day payload',data:{movieCount:movies.length,suatCount:suat.length,uniqueIds:new Set(ids).size,uniqueSlots:new Set(slots).size,uniqueGio:new Set(gio).size,afterDedupe:after.length,gioGroups,hasBothFields:movies.some((p)=>Array.isArray(p.showtimes)&&Array.isArray(p.danhSachSuat)),sampleRooms:[...new Set(suat.map((s)=>s.roomId||s.maPhong))].slice(0,12)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        datDanhSachPhim(ds)
      })
      .catch(() => datDanhSachPhim([]))
      .finally(() => datDangTai(false))
  }, [maRap, ngayChieu])

  if (!maRap) return null

  const tongSoSuat = danhSachPhim.reduce(
    (tong, p) => tong + locSuatChieuDuyNhat(p.showtimes || p.danhSachSuat || []).length,
    0,
  )

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

              <div className="flex min-w-0 flex-col gap-3 sm:max-w-lg sm:items-end lg:max-w-2xl">
                {Object.entries(nhomSuatTheoGio(phim.showtimes || phim.danhSachSuat || [])).map(([dinhDang, cacGio]) => (
                  <div key={dinhDang} className="w-full">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-300/80 sm:text-right">
                      {dinhDang}
                    </p>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {cacGio.map((nhom) => {
                        const gio = dinhDangGio(nhom.startTime)
                        const hetHanHet = nhom.phong.every((s) => s.hetHan || s.expired)
                        return (
                          <div key={`${dinhDang}|${nhom.gioKey}`} className="flex flex-wrap items-center justify-end gap-1.5">
                            <span className={`min-w-[3.2rem] text-sm font-bold ${hetHanHet ? 'text-slate-600 line-through' : 'text-white'}`}>
                              {gio}
                            </span>
                            {nhom.phong.map((suat) => {
                              const phong = tenPhongSuat(suat)
                              return (
                                <button
                                  key={khoaSuatChieu(suat)}
                                  type="button"
                                  disabled={suat.hetHan || suat.expired}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dieuHuong(`/booking/${suat.id}`)
                                  }}
                                  title={[tenRap, phong && `Phòng ${phong}`, gio].filter(Boolean).join(' · ')}
                                  className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                                    suat.hetHan || suat.expired
                                      ? 'cursor-not-allowed border-white/5 text-slate-600 opacity-40'
                                      : 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-600 hover:text-white'
                                  }`}
                                >
                                  {phong || 'Phòng'}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
