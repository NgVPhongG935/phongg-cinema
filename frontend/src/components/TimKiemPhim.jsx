import {
  Calendar,
  Clock,
  Film,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { layDanhSachPhim } from '../services/movieService'
import { layDanhSachPersons } from '../services/personService'
import AnhPosterPhim from './AnhPosterPhim'
import PersonDetailModal from './PersonDetailModal'
import { hienThiDoTuoi } from '../utils/locPhim'

const KHOA_LICH_SU = 'phongg_tim_kiem_gan_day'
const SO_LICH_SU_TOI_DA = 6

const docLichSu = () => {
  try {
    return JSON.parse(localStorage.getItem(KHOA_LICH_SU) || '[]')
  } catch {
    return []
  }
}

const luuLichSu = (tuKhoa) => {
  const chuoi = tuKhoa.trim()
  if (!chuoi) return
  const moi = [
    chuoi,
    ...docLichSu().filter((m) => m.toLowerCase() !== chuoi.toLowerCase()),
  ].slice(0, SO_LICH_SU_TOI_DA)
  localStorage.setItem(KHOA_LICH_SU, JSON.stringify(moi))
}

const tachTuKhoa = (chuoi, tuKhoa) => {
  if (!tuKhoa.trim()) return [{ chuoi, khop: false }]
  const regex = new RegExp(
    `(${tuKhoa.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )
  return chuoi
    .split(regex)
    .filter(Boolean)
    .map((phan) => ({
      chuoi: phan,
      khop: phan.toLowerCase() === tuKhoa.trim().toLowerCase(),
    }))
}

const nhanTrangThai = (trangThai) =>
  trangThai === 'UPCOMING'
    ? { nhan: 'Sắp chiếu', mau: 'bg-fuchsia-500/20 text-fuchsia-300' }
    : { nhan: 'Đang chiếu', mau: 'bg-emerald-500/20 text-emerald-300' }

const hienThiChuoiKhop = (chuoi, tuKhoa) =>
  tachTuKhoa(chuoi, tuKhoa).map((phan, i) => (
    <span key={i} className={phan.khop ? 'text-fuchsia-300' : ''}>
      {phan.chuoi}
    </span>
  ))

const DongTimKiem = ({ nhan, noiDung, tuKhoa }) => {
  if (!noiDung) return null
  return (
    <p className="truncate text-xs text-slate-400">
      <span className="text-slate-500">{nhan}: </span>
      {hienThiChuoiKhop(noiDung, tuKhoa)}
    </p>
  )
}

export default function TimKiemPhim({ className = '' }) {
  const [tuKhoa, datTuKhoa] = useState('')
  const [ketQuaPhim, datKetQuaPhim] = useState([])
  const [ketQuaPersons, datKetQuaPersons] = useState([])
  const [phimHot, datPhimHot] = useState([])
  const [lichSu, datLichSu] = useState([])
  const [dangTai, datDangTai] = useState(false)
  const [moPanel, datMoPanel] = useState(false)
  const [moMobile, datMoMobile] = useState(false)
  const [personChon, datPersonChon] = useState(null)

  const khuVuc = useRef(null)
  const oNhap = useRef(null)
  const dieuHuong = useNavigate()
  const viTri = useLocation()
  const [thamSoUrl, datThamSoUrl] = useSearchParams()

  const dangOTrangChu = viTri.pathname === '/'
  const tuKhoaUrl = thamSoUrl.get('tuKhoa') || ''

  useEffect(() => {
    if (dangOTrangChu) datTuKhoa(tuKhoaUrl)
  }, [dangOTrangChu, tuKhoaUrl])

  useEffect(() => {
    layDanhSachPhim({ trangThai: 'SHOWING', size: 8 })
      .then((phanHoi) => datPhimHot((phanHoi.content || phanHoi).slice(0, 6)))
      .catch(() => datPhimHot([]))
    datLichSu(docLichSu())
  }, [])

  useEffect(() => {
    const dongPanel = (suKien) => {
      if (khuVuc.current && !khuVuc.current.contains(suKien.target)) {
        datMoPanel(false)
      }
    }
    document.addEventListener('mousedown', dongPanel)
    return () => document.removeEventListener('mousedown', dongPanel)
  }, [])

  useEffect(() => {
    const phimTat = (suKien) => {
      if ((suKien.ctrlKey || suKien.metaKey) && suKien.key === 'k') {
        suKien.preventDefault()
        oNhap.current?.focus()
        datMoPanel(true)
        datMoMobile(true)
      }
      if (suKien.key === 'Escape') {
        datMoPanel(false)
        datMoMobile(false)
        oNhap.current?.blur()
      }
    }
    document.addEventListener('keydown', phimTat)
    return () => document.removeEventListener('keydown', phimTat)
  }, [])

  useEffect(() => {
    const q = tuKhoa.trim()
    if (!q) {
      datKetQuaPhim([])
      datKetQuaPersons([])
      datDangTai(false)
      return undefined
    }
    datDangTai(true)
    const hen = setTimeout(async () => {
      try {
        const [resPhim, resPersons] = await Promise.all([
          layDanhSachPhim({ tuKhoa: q, size: 8 }).catch(() => []),
          layDanhSachPersons({ search: q }).catch(() => []),
        ])
        datKetQuaPhim(resPhim.content || resPhim || [])
        datKetQuaPersons(resPersons || [])
      } catch {
        datKetQuaPhim([])
        datKetQuaPersons([])
      } finally {
        datDangTai(false)
      }
    }, 280)
    return () => clearTimeout(hen)
  }, [tuKhoa])

  const coKetQua = ketQuaPhim.length > 0 || ketQuaPersons.length > 0 || (!tuKhoa.trim() && phimHot.length > 0)
  const phimTatGoY =
    typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
      ? '⌘K'
      : 'Ctrl+K'

  const chuyenDenKetQua = useCallback(
    (tuKhoaTim) => {
      const chuoi = tuKhoaTim.trim()
      if (!chuoi) return
      luuLichSu(chuoi)
      datLichSu(docLichSu())
      datMoPanel(false)
      datMoMobile(false)
      if (dangOTrangChu) {
        datThamSoUrl({ tuKhoa: chuoi })
      } else {
        dieuHuong(`/?tuKhoa=${encodeURIComponent(chuoi)}`)
      }
    },
    [dangOTrangChu, datThamSoUrl, dieuHuong]
  )

  const chuyenDenPhim = useCallback(
    (phim) => {
      if (tuKhoa.trim()) luuLichSu(tuKhoa)
      datMoPanel(false)
      datMoMobile(false)
      dieuHuong(`/movies/${phim.id}`)
    },
    [dieuHuong, tuKhoa]
  )

  const moChiTietPerson = (person) => {
    if (tuKhoa.trim()) luuLichSu(tuKhoa)
    datMoPanel(false)
    datMoMobile(false)
    datPersonChon(person)
  }

  const xuLySubmit = (suKien) => {
    suKien.preventDefault()
    if (ketQuaPhim.length > 0) {
      chuyenDenPhim(ketQuaPhim[0])
      return
    }
    chuyenDenKetQua(tuKhoa)
  }

  const xoaLichSu = () => {
    localStorage.removeItem(KHOA_LICH_SU)
    datLichSu([])
  }

  const noiDungPanel = (
    <div
      className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-cinema-900/95 shadow-2xl shadow-black/60 backdrop-blur-2xl ${
        moPanel ? 'block' : 'hidden'
      }`}
    >
      {!tuKhoa.trim() && lichSu.length > 0 && (
        <div className="border-b border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Clock size={13} /> Tìm gần đây
            </p>
            <button
              type="button"
              onClick={xoaLichSu}
              className="text-xs text-slate-500 hover:text-rose-300"
            >
              Xóa
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lichSu.map((muc) => (
              <button
                key={muc}
                type="button"
                onClick={() => {
                  datTuKhoa(muc)
                  chuyenDenKetQua(muc)
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-white"
              >
                {muc}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[min(480px,65vh)] overflow-y-auto scrollbar-thin divide-y divide-white/5">
        {/* Loading Indicator */}
        {dangTai && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-fuchsia-400" />
            Đang tìm kiếm phim & nghệ sĩ...
          </div>
        )}

        {/* Empty State */}
        {!dangTai && tuKhoa.trim() && !coKetQua && (
          <div className="px-4 py-8 text-center">
            <Film size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-400">
              Không tìm thấy phim hoặc diễn viên nào cho &ldquo;{tuKhoa}&rdquo;
            </p>
          </div>
        )}

        {/* 1. MỤC NGHỆ SĨ / DIỄN VIÊN / ĐẠO DIỄN */}
        {!dangTai && ketQuaPersons.length > 0 && (
          <div className="p-2 bg-fuchsia-950/20">
            <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
              <User size={13} /> Diễn viên & Đạo diễn ({ketQuaPersons.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {ketQuaPersons.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => moChiTietPerson(p)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/80 p-2 text-left hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10 transition group"
                >
                  <img
                    src={
                      p.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        p.name
                      )}&background=8b5cf6&color=fff`
                    }
                    alt={p.name}
                    className="h-10 w-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        p.name
                      )}&background=8b5cf6&color=fff`
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate group-hover:text-fuchsia-300 transition">
                      {hienThiChuoiKhop(p.name, tuKhoa)}
                    </p>
                    <span className="inline-block text-[10px] text-fuchsia-400/90 font-semibold">
                      {p.roleType === 'DIRECTOR'
                        ? '🎬 Đạo diễn'
                        : p.roleType === 'BOTH'
                        ? '✨ ĐD & Diễn viên'
                        : '🎭 Diễn viên'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. MỤC PHIM ĐANG & SẮP CHIẾU */}
        {!dangTai && (
          <div>
            {!tuKhoa.trim() ? (
              <p className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <TrendingUp size={13} /> Phim hot đang chiếu
              </p>
            ) : ketQuaPhim.length > 0 ? (
              <p className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Film size={13} /> Danh sách Phim ({ketQuaPhim.length})
              </p>
            ) : null}

            {(tuKhoa.trim() ? ketQuaPhim : phimHot).map((phim) => {
              const title = phim.title || ''
              const posterUrl = phim.posterUrl
              const genres = phim.genres || []
              const duration = phim.duration
              const ageRating = phim.ageRating
              const actors = phim.actors || []
              const director = phim.director
              const status = phim.status
              const trangThai = nhanTrangThai(status)

              return (
                <button
                  key={phim.id}
                  type="button"
                  onClick={() => chuyenDenPhim(phim)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5"
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-cinema-800">
                    <AnhPosterPhim
                      src={posterUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm text-white">
                      {tachTuKhoa(title, tuKhoa).map((phan, i) => (
                        <span
                          key={i}
                          className={phan.khop ? 'text-fuchsia-300 font-bold' : ''}
                        >
                          {phan.chuoi}
                        </span>
                      ))}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {genres.slice(0, 2).join(' · ')} · {duration} phút ·{' '}
                      {hienThiDoTuoi(ageRating)}
                    </p>
                    {tuKhoa.trim() && actors.length > 0 && (
                      <DongTimKiem
                        nhan="Diễn viên"
                        noiDung={actors.join(', ')}
                        tuKhoa={tuKhoa}
                      />
                    )}
                    {tuKhoa.trim() && director && (
                      <DongTimKiem
                        nhan="Đạo diễn"
                        noiDung={director}
                        tuKhoa={tuKhoa}
                      />
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${trangThai.mau}`}
                  >
                    {trangThai.nhan}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {tuKhoa.trim() && ketQuaPhim.length > 0 && !dangTai && (
        <button
          type="button"
          onClick={() => chuyenDenKetQua(tuKhoa)}
          className="flex w-full items-center justify-center gap-2 border-t border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-fuchsia-300 transition hover:bg-fuchsia-500/10"
        >
          <Sparkles size={15} /> Xem tất cả kết quả cho &ldquo;{tuKhoa}&rdquo;
        </button>
      )}
    </div>
  )

  const oTimKiem = (
    <form onSubmit={xuLySubmit} className="relative">
      <div className="group relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3.5 text-slate-400 transition group-focus-within:text-fuchsia-400"
          size={18}
        />
        <input
          ref={oNhap}
          value={tuKhoa}
          onChange={(suKien) => {
            datTuKhoa(suKien.target.value)
            datMoPanel(true)
          }}
          onFocus={() => datMoPanel(true)}
          className="w-full rounded-xl border border-white/15 bg-white/95 py-2.5 pl-10 pr-20 text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/30"
          placeholder="Tìm phim, diễn viên, đạo diễn..."
          autoComplete="off"
          spellCheck={false}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {tuKhoa && (
            <button
              type="button"
              onClick={() => {
                datTuKhoa('')
                datKetQuaPhim([])
                datKetQuaPersons([])
                if (dangOTrangChu) datThamSoUrl({})
                oNhap.current?.focus()
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 lg:inline">
            {phimTatGoY}
          </kbd>
        </div>
      </div>
      {noiDungPanel}
    </form>
  )

  return (
    <div
      ref={khuVuc}
      className={`flex flex-1 items-center justify-center ${className}`}
    >
      <div className="hidden w-full max-w-lg md:block">{oTimKiem}</div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => {
            datMoMobile(true)
            setTimeout(() => oNhap.current?.focus(), 50)
          }}
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
          aria-label="Tìm kiếm"
        >
          <Search size={20} />
        </button>

        {moMobile && (
          <div className="fixed inset-0 z-50 bg-black/80 p-4 pt-5 backdrop-blur-sm">
            <div className="mx-auto max-w-lg">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">
                  Tìm kiếm phim, diễn viên, đạo diễn
                </p>
                <button
                  type="button"
                  onClick={() => datMoMobile(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
              {oTimKiem}
            </div>
          </div>
        )}
      </div>

      {personChon && (
        <PersonDetailModal
          person={personChon}
          onClose={() => datPersonChon(null)}
        />
      )}
    </div>
  )
}
