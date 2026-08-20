import {
  Calendar,
  Film,
  Sparkles,
  Ticket,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { layPhimTheoPerson } from '../services/personService'

export default function PersonDetailModal({ person, onClose }) {
  const [phimThamGia, datPhimThamGia] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!person) return
    let huy = false
    const taiPhim = async () => {
      datDangTai(true)
      try {
        const list = await layPhimTheoPerson(person.id || person.name)
        if (!huy) datPhimThamGia(list || [])
      } catch {
        if (!huy) datPhimThamGia([])
      } finally {
        if (!huy) datDangTai(false)
      }
    }
    taiPhim()
    return () => {
      huy = true
    }
  }, [person])

  if (!person) return null

  const avatar =
    person.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person.name || 'Artist'
    )}&background=8b5cf6&color=fff&size=256`

  const renderBadge = (role) => {
    if (role === 'DIRECTOR')
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
          🎬 Đạo diễn
        </span>
      )
    if (role === 'BOTH')
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-xs font-bold text-fuchsia-300">
          ✨ Đạo diễn & Diễn viên
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-300">
        🎭 Diễn viên
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="the-kinh relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>

        {/* Thông tin nghệ sĩ */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/10 pb-6">
          <img
            src={avatar}
            alt={person.name}
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover ring-4 ring-fuchsia-500/20 shadow-xl shadow-fuchsia-950/40"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                person.name
              )}&background=8b5cf6&color=fff&size=256`
            }}
          />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{person.name}</h2>
              {renderBadge(person.roleType)}
            </div>

            {person.birthDate && (
              <p className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 font-medium">
                <Calendar size={14} className="text-fuchsia-400" />
                Ngày sinh: <span className="text-slate-200">{person.birthDate}</span>
              </p>
            )}

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 font-normal">
              {person.bio ||
                `${person.name} là một nghệ sĩ tài năng với nhiều cống hiến xuất sắc cho nền điện ảnh.`}
            </p>
          </div>
        </div>

        {/* Danh sách phim tham gia */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Film size={18} className="text-fuchsia-400" />
              Các Phim Đã Tham Gia ({phimThamGia.length})
            </h3>
          </div>

          {dangTai ? (
            <div className="py-10 text-center text-slate-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
              <p className="mt-2 text-xs">Đang tìm các tác phẩm liên quan...</p>
            </div>
          ) : phimThamGia.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-slate-400">
              Hiện tại rạp chưa có lịch chiếu hoặc phim mới của nghệ sĩ này.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {phimThamGia.map((phim) => (
                <div
                  key={phim.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 hover:border-fuchsia-500/40 transition group"
                >
                  <img
                    src={phim.posterUrl || phim.anhPoster || 'https://picsum.photos/seed/movie/200/300'}
                    alt={phim.title || phim.tenPhim}
                    className="h-24 w-16 rounded-xl object-cover shrink-0 shadow-md"
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/seed/movie/200/300'
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-fuchsia-300 transition">
                        {phim.title || phim.tenPhim}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {Array.isArray(phim.genres) ? phim.genres.join(', ') : phim.theLoai || 'Phim Chiếu Rạp'}
                      </p>
                      {phim.duration && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Thời lượng: {phim.duration} phút
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        to={`/movies/${phim.id}`}
                        onClick={onClose}
                        className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition"
                      >
                        Chi tiết
                      </Link>
                      <Link
                        to={`/movies/${phim.id}/schedule`}
                        onClick={onClose}
                        className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md hover:brightness-110 transition flex items-center gap-1"
                      >
                        <Ticket size={11} />
                        Đặt vé
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
