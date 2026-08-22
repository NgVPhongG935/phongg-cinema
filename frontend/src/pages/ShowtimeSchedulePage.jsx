import { Calendar, ChevronLeft, ChevronRight, Clock, ExternalLink, Film, MapPin, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useViTriRap } from '../context/ViTriRapContext'
import { layChiTietPhim } from '../services/movieService'
import { layDanhSachKhuVuc } from '../services/regionService'
import { layDanhSachRap, layLichChieu } from '../services/showtimeService'
import { dinhDangGiaNgan, dinhDangKhoangGio, dinhDangTien } from '../utils/formatters'
import AnhPosterPhim from '../components/AnhPosterPhim'
import { hienThiDoTuoiDayDu } from '../utils/locPhim'
import { layUrlPosterPhim } from '../utils/anhPosterPhim'
import { dinhDangKhoangCach, ganKhoangCachRap, layLinkChiDuong } from '../utils/viTriRap'
import { locSuatChieuDuyNhat, nhomSuatTheoGio, tenPhongSuat, khoaSuatChieu } from '../utils/locSuatChieu'

function taoDanhSachNgay(soNgay = 14) {
  const danhSach = []
  const homNay = new Date()
  for (let i = 0; i < soNgay; i++) {
    const d = new Date(homNay)
    d.setDate(homNay.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const thu = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' })
    const ngay = d.getDate()
    const thang = `Th${d.getMonth() + 1}`
    danhSach.push({ iso, thu, ngay, thang, dateObj: d })
  }
  return danhSach
}

function KhungSkeletonLichChieu() {
  return (
    <div className="space-y-6">
      {[1, 2].map((k) => (
        <div key={k} className="the-kinh animate-pulse p-6">
          <div className="h-6 w-40 rounded-lg bg-white/10" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-3"
              >
                <div className="h-4 w-20 rounded bg-white/10" />
                <div className="h-3 w-14 rounded bg-fuchsia-500/20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ShowtimeSchedulePage() {
  const { id } = useParams()
  const dieuHuong = useNavigate()
  const [phim, datPhim] = useState(null)
  const [danhSachKhuVuc, datDanhSachKhuVuc] = useState([])
  const [khuVuc, datKhuVuc] = useState('')
  const [danhSachRap, datDanhSachRap] = useState([])
  const [maRap, datMaRap] = useState('')
  const [ngayChieu, datNgayChieu] = useState(new Date().toISOString().slice(0, 10))
  const [danhSachSuat, datDanhSachSuat] = useState([])
  const [dangTai, datDangTai] = useState(false)
  const [suatDangChon, datSuatDangChon] = useState(null)
  const thanhCuonNgayRef = useRef(null)

  const { cheDo, khuVuc: khuVucLuu, rapGanNhat, viTri } = useViTriRap()
  const danhSachNgay = useMemo(() => taoDanhSachNgay(14), [])

  useEffect(() => {
    layChiTietPhim(id).then(datPhim).catch(() => datPhim(null))
  }, [id])

  useEffect(() => {
    const khoiTao = async () => {
      const [kv, tatCaRap] = await Promise.all([
        layDanhSachKhuVuc().catch(() => []),
        layDanhSachRap().catch(() => []),
      ])
      datDanhSachKhuVuc(kv)
      const gan = rapGanNhat(tatCaRap)
      if (cheDo === 'khu_vuc' && khuVucLuu) {
        datKhuVuc(khuVucLuu)
      } else if (gan?.khuVuc) {
        datKhuVuc(gan.khuVuc)
        datMaRap(gan.id)
      } else if (kv.length) {
        datKhuVuc(kv[0])
      } else if (tatCaRap.length) {
        datDanhSachRap(tatCaRap)
        datMaRap(tatCaRap[0]?.id || '')
      }
    }
    khoiTao()
  }, [cheDo, khuVucLuu, rapGanNhat])

  useEffect(() => {
    if (!khuVuc) return
    layDanhSachRap(khuVuc).then((danhSach) => {
      datDanhSachRap(danhSach)
      const gan = rapGanNhat(danhSach)
      datMaRap((cu) => {
        if (cu && danhSach.some((rap) => rap.id === cu)) return cu
        return gan?.id || danhSach[0]?.id || ''
      })
    })
  }, [khuVuc, rapGanNhat])

  useEffect(() => {
    if (!id || !ngayChieu || !maRap) {
      datDanhSachSuat([])
      datSuatDangChon(null)
      return
    }
    datDangTai(true)
    layLichChieu(id, ngayChieu, maRap)
      .then((ds) => {
        // #region agent log
        const list = Array.isArray(ds) ? ds : []
        const ids = list.map((s) => s.id)
        const slots = list.map((s) => `${s.startTime || s.thoiGianBatDau}|${s.roomId || s.maPhong}`)
        const gio = list.map((s) => s.startTime || s.thoiGianBatDau)
        const after = locSuatChieuDuyNhat(list)
        fetch('http://127.0.0.1:7246/ingest/4225d522-756d-4686-a16f-b71753054886',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'12750d'},body:JSON.stringify({sessionId:'12750d',runId:'post-fix',hypothesisId:'D',location:'ShowtimeSchedulePage.jsx:fetch',message:'movie schedule payload',data:{count:list.length,uniqueIds:new Set(ids).size,uniqueSlots:new Set(slots).size,uniqueGio:new Set(gio).size,afterDedupe:after.length,rooms:[...new Set(list.map((s)=>s.roomId||s.maPhong))]},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        datDanhSachSuat(after)
        // Tự động chọn suất khả dụng đầu tiên nếu có
        const suatHopLe = ds.find((s) => !s.hetHan && !s.expired)
        datSuatDangChon(suatHopLe || null)
      })
      .catch(() => {
        datDanhSachSuat([])
        datSuatDangChon(null)
      })
      .finally(() => datDangTai(false))
  }, [id, ngayChieu, maRap])

  const rapDaChon = useMemo(() => danhSachRap.find((rap) => rap.id === maRap), [danhSachRap, maRap])
  const rapHienThi = useMemo(() => (rapDaChon ? ganKhoangCachRap(rapDaChon, viTri) : null), [rapDaChon, viTri])
  const nhomSuat = useMemo(() => nhomSuatTheoGio(danhSachSuat), [danhSachSuat])

  const cuonNgay = (huong) => {
    if (thanhCuonNgayRef.current) {
      const khoangCuon = huong === 'trai' ? -260 : 260
      thanhCuonNgayRef.current.scrollBy({ left: khoangCuon, behavior: 'smooth' })
    }
  }

  if (!phim) return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <div className="the-kinh animate-pulse p-8">
        <div className="flex gap-6">
          <div className="h-36 w-24 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 rounded bg-white/10" />
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-4 w-52 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )

  const title = phim.title || 'Phim'
  const posterUrl = layUrlPosterPhim(phim)
  const genres = phim.genres || []
  const duration = phim.duration
  const ageRating = phim.ageRating
  const language = phim.language

  const xuLyChonSuat = (suat) => {
    if (suat.hetHan || suat.expired) return
    datSuatDangChon(suat)
  }

  const xuLyChuyenDatVe = (suatId = suatDangChon?.id) => {
    if (!suatId) return
    dieuHuong(`/booking/${suatId}`, { state: { phim } })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-32 sm:pt-10">
      {/* Header Thông Tin Phim */}
      <div className="flex flex-wrap items-start gap-6 border-b border-white/10 pb-8">
        <AnhPosterPhim
          className="h-40 w-28 shrink-0 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:h-44 sm:w-32"
          src={posterUrl}
          alt={title}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">{title}</h1>
            {ageRating && (
              <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                {hienThiDoTuoiDayDu(ageRating)}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300 sm:text-sm">
            {duration && (
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Clock size={16} className="text-fuchsia-400" />
                {duration} phút
              </span>
            )}
            {language && <span className="rounded-full bg-white/5 px-2.5 py-0.5">{language}</span>}
            {genres.length > 0 && <span className="text-slate-400">{genres.join(' · ')}</span>}
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-6">
        {/* Bộ lọc Khu vực & Rạp */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Khu vực
            <select
              className="o-nhap mt-1.5 w-full font-normal"
              value={khuVuc}
              onChange={(e) => datKhuVuc(e.target.value)}
            >
              {danhSachKhuVuc.map((muc) => (
                <option key={muc} value={muc}>{muc}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rạp chiếu
            <select
              className="o-nhap mt-1.5 w-full font-normal"
              value={maRap}
              onChange={(e) => datMaRap(e.target.value)}
              disabled={!danhSachRap.length}
            >
              <option value="">{danhSachRap.length ? 'Chọn rạp' : 'Chưa có rạp trong khu vực'}</option>
              {danhSachRap.map((rap) => (
                <option key={rap.id} value={rap.id}>{rap.tenRap}</option>
              ))}
            </select>
          </label>
        </div>

        {rapDaChon && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs text-slate-400">
            <p className="flex items-center gap-1.5 text-slate-300">
              <MapPin size={15} className="text-fuchsia-400" />
              {rapDaChon.diaChi}
            </p>
            {rapHienThi?.khoangCachKm != null && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Cách bạn {dinhDangKhoangCach(rapHienThi.khoangCachKm)}
              </span>
            )}
            {layLinkChiDuong(rapDaChon) && (
              <a
                href={layLinkChiDuong(rapDaChon)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-fuchsia-300 hover:text-fuchsia-200"
              >
                <ExternalLink size={13} /> Chỉ đường
              </a>
            )}
          </div>
        )}

        {/* 1. THANH CHỌN NGÀY DẠNG TRƯỢT NGANG (DATE PICKER PILLS) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Calendar size={14} className="text-fuchsia-400" />
              Chọn ngày chiếu
            </p>
            <div className="hidden gap-1 sm:flex">
              <button
                type="button"
                onClick={() => cuonNgay('trai')}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => cuonNgay('phai')}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={thanhCuonNgayRef}
            className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pb-2 pt-1"
          >
            {danhSachNgay.map((item) => {
              const dangChon = item.iso === ngayChieu
              return (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => datNgayChieu(item.iso)}
                  className={`flex min-w-[76px] shrink-0 flex-col items-center justify-center rounded-2xl border py-2.5 transition-all duration-200 ${
                    dangChon
                      ? 'scale-105 border-fuchsia-400 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-cinema-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${dangChon ? 'text-white' : 'text-slate-400'}`}>
                    {item.thu}
                  </span>
                  <span className="my-0.5 text-lg font-black tracking-tight">
                    {item.ngay}
                  </span>
                  <span className={`text-[10px] ${dangChon ? 'text-white/90' : 'text-slate-500'}`}>
                    {item.thang}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. HIỆU ỨNG SKELETON LOADING & DANH SÁCH SUẤT CHIẾU */}
        {dangTai ? (
          <KhungSkeletonLichChieu />
        ) : Object.keys(nhomSuat).length === 0 ? (
          <div className="the-kinh py-14 text-center text-slate-400">
            <Film size={40} className="mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-300">Chưa có suất chiếu cho ngày đã chọn</p>
            <p className="mt-1 text-xs text-slate-500">Vui lòng chọn ngày khác hoặc đổi rạp chiếu.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {danhSachSuat.every((suat) => suat.hetHan || suat.expired) && (
              <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Các suất trong ngày này đã qua giờ chiếu. Hãy chọn <strong>ngày khác</strong> để đặt vé.
              </p>
            )}

            {Object.entries(nhomSuat).map(([dinhDang, cacGio]) => (
              <div key={dinhDang} className="the-kinh p-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                  <h2 className="text-base font-bold text-white sm:text-lg">{dinhDang}</h2>
                </div>

                <div className="mt-4 space-y-4">
                  {cacGio.map((nhom) => {
                    const khoangGio = dinhDangKhoangGio(nhom.startTime, nhom.endTime)
                    const giaVe = nhom.price
                    const hetHanHet = nhom.phong.every((s) => s.hetHan || s.expired)
                    return (
                      <div key={`${dinhDang}|${nhom.gioKey}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                          <p className={`text-sm font-bold sm:text-base ${hetHanHet ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {khoangGio}
                          </p>
                          <p className="text-xs text-cinema-400">{dinhDangTien(giaVe)} · {rapDaChon?.tenRap}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {nhom.phong.map((suat) => {
                            const hetHan = suat.hetHan || suat.expired
                            const dangChon = suatDangChon?.id === suat.id
                            const phong = tenPhongSuat(suat)
                            if (hetHan) {
                              return (
                                <div key={khoaSuatChieu(suat)} className="rounded-xl border border-white/5 px-3 py-2 text-center opacity-40">
                                  <p className="text-xs font-semibold text-slate-500">Phòng {phong}</p>
                                  <p className="text-[10px] text-slate-600">{dinhDangGiaNgan(giaVe)}</p>
                                </div>
                              )
                            }
                            return (
                              <button
                                key={khoaSuatChieu(suat)}
                                type="button"
                                onClick={() => xuLyChonSuat(suat)}
                                onDoubleClick={() => xuLyChuyenDatVe(suat.id)}
                                className={`rounded-xl border px-3 py-2 text-center transition ${
                                  dangChon
                                    ? 'border-fuchsia-400 bg-fuchsia-500/20 ring-1 ring-fuchsia-400'
                                    : 'border-white/10 bg-white/5 hover:border-fuchsia-400/50'
                                }`}
                              >
                                <p className="text-xs font-bold text-white">Phòng {phong || '—'}</p>
                                <p className="mt-0.5 text-[10px] text-cinema-400">{dinhDangTien(suat.price ?? suat.giaVeTu)}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link to={`/movies/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-fuchsia-300">
          ← Quay lại chi tiết phim
        </Link>
      </div>

      {/* 3. THANH BOTTOM BAR CỐ ĐỊNH (STICKY SUMMARY BAR) */}
      {suatDangChon && !suatDangChon.hetHan && !suatDangChon.expired && (
        <aside
          aria-label="Thanh tóm tắt suất chiếu đã chọn"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-fuchsia-500/30 bg-cinema-950/90 p-3.5 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-fade-in-up sm:p-4"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                {suatDangChon.format || suatDangChon.dinhDang || '2D Lồng Tiếng'} · {suatDangChon.cinemaName || suatDangChon.tenRap || rapDaChon?.tenRap || 'PhongG Cinema'}
                {tenPhongSuat(suatDangChon) ? ` · Phòng ${tenPhongSuat(suatDangChon)}` : ''}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-extrabold text-white">
                  {dinhDangKhoangGio(suatDangChon.startTime || suatDangChon.thoiGianBatDau, suatDangChon.endTime || suatDangChon.thoiGianKetThuc)}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(ngayChieu).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
                <span className="font-semibold text-cinema-400">
                  Giá từ {dinhDangTien(suatDangChon.price ?? suatDangChon.giaVeTu)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => xuLyChuyenDatVe(suatDangChon.id)}
              className="nut-chinh nut-neon-cyber inline-flex shrink-0 items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-fuchsia-600/40 transition hover:scale-105"
            >
              <Ticket size={18} />
              <span>TIẾP TỤC CHỌN GHẾ</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
