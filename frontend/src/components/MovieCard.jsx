import { CalendarDays, Clock, Star, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { hienThiDoTuoi } from '../utils/locPhim'
import AnhPosterPhim from './AnhPosterPhim'
import { layUrlPosterPhim } from '../utils/anhPosterPhim'

export default function MovieCard({ phim, chiSo = 0 }) {
  const title = phim.title || 'Phim'
  const theLoaiDau = phim.genres?.[0] || 'Phim'
  const rawPoster = layUrlPosterPhim(phim)
  const duration = phim.duration ?? 0
  const ageRating = phim.ageRating
  const theLoaiChuoi = phim.genres?.join(' · ') || ''

  return (
    <Link
      to={`/movies/${phim.id}`}
      style={{ animationDelay: `${(chiSo % 12) * 50}ms` }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/60 hover:shadow-[0_10px_30px_rgba(168,85,247,0.3)] animate-fade-in-up"
    >
      {/* Khung Poster Phim */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-cinema-800">
        <AnhPosterPhim
          src={rawPoster}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Lớp phủ chuyển màu gradient trên poster */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0714] via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges góc trên trái */}
        <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
          {ageRating && (
            <span className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md">
              {hienThiDoTuoi(ageRating)}
            </span>
          )}
          <span className="rounded-lg border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 backdrop-blur-md">
            {phim.dinhDang || '2D'}
          </span>
        </div>

        {/* Badge đánh giá góc trên phải */}
        {phim.rating && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-extrabold text-yellow-300 backdrop-blur-md shadow">
            <Star size={11} fill="currentColor" />
            <span>{phim.rating}</span>
          </div>
        )}

        {/* Badge thể loại góc dưới trái */}
        <div className="absolute bottom-2 left-2">
          <span className="rounded-lg bg-gradient-to-r from-purple-600/90 to-pink-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-md">
            {theLoaiDau}
          </span>
        </div>
      </div>

      {/* Thông tin phim phía dưới */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-purple-200 sm:text-base">
            {title}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} className="text-purple-400" />
            <span>{duration} phút</span>
          </div>

          <p className="mt-1 truncate text-xs text-purple-300/80">
            {theLoaiChuoi}
          </p>
        </div>

        {/* Nút bấm Đặt vé hover */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-[11px] font-medium text-gray-400 group-hover:text-purple-300 transition-colors">
            Chi tiết &amp; Suất chiếu
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all shadow">
            <Ticket size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
