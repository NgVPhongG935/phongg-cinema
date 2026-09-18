import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BannerSection from '../components/BannerSection'
import CinemaShowtimeList from '../components/CinemaShowtimeList'
import MovieList from '../components/MovieList'
import QuickCinemaLocator from '../components/QuickCinemaLocator'
import ThanhLocPhim from '../components/ThanhLocPhim'
import { useViTriRap } from '../context/ViTriRapContext'
import { useDuLieuTrangChu } from '../hooks/useCatalogQueries'
import { KICH_THUOC_TRANG_CHU } from '../services/homeService'
import { CHI_SO_LOC_RONG, KIEU_SAP_XEP, locVaSapXepPhim } from '../utils/locPhim'
import { layDanhSachRapCoSuat } from '../utils/quickCinemaLocator'

export default function HomePage() {
  const movieSectionRef = useRef(null)
  const [thamSoUrl, datThamSoUrl] = useSearchParams()
  const [trangThai, datTrangThai] = useState('SHOWING')
  const [theLoaiDuocChon, datTheLoaiDuocChon] = useState('TAT_CA')
  const [rapDuocChon, datRapDuocChon] = useState('TAT_CA')
  const [dinhDangDuocChon, datDinhDangDuocChon] = useState('TAT_CA')
  const [doTuoiDuocChon, datDoTuoiDuocChon] = useState('TAT_CA')
  const [kieuSapXep, datKieuSapXep] = useState(KIEU_SAP_XEP.MOI_NHAT)
  const [maRapWidget, datMaRapWidget] = useState(null)
  const { rapGanNhat } = useViTriRap()

  const trangHienTai = Math.max(0, (parseInt(thamSoUrl.get('page'), 10) || 1) - 1)
  const tuKhoa = thamSoUrl.get('tuKhoa') || undefined

  const { data, isLoading, isFetching, isError, refetch } = useDuLieuTrangChu({
    trangThai,
    page: trangHienTai,
    tuKhoa,
    size: KICH_THUOC_TRANG_CHU,
  })

  const danhSachPhim = data?.danhSachPhim || []
  const danhSachRap = data?.danhSachRap || []
  const chiSoLocPhim = data?.chiSoLocPhim || CHI_SO_LOC_RONG
  const tongTrang = data?.tongTrang || 0
  const tongPhim = data?.tongPhim || 0
  const dangTai = isLoading || (isFetching && !data)

  const rapGanNhatId = rapGanNhat(danhSachRap)?.id || null
  const rapWidget = danhSachRap.find((rap) => rap.id === maRapWidget) || null
  const danhSachRapCoSuat = useMemo(() => layDanhSachRapCoSuat(chiSoLocPhim), [chiSoLocPhim])

  const OFFSET_NAVBAR = 90

  const cuonToiDanhSachPhim = () => {
    const element = movieSectionRef.current
    if (!element) return
    const y = element.getBoundingClientRect().top + window.pageYOffset - OFFSET_NAVBAR
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const danhSachPhimLoc = useMemo(
    () =>
      locVaSapXepPhim(
        danhSachPhim,
        { theLoaiDuocChon, rapDuocChon, dinhDangDuocChon, doTuoiDuocChon, kieuSapXep, rapGanNhatId },
        chiSoLocPhim,
      ),
    [danhSachPhim, theLoaiDuocChon, rapDuocChon, dinhDangDuocChon, doTuoiDuocChon, kieuSapXep, rapGanNhatId, chiSoLocPhim],
  )

  const chuyenTrang = (trangMoi) => {
    if (trangMoi < 0 || trangMoi >= tongTrang || trangMoi === trangHienTai) return
    const paramsMoi = new URLSearchParams(thamSoUrl)
    if (trangMoi === 0) {
      paramsMoi.delete('page')
    } else {
      paramsMoi.set('page', String(trangMoi + 1))
    }
    datThamSoUrl(paramsMoi)
    cuonToiDanhSachPhim()
  }

  const chuyenTabTrangThai = (ttMoi) => {
    if (ttMoi === trangThai) return
    datTrangThai(ttMoi)
    const paramsMoi = new URLSearchParams(thamSoUrl)
    paramsMoi.delete('page')
    datThamSoUrl(paramsMoi)
    cuonToiDanhSachPhim()
  }

  const danhSachTrang = useMemo(() => {
    if (tongTrang <= 1) return []
    return Array.from({ length: tongTrang }, (_, i) => i)
      .filter((i) => i === 0 || i === tongTrang - 1 || Math.abs(i - trangHienTai) <= 1)
      .reduce((acc, i, idx, arr) => {
        if (idx > 0 && i - arr[idx - 1] > 1) acc.push('…')
        acc.push(i)
        return acc
      }, [])
  }, [tongTrang, trangHienTai])

  return (
    <div className="relative min-h-screen bg-[#0a0714] text-gray-100">
      <div className="pointer-events-none fixed -left-40 -top-40 z-0 h-96 w-96 rounded-full bg-purple-600/20 blur-[130px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 z-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[150px]" />
      <div className="pointer-events-none fixed left-1/2 top-1/3 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[140px]" />

      <div className="relative z-10">
        {isError && (
          <div role="alert" className="mx-auto max-w-7xl px-4 pt-6">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
              <p>Chưa tải được dữ liệu phim. Máy chủ có thể đang khởi động, bạn thử lại sau ít phút nhé.</p>
              <button type="button" onClick={() => refetch()} disabled={isFetching}
                className="mt-2 rounded-lg bg-amber-400/20 px-4 py-2 font-semibold disabled:opacity-50">
                {isFetching ? 'Đang tải…' : 'Thử lại'}
              </button>
            </div>
          </div>
        )}
        {dangTai && (
          <div role="status" aria-live="polite" className="mx-auto max-w-7xl px-4 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 backdrop-blur-md">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,.9)]" />
              API Render miễn phí đang khởi động. Lần mở đầu có thể mất khoảng một phút; trang sẽ tự tải lại dữ liệu.
            </div>
          </div>
        )}
        <BannerSection
          danhSachPhim={trangThai === 'SHOWING' && trangHienTai === 0 ? danhSachPhim : null}
          chiSoLocPhim={chiSoLocPhim}
        />

        <section className="mx-auto max-w-7xl px-4 pb-4 pt-8">
          <QuickCinemaLocator
            danhSachRap={danhSachRap}
            maRapDuocChon={maRapWidget}
            onChonRap={datMaRapWidget}
            danhSachRapCoSuat={danhSachRapCoSuat}
          />
          <CinemaShowtimeList maRap={maRapWidget} tenRap={rapWidget?.tenRap} />
        </section>

        <section
          ref={movieSectionRef}
          id="movie-list-section"
          className="mx-auto max-w-7xl px-4 py-12 scroll-mt-[90px]"
        >
          <div className="mb-7 mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="tieu-de-cyber text-2xl font-bold sm:text-3xl">Phim đang chiếu</h2>
              <p className="mt-1 text-sm text-slate-400">
                {tongPhim > 0
                  ? `Trang ${trangHienTai + 1}/${Math.max(tongTrang, 1)} · ${tongPhim} phim · ${KICH_THUOC_TRANG_CHU}/trang`
                  : 'Lọc nhanh theo thể loại, rạp, định dạng và sắp xếp yêu thích'}
              </p>
            </div>

            <div className="flex rounded-full border border-white/10 bg-white/5 p-1 shadow-inner backdrop-blur-md">
              <button
                type="button"
                onClick={() => chuyenTabTrangThai('SHOWING')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition sm:text-sm ${
                  trangThai === 'SHOWING'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Đang chiếu
              </button>
              <button
                type="button"
                onClick={() => chuyenTabTrangThai('UPCOMING')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition sm:text-sm ${
                  trangThai === 'UPCOMING'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sắp chiếu
              </button>
            </div>
          </div>

          <ThanhLocPhim
            theLoaiDuocChon={theLoaiDuocChon}
            datTheLoaiDuocChon={datTheLoaiDuocChon}
            rapDuocChon={rapDuocChon}
            datRapDuocChon={datRapDuocChon}
            danhSachRap={danhSachRap}
            dinhDangDuocChon={dinhDangDuocChon}
            datDinhDangDuocChon={datDinhDangDuocChon}
            doTuoiDuocChon={doTuoiDuocChon}
            datDoTuoiDuocChon={datDoTuoiDuocChon}
            kieuSapXep={kieuSapXep}
            datKieuSapXep={datKieuSapXep}
          />

          {dangTai ? (
            <MovieList dangTai soKhung={KICH_THUOC_TRANG_CHU} />
          ) : (
            <MovieList danhSachPhim={danhSachPhimLoc} />
          )}

          {!dangTai && danhSachPhimLoc.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-gray-400 backdrop-blur-md">
              <p className="font-semibold text-gray-300">Không tìm thấy phim phù hợp</p>
              <p className="mt-1 text-xs text-gray-500">Vui lòng thử điều chỉnh lại bộ lọc thể loại, rạp hoặc độ tuổi.</p>
            </div>
          )}

          {!dangTai && tongTrang > 1 && (
            <div className="mt-12 flex justify-center">
              <nav
                aria-label="Phân trang danh sách phim"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-xl shadow-black/40 backdrop-blur-md"
              >
                <button
                  type="button"
                  disabled={trangHienTai <= 0}
                  onClick={() => chuyenTrang(trangHienTai - 1)}
                  className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-purple-600/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Trước
                </button>

                {danhSachTrang.map((muc, idx) =>
                  muc === '…' ? (
                    <span key={`e-${idx}`} className="px-2 font-mono text-xs text-gray-500">
                      …
                    </span>
                  ) : (
                    <button
                      key={muc}
                      type="button"
                      onClick={() => chuyenTrang(muc)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        muc === trangHienTai
                          ? 'scale-105 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/50'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {muc + 1}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={trangHienTai >= tongTrang - 1}
                  onClick={() => chuyenTrang(trangHienTai + 1)}
                  className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-purple-600/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Sau →
                </button>
              </nav>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
