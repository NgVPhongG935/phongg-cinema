import { Clock, Star, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { hienThiDoTuoi } from '../utils/locPhim'
import AnhPosterPhim from './AnhPosterPhim'
import { layUrlPosterPhim } from '../utils/anhPosterPhim'

function nhanDoTuoi(tuoi) {
  const goc = hienThiDoTuoi(tuoi)
  if (!goc) return ''
  if (goc === 'P' || goc === 'K') return goc
  if (/^\d+$/.test(goc)) return `T${goc}`
  return goc
}

export default function MovieCard({ phim, chiSo = 0 }) {
  const title = phim.title || phim.tenPhim || 'Phim'
  const genres = phim.genres || phim.theLoai || []
  const theLoaiDau = genres[0] || 'Phim'
  const rawPoster = layUrlPosterPhim(phim)
  const duration = phim.duration ?? phim.thoiLuong ?? 0
  const ageRating = nhanDoTuoi(phim.ageRating || phim.doTuoi)
  const theLoaiChuoi = genres.join(' · ') || 'Phim chiếu rạp'
  const dinhDang = phim.dinhDang || phim.format || '2D'
  const rating = phim.rating

  return (
    <article
      style={{ animationDelay: `${(chiSo % 20) * 40}ms` }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-purple-400/50 hover:shadow-[0_12px_32px_rgba(168,85,247,0.22)] animate-fade-in-up"
    >
      <Link to={`/movies/${phim.id}`} className="relative block aspect-[2/3] overflow-hidden rounded-t-xl bg-cinema-800">
        <AnhPosterPhim
          src={rawPoster}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0714] via-transparent to-transparent opacity-70" />

        <div className="absolute left-2 top-2 flex max-w-[70%] flex-wrap items-center gap-1">
          {ageRating && (
            <span className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow">
              {ageRating}
            </span>
          )}
          <span className="rounded-md border border-white/10 bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 backdrop-blur-md">
            {dinhDang}
          </span>
        </div>

        {rating != null && rating !== '' && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-black/65 px-1.5 py-0.5 text-[10px] font-extrabold text-yellow-300 backdrop-blur-md">
            <Star size={11} fill="currentColor" />
            {rating}
          </div>
        )}

        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-md bg-gradient-to-r from-purple-600/90 to-pink-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
          {theLoaiDau}
        </span>
      </Link>

      <div className="flex min-h-[8.5rem] flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-white group-hover:text-purple-200 sm:text-[15px]">
          {title}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
          <Clock size={12} className="shrink-0 text-purple-400" />
          <span>{duration ? `${duration} phút` : '—'}</span>
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-purple-300/80">{theLoaiChuoi}</p>

        <Link
          to={`/movies/${phim.id}/schedule`}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-purple-900/40 transition hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/30"
        >
          <Ticket size={14} />
          Đặt vé
        </Link>
      </div>
    </article>
  )
}
