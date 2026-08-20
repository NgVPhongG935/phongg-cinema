import { Clapperboard, Clock, ExternalLink, Film, Globe, Star, Ticket, Users, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getYouTubeEmbedUrl } from '../utils/chuyenLinkYoutube'
import { hienThiDoTuoiDayDu } from '../utils/locPhim'
import { layUrlPosterPhim } from '../utils/anhPosterPhim'
import AnhPosterPhim from './AnhPosterPhim'

export default function ModalTrailer({
  mo,
  phim = null,
  movie = null,
  title: titleProp,
  trailerUrl: trailerUrlProp,
  onDong,
}) {
  const dieuHuong = useNavigate()
  const thongTinPhim = movie || phim

  const rawTrailer = thongTinPhim?.trailerUrl || trailerUrlProp || ''
  const embedUrl = getYouTubeEmbedUrl(rawTrailer, true)

  const title = thongTinPhim?.title || titleProp || 'Trailer phim'
  const posterUrl = layUrlPosterPhim(thongTinPhim)
  const genres = thongTinPhim?.genres || []
  const duration = thongTinPhim?.duration
  const ageRating = thongTinPhim?.ageRating
  const director = thongTinPhim?.director
  const actors = thongTinPhim?.actors || []
  const description = thongTinPhim?.description
  const language = thongTinPhim?.language
  const rating = thongTinPhim?.rating || (thongTinPhim?.id ? Number((7.5 + (thongTinPhim.id.charCodeAt(0) % 20) / 10).toFixed(1)) : 8.5)

  useEffect(() => {
    if (!mo) return undefined
    const xuLyEsc = (suKien) => {
      if (suKien.key === 'Escape') onDong?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', xuLyEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', xuLyEsc)
    }
  }, [mo, onDong])

  if (!mo) return null

  const xuLyChonSuatChieu = () => {
    onDong?.()
    if (thongTinPhim?.id) {
      dieuHuong(`/movies/${thongTinPhim.id}/schedule`, { state: { phim: thongTinPhim } })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-3 sm:p-4 backdrop-blur-xl animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer ${title}`}
      onClick={onDong}
    >
      <div
        className="relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-cinema-950/95 shadow-[0_0_80px_rgba(217,70,239,0.25)] backdrop-blur-2xl"
        onClick={(suKien) => suKien.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-fuchsia-950/60 via-cinema-900/50 to-[#8364ff]/20 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600/30 text-fuchsia-400">
              <Film size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold text-white sm:text-lg">
                  {title}
                </h2>
                {ageRating && (
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                    {hienThiDoTuoiDayDu(ageRating)}
                  </span>
                )}
                {genres[0] && (
                  <span className="rounded-md bg-fuchsia-500/20 px-2 py-0.5 text-xs font-semibold text-fuchsia-300">
                    {genres[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDong}
            className="group ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/20 hover:text-white"
            aria-label="Đóng cửa sổ"
          >
            <X size={20} className="transition group-hover:rotate-90" />
          </button>
        </div>

        {/* 3. Khung Video 16:9 phát trực tiếp với <iframe> chuẩn */}
        <div className="relative aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              className="h-full w-full aspect-video border-0"
              src={embedUrl}
              title={title || 'Trailer'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
              <Film size={48} className="text-slate-600" />
              <p className="text-sm">Trailer phim đang được cập nhật hoặc không khả dụng.</p>
              {thongTinPhim?.id && (
                <Link
                  to={`/movies/${thongTinPhim.id}`}
                  onClick={onDong}
                  className="nut-chinh mt-2 inline-flex items-center gap-2 text-xs"
                >
                  Xem thông tin chi tiết phim
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Khung Thông Tin Chi Tiết & CTA */}
        {thongTinPhim && (
          <div className="border-t border-white/10 bg-cinema-900/50 p-5 sm:p-6">
            <div className="grid gap-6 md:grid-cols-[140px_1fr]">
              {/* Cột trái: Poster & Điểm số */}
              <div className="hidden flex-col items-center md:flex">
                <div className="h-44 w-32 overflow-hidden rounded-2xl border border-white/10 bg-cinema-800 shadow-xl">
                  <AnhPosterPhim
                    src={posterUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {rating && (
                  <div className="mt-2.5 flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                    <Star size={13} fill="currentColor" />
                    <span>{rating}/10</span>
                  </div>
                )}
              </div>

              {/* Cột phải: Thông tin phim & Badges */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 sm:text-sm">
                    {duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={15} className="text-fuchsia-400" />
                        {duration} phút
                      </span>
                    )}
                    {language && (
                      <span className="flex items-center gap-1">
                        <Globe size={15} className="text-sky-400" />
                        {language}
                      </span>
                    )}
                    {genres.length > 0 && (
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                        {genres.join(', ')}
                      </span>
                    )}
                  </div>

                  {description && (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
                      {description}
                    </p>
                  )}

                  {(director || actors.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                      {director && (
                        <p>
                          <span className="font-semibold text-slate-300">Đạo diễn:</span> {director}
                        </p>
                      )}
                      {actors.length > 0 && (
                        <p className="line-clamp-1">
                          <span className="font-semibold text-slate-300">Diễn viên:</span>{' '}
                          {actors.slice(0, 4).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Call To Action Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                  <Link
                    to={`/movies/${thongTinPhim.id}`}
                    onClick={onDong}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white sm:text-sm"
                  >
                    Xem chi tiết đầy đủ <ExternalLink size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={xuLyChonSuatChieu}
                    className="nut-chinh nut-neon-cyber inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-600/40 transition hover:scale-105"
                  >
                    <Ticket size={18} />
                    🎟️ ĐẶT VÉ NGAY
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
