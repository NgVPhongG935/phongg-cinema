import { CalendarClock, ChevronRight, Clock, Film, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { layLichChieuHomNayTheoRap } from '../services/showtimeService'
import { dinhDangGio } from '../utils/formatters'
import { hienThiDoTuoi } from '../utils/locPhim'
import { getUniqueShowtimes, gioChieuDuyNhat, gomSuatPhim, khoaSuatChieu, nhomTheoDinhDangVaGio, tenPhongSuat } from '../utils/locSuatChieu'
import AnhPosterPhim from './AnhPosterPhim'

function taoDanhSach7Ngay() {
  const danhSach = []
  const homNay = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(homNay)
    d.setDate(homNay.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const thu = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' })
    danhSach.push({ iso, thu, ngay: d.getDate(), thang: `Th${d.getMonth() + 1}`, isToday: i === 0 })
  }
  return danhSach
}

function nhanNgay(iso) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function CinemaShowtimeList({ maRap, tenRap }) {
  const dieuHuong = useNavigate()
  const [danhSachPhim, datDanhSachPhim] = useState([])
  const [dangTai, datDangTai] = useState(false)
  const [ngayChieu, datNgayChieu] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const danhSach7Ngay = useMemo(() => taoDanhSach7Ngay(), [])

  useEffect(() => {
    if (!maRap) {
      datDanhSachPhim([])
      return
    }
    datDangTai(true)
    layLichChieuHomNayTheoRap(maRap, ngayChieu)
      .then((ds) => {
        const movies = Array.isArray(ds) ? ds : []
        const afterHours = movies.map(gomSuatPhim)
        // #region agent log
        const suat = movies.flatMap((p) => [...(p.showtimes || []), ...(p.danhSachSuat || [])])
        const after = getUniqueShowtimes(suat)
        const hours = gioChieuDuyNhat(suat)
        fetch('http://127.0.0.1:7246/ingest/4225d522-756d-4686-a16f-b71753054886',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'12750d'},body:JSON.stringify({sessionId:'12750d',runId:'post-fix',hypothesisId:'C',location:'CinemaShowtimeList.jsx:fetch',message:'home cinema-day payload',data:{movieCount:movies.length,suatCount:suat.length,afterDedupe:after.length,uniqueHours:hours.length,hoursAfterGom:afterHours.reduce((n,p)=>(p.showtimes||[]).length,0),sampleHours:(afterHours[0]?.showtimes||[]).map((s)=>s.startTime)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        datDanhSachPhim(afterHours)
      })
      .catch(() => datDanhSachPhim([]))
      .finally(() => datDangTai(false))
  }, [maRap, ngayChieu])

  if (!maRap) return null

  const tongGio = danhSachPhim.reduce(
    (tong, p) => tong + gioChieuDuyNhat(p.showtimes || p.danhSachSuat || []).length,
    0,
  )

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-cinema-900/60 via-cinema-950/80 to-fuchsia-950/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            <CalendarClock size={15} />
            Suất chiếu
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{tenRap || 'Rạp đã chọn'}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{nhanNgay(ngayChieu)}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {danhSachPhim.length} phim · {tongGio} khung giờ
        </div>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {danhSach7Ngay.map((item) => {
          const dangChon = item.iso === ngayChieu
          return (
            <button
              key={item.iso}
              type="button"
              onClick={() => datNgayChieu(item.iso)}
              className={`flex min-w-[72px] shrink-0 flex-col items-center rounded-2xl border py-2 ${
                dangChon
                  ? 'border-fuchsia-400 bg-gradient-to-br from-fuchsia-600 to-cinema-500 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="text-[11px] font-semibold">{item.thu}</span>
              <span className="text-base font-black">{item.ngay}</span>
              <span className="text-[10px] opacity-80">{item.thang}</span>
            </button>
          )
        })}
      </div>

      {dangTai && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 size={22} className="animate-spin text-fuchsia-400" />
          Đang tải suất chiếu...
        </div>
      )}

      {!dangTai && danhSachPhim.length === 0 && (
        <div className="rounded-2xl border border-white/10 py-12 text-center text-slate-400">
          <Film size={36} className="mx-auto mb-2 text-slate-600" />
          <p className="font-semibold text-slate-300">Không có suất chiếu cho ngày đã chọn</p>
        </div>
      )}

      {!dangTai && danhSachPhim.length > 0 && (
        <div className="flex flex-col gap-3">
          {danhSachPhim.map((phim) => {
            const nhom = nhomTheoDinhDangVaGio(phim.showtimes || phim.danhSachSuat || [])
            return (
              <article
                key={phim.movieId || phim.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-cinema-800"
                    onClick={() => dieuHuong(`/movies/${phim.movieId || phim.id}`)}
                  >
                    <AnhPosterPhim src={phim.posterUrl} alt={phim.title} className="h-full w-full object-cover" placeholderText="Poster" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-2 text-left"
                      onClick={() => dieuHuong(`/movies/${phim.movieId || phim.id}`)}
                    >
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-white hover:text-fuchsia-300">{phim.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {phim.ageRating && (
                            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                              {hienThiDoTuoi(phim.ageRating)}
                            </span>
                          )}
                          {phim.duration && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} className="text-fuchsia-400" />
                              {phim.duration} phút
                            </span>
                          )}
                          <span>{nhanNgay(ngayChieu)}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {tenRap} · Xem chi tiết <ChevronRight size={12} className="inline" />
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                  {Object.entries(nhom).map(([dinhDang, danhSachGio]) => (
                    <div key={dinhDang}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-300/90">
                        {dinhDang}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {danhSachGio.map((suat) => {
                          const gio = dinhDangGio(suat.startTime || suat.thoiGianBatDau)
                          const phong = tenPhongSuat(suat)
                          const hetHan = suat.hetHan || suat.expired
                          return (
                            <button
                              key={khoaSuatChieu(suat)}
                              type="button"
                              disabled={hetHan}
                              onClick={() => dieuHuong(`/booking/${suat.id}`)}
                              title={`${tenRap} · ${dinhDang} · Phòng ${phong} · ${gio}`}
                              className={`flex min-w-[4.5rem] flex-col items-center rounded-xl border px-3 py-2 text-sm font-bold ${
                                hetHan
                                  ? 'cursor-not-allowed border-white/5 text-slate-600 line-through opacity-40'
                                  : 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-600 hover:text-white'
                              }`}
                            >
                              <span>{gio}</span>
                              {phong && <span className="mt-0.5 text-[10px] font-medium opacity-80">P.{phong}</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
