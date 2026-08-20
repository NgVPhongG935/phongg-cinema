import { Clapperboard, Clock, Play, Ticket, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DanhGiaPhim from '../components/DanhGiaPhim'
import AnhPosterPhim from '../components/AnhPosterPhim'
import ModalTrailer from '../components/ModalTrailer'
import PersonDetailModal from '../components/PersonDetailModal'
import { layChiTietPhim } from '../services/movieService'
import { hienThiDoTuoiDayDu } from '../utils/locPhim'
import { layUrlPosterPhim } from '../utils/anhPosterPhim'

export default function MovieDetailPage() {
  const { id } = useParams()
  const [phim, datPhim] = useState(null)
  const [moTrailer, datMoTrailer] = useState(false)
  const [personChon, datPersonChon] = useState(null)

  useEffect(() => {
    layChiTietPhim(id).then(datPhim).catch(() => datPhim(null))
  }, [id])

  if (!phim) return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid animate-pulse gap-8 md:grid-cols-[280px_1fr]">
        <div className="mx-auto h-[380px] w-64 rounded-2xl bg-white/10 shadow-2xl md:w-full" />
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-white/10" />
            <div className="h-6 w-24 rounded-full bg-white/10" />
          </div>
          <div className="h-10 w-3/4 rounded-xl bg-white/10" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10" />
          </div>
          <div className="h-28 w-full rounded-2xl bg-white/5" />
          <div className="flex gap-3">
            <div className="h-11 w-44 rounded-xl bg-fuchsia-600/30" />
            <div className="h-11 w-36 rounded-xl bg-white/10" />
          </div>
        </div>
      </section>
    </div>
  )

  const title = phim.title || phim.tenPhim || 'Chi tiết phim'
  const genres = phim.genres || []
  const duration = phim.duration
  const language = phim.language
  const ageRating = phim.ageRating
  const director = phim.director
  const actors = phim.actors || []
  const description = phim.description
  const trailerUrl = phim.trailerUrl
  const rawPoster = layUrlPosterPhim(phim)
  const coTrailer = Boolean(trailerUrl?.trim())

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-8 md:grid-cols-[280px_1fr]">
        <AnhPosterPhim
          className="mx-auto w-64 rounded-2xl object-cover shadow-2xl md:w-full"
          src={rawPoster}
          alt={title}
        />
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {genres.map((item) => (
              <span key={item} className="rounded-full bg-cinema-500/20 px-3 py-1 text-xs text-cinema-500">
                {item}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-black md:text-5xl">{title}</h1>
          <div className="mt-4 flex gap-5 text-sm text-slate-400">
            {duration && <span className="flex items-center gap-1"><Clock size={16} />{duration} phút</span>}
            {language && <span>{language}</span>}
            {ageRating && <span>{hienThiDoTuoiDayDu(ageRating)}</span>}
          </div>
          {(director || actors.length > 0) && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {director && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/80">
                    <Clapperboard size={14} /> Đạo diễn
                  </p>
                  <button
                    type="button"
                    onClick={() => datPersonChon({ name: director, roleType: 'DIRECTOR' })}
                    className="mt-2 text-base font-bold text-white hover:text-fuchsia-300 transition text-left flex items-center gap-2 group"
                  >
                    <span>{director}</span>
                    <span className="text-[10px] text-fuchsia-400 font-bold bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20 group-hover:bg-fuchsia-500/20">
                      Hồ sơ & Phim ↗
                    </span>
                  </button>
                </div>
              )}
              {actors.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/80">
                    <Users size={14} /> Diễn viên (Bấm để xem danh sách phim)
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {actors.map((ten) => (
                      <button
                        key={ten}
                        type="button"
                        onClick={() => datPersonChon({ name: ten, roleType: 'ACTOR' })}
                        className="rounded-full border border-white/10 bg-cinema-800/80 px-3.5 py-1.5 text-sm text-slate-200 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/15 hover:text-white transition flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{ten}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {description && <p className="mt-6 max-w-3xl leading-7 text-slate-300">{description}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/movies/${id}/schedule`} className="nut-chinh inline-flex items-center gap-2">
              <Ticket size={18} />Chọn suất chiếu
            </Link>
            {coTrailer && (
              <button type="button" onClick={() => datMoTrailer(true)} className="nut-glass-trailer inline-flex items-center gap-2">
                <Play size={18} fill="currentColor" />
                Xem Trailer
              </button>
            )}
          </div>
        </div>
      </section>
      <DanhGiaPhim maPhim={id} />
      <ModalTrailer
        mo={moTrailer}
        movie={phim}
        title={title}
        trailerUrl={trailerUrl}
        onDong={() => datMoTrailer(false)}
      />
      {personChon && (
        <PersonDetailModal
          person={personChon}
          onClose={() => datPersonChon(null)}
        />
      )}
    </div>
  )
}
