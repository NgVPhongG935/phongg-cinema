import { ChevronLeft, ChevronRight, Clock, Play, Sparkles, Ticket } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { layDanhSachPhim } from '../services/movieService'
import { SO_PHIM_BANNER } from '../services/homeService'
import { queryKeys } from '../lib/queryClient'
import { CHI_SO_LOC_RONG, ganMetaPhim, hienThiDoTuoiDayDu } from '../utils/locPhim'
import { chuanHoaUrlPoster, layUrlPosterPhim, POSTER_MAC_DINH } from '../utils/anhPosterPhim'
import ModalTrailer from './ModalTrailer'
import AnhPosterPhim from './AnhPosterPhim'

const THOI_GIAN_SLIDE = 5000
const NGUONG_DANH_GIA_CAO = 8

function taoDanhSachBanner(danhSachNguon, chiSo) {
  return (danhSachNguon || [])
    .filter((phim) => (phim.status || phim.trangThai || 'SHOWING') === 'SHOWING')
    .map((phim) => ganMetaPhim(phim, chiSo || CHI_SO_LOC_RONG))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, SO_PHIM_BANNER)
}

function PosterBanner3D({ phim }) {
  if (!phim) return null
  const posterUrl = layUrlPosterPhim(phim)
  const title = phim.title || phim.tenPhim || 'Phim'

  return (
    <div className="hidden items-center justify-center md:flex lg:justify-end">
      <div className="group/poster relative aspect-[2/3] w-60 overflow-hidden rounded-3xl border border-white/15 bg-cinema-900/60 shadow-[0_20px_60px_rgba(168,85,247,0.3)] ring-1 ring-white/10 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_25px_70px_rgba(217,70,239,0.5)] hover:ring-fuchsia-400/40 lg:w-72">
        <AnhPosterPhim
          src={posterUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover/poster:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-fuchsia-600/20 via-transparent to-cyan-400/10 opacity-40 transition-opacity duration-500 group-hover/poster:opacity-80" />
      </div>
    </div>
  )
}

/** Tái sử dụng data Home (Promise.all) — không fetch size=20 riêng nữa. */
export default function BannerSection({ danhSachPhim = null, chiSoLocPhim = null }) {
  const [indexPhimHienTai, datIndexPhimHienTai] = useState(0)
  const [dangTamDung, datDangTamDung] = useState(false)
  const [moModalTrailer, datMoModalTrailer] = useState(false)

  const chiSo = chiSoLocPhim || CHI_SO_LOC_RONG

  const canReuseHome = Array.isArray(danhSachPhim) && danhSachPhim.length > 0
  const { data: phimFallback } = useQuery({
    queryKey: queryKeys.movies({ trangThai: 'SHOWING', page: 0, size: SO_PHIM_BANNER }),
    queryFn: () => layDanhSachPhim({ trangThai: 'SHOWING', page: 0, size: SO_PHIM_BANNER }),
    enabled: !canReuseHome,
    staleTime: 60 * 1000,
  })

  const danhSachPhimBanner = useMemo(() => {
    if (canReuseHome) return taoDanhSachBanner(danhSachPhim, chiSo)
    const raw = phimFallback?.content || (Array.isArray(phimFallback) ? phimFallback : [])
    return taoDanhSachBanner(raw, chiSo)
  }, [canReuseHome, danhSachPhim, phimFallback, chiSo])
  const chuyenSlide = useCallback((huong) => {
    datIndexPhimHienTai((cu) => {
      const tong = danhSachPhimBanner.length
      if (!tong) return 0
      if (huong === 'truoc') return cu === 0 ? tong - 1 : cu - 1
      return cu === tong - 1 ? 0 : cu + 1
    })
    datMoModalTrailer(false)
  }, [danhSachPhimBanner.length])

  useEffect(() => {
    if (dangTamDung || danhSachPhimBanner.length <= 1) return undefined
    const boDem = setInterval(() => chuyenSlide('sau'), THOI_GIAN_SLIDE)
    return () => clearInterval(boDem)
  }, [dangTamDung, danhSachPhimBanner.length, chuyenSlide])

  const phimHienTai = danhSachPhimBanner[indexPhimHienTai]
  const coTrailer = Boolean(phimHienTai?.trailerUrl?.trim())

  return (
    <section
      className="relative h-[500px] w-full overflow-hidden bg-[#0b0813] sm:h-[540px] md:h-[580px] lg:h-[620px]"
      onMouseEnter={() => datDangTamDung(true)}
      onMouseLeave={() => datDangTamDung(false)}
    >
      {/* 1. XỬ LÝ ẢNH NỀN BACKDROP & MULTI-LAYER GRADIENT OVERLAY */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {danhSachPhimBanner.map((phim, index) => {
          const backdrop = phim.backdropUrl || layUrlPosterPhim(phim)
          const dangHien = index === indexPhimHienTai

          return (
            <div
              key={phim.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                dangHien ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
              }`}
            >
              <img
                src={chuanHoaUrlPoster(backdrop) || POSTER_MAC_DINH}
                alt={phim.title || phim.tenPhim || 'Phim'}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center filter"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = POSTER_MAC_DINH
                }}
              />
            </div>
          )
        })}

        {/* Lớp phủ mờ nền kính */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        {/* Gradient Trái qua Phải: Hòa tan vào nền #0b0813 giúp chữ bên trái sắc nét */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0813] via-[#0b0813]/90 via-35% md:via-50% to-transparent" />

        {/* Gradient Dưới lên Trên: Xóa hoàn toàn ranh giới giữa banner và nội dung bên dưới */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0813] via-[#0b0813]/50 via-20% to-transparent" />

        {/* Gradient Trên xuống: Làm dịu đỉnh banner */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b0813]/80 to-transparent" />

        {/* Ánh sáng đèn Neon xung quanh */}
        <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[100px]" />
        <div className="absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
      </div>

      {/* 2. CÂN CHỈNH BỐ CỤC NỘI DUNG HERO CONTENT */}
      <div className="relative z-20 mx-auto flex h-full max-w-7xl items-center px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {danhSachPhimBanner.map((phim, index) => {
          const dangHien = index === indexPhimHienTai
          const title = phim.title || phim.tenPhim || 'Phim'
          const genres = phim.genres || phim.theLoai || []
          const duration = phim.duration ?? phim.thoiLuong
          const ageRating = phim.ageRating || phim.doTuoi
          const description = phim.description || phim.moTa

          return (
            <div
              key={phim.id}
              className={`absolute inset-x-4 inset-y-0 flex items-center transition-all duration-700 ease-out sm:inset-x-6 lg:inset-x-8 ${
                dangHien
                  ? 'pointer-events-auto z-10 translate-x-0 opacity-100'
                  : 'pointer-events-none z-0 translate-x-8 opacity-0'
              }`}
            >
              <div className="grid w-full items-center gap-8 md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.5fr_1fr]">
                {/* CỘT BÊN TRÁI (60%): Thông tin phim & Nút bấm CTA */}
                <div className="flex flex-col justify-center">
                  {/* Badges & Meta */}
                  <div className="mb-3 flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg ${
                        (phim.rating ?? 0) >= NGUONG_DANH_GIA_CAO
                          ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-fuchsia-500/30'
                          : 'bg-white/10 text-white backdrop-blur-md'
                      }`}
                    >
                      <Sparkles size={13} className="text-yellow-300" />
                      {(phim.rating ?? 0) >= NGUONG_DANH_GIA_CAO ? 'PHIM HOT / ĐÁNH GIÁ CAO' : 'ĐANG CHIẾU'}
                    </span>

                    {ageRating && (
                      <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                        {hienThiDoTuoiDayDu(ageRating)}
                      </span>
                    )}

                    {duration && (
                      <span className="flex items-center gap-1 text-xs text-slate-300">
                        <Clock size={13} className="text-fuchsia-400" />
                        {duration} phút
                      </span>
                    )}
                  </div>

                  {/* Tiêu đề phim */}
                  <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl lg:text-6xl">
                    {title}
                  </h1>

                  {/* Thể loại */}
                  {genres.length > 0 && (
                    <p className="mt-2 text-xs font-medium text-fuchsia-300/90 sm:text-sm">
                      {genres.join(' · ')}
                    </p>
                  )}

                  {/* Mô tả tóm tắt */}
                  <p className="mt-3.5 line-clamp-3 max-w-xl text-sm leading-relaxed text-slate-300 drop-shadow sm:text-base">
                    {description || 'Đặt vé nhanh, chọn ghế đẹp và tận hưởng những khoảnh khắc điện ảnh trọn vẹn tại PhongG Cinema.'}
                  </p>

                  {/* Cụm nút bấm hành động (CTA) */}
                  <div className="mt-6 flex flex-wrap items-center gap-3.5">
                    <Link
                      to={`/movies/${phim.id}/schedule`}
                      className="nut-chinh nut-neon-cyber inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold shadow-lg shadow-fuchsia-600/40 transition hover:scale-105"
                    >
                      <Ticket size={18} />
                      <span>ĐẶT VÉ NGAY</span>
                    </Link>

                    {phim.trailerUrl?.trim() && (
                      <button
                        type="button"
                        onClick={() => datMoModalTrailer(true)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:border-white/40 hover:bg-white/20 hover:scale-105"
                      >
                        <Play size={16} fill="currentColor" className="text-fuchsia-300" />
                        <span>Xem Trailer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CỘT BÊN PHẢI (40%): Poster phim 3D nổi bật */}
                <PosterBanner3D phim={phim} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. NÚT CHUYỂN SLIDE & DOTS INDICATOR */}
      {danhSachPhimBanner.length > 1 && (
        <>
          {/* Nút Prev */}
          <button
            type="button"
            onClick={() => chuyenSlide('truoc')}
            className="absolute left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b0813]/60 text-white shadow-xl backdrop-blur-md transition hover:scale-110 hover:border-fuchsia-400 hover:bg-fuchsia-600/80 sm:left-4"
            aria-label="Phim trước"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Nút Next */}
          <button
            type="button"
            onClick={() => chuyenSlide('sau')}
            className="absolute right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b0813]/60 text-white shadow-xl backdrop-blur-md transition hover:scale-110 hover:border-fuchsia-400 hover:bg-fuchsia-600/80 sm:right-4"
            aria-label="Phim tiếp theo"
          >
            <ChevronRight size={22} />
          </button>

          {/* Hàng chấm chuyển Slide (Dots Indicator) */}
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
            {danhSachPhimBanner.map((phim, index) => (
              <button
                key={phim.id}
                type="button"
                onClick={() => {
                  datIndexPhimHienTai(index)
                  datMoModalTrailer(false)
                }}
                className={`transition-all duration-500 ${
                  index === indexPhimHienTai
                    ? 'h-2.5 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cinema-400 shadow-[0_0_14px_rgba(217,70,239,0.8)]'
                    : 'h-2.5 w-2.5 rounded-full bg-white/30 hover:bg-white/70'
                }`}
                aria-label={`Chuyển đến banner phim ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal xem Trailer trực tiếp */}
      <ModalTrailer
        mo={moModalTrailer && coTrailer}
        movie={phimHienTai}
        title={phimHienTai?.title || phimHienTai?.tenPhim}
        trailerUrl={phimHienTai?.trailerUrl || phimHienTai?.urlTrailer}
        onDong={() => datMoModalTrailer(false)}
      />
    </section>
  )
}
