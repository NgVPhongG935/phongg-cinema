import { ChevronDown, ExternalLink, Loader2, MapPin, Navigation, Phone, Radar, Search, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { layDanhSachKhuVuc } from '../services/regionService'
import { useViTriRap } from '../context/ViTriRapContext'
import {
  THANH_PHO_MAC_DINH,
  THANH_PHO_MAU,
  chonRapUuTien,
  docRapDaChon,
  hotlineRap,
  locRapTheoThanhPho,
  locRapThongMinh,
  luuRapDaChon,
  tenRapNgan,
} from '../utils/quickCinemaLocator'
import { dinhDangKhoangCach, ganKhoangCachRap, layLinkChiDuong, sapXepRapTheoKhoangCach } from '../utils/viTriRap'

const OFFSET_NAVBAR = 90

export default function QuickCinemaLocator({ danhSachRap = [], maRapDuocChon, onChonRap, danhSachRapCoSuat }) {
  const {
    cheDo, viTri, khuVuc, dangTaiGps, thongBao, layViTriGps, chonKhuVuc, tinhRapGan,
  } = useViTriRap()
  const [danhSachThanhPho, datDanhSachThanhPho] = useState([])
  const [cheDoLoc, datCheDoLoc] = useState(null)
  const [thanhPhoDuocChon, datThanhPhoDuocChon] = useState('')
  const [tuKhoa, datTuKhoa] = useState('')
  const [moDropdownTp, datMoDropdownTp] = useState(false)
  const daKhoiTaoMacDinh = useRef(false)
  const khungTpRef = useRef(null)

  useEffect(() => {
    layDanhSachKhuVuc()
      .then((ds) => datDanhSachThanhPho(Array.isArray(ds) ? ds.filter(Boolean) : []))
      .catch(() => datDanhSachThanhPho([]))
  }, [])

  const luaChonThanhPho = useMemo(() => {
    const tuRap = [...new Set(danhSachRap.map((rap) => rap.khuVuc).filter(Boolean))]
    const gop = [...danhSachThanhPho, ...tuRap, ...THANH_PHO_MAU]
    return [...new Set(gop)]
  }, [danhSachThanhPho, danhSachRap])

  const chonRapVaLuu = (maRap) => {
    if (maRap) luuRapDaChon(maRap)
    onChonRap?.(maRap || null)
  }

  useEffect(() => {
    if (daKhoiTaoMacDinh.current || !danhSachRap.length) return

    const idLuu = docRapDaChon()
    const rapLuu = idLuu ? danhSachRap.find((rap) => rap.id === idLuu) : null
    if (rapLuu) {
      datThanhPhoDuocChon(rapLuu.khuVuc || '')
      datCheDoLoc(rapLuu.khuVuc ? 'thanh_pho' : 'tat_ca')
      if (rapLuu.khuVuc) chonKhuVuc(rapLuu.khuVuc)
      chonRapVaLuu(rapLuu.id)
      daKhoiTaoMacDinh.current = true
      return
    }

    if (cheDo === 'gps' && viTri?.viDo) {
      datCheDoLoc('gps')
      const rapGps = chonRapUuTien(tinhRapGan(danhSachRap), { viTri, tinhRapGan, danhSachRapCoSuat })
      if (rapGps) chonRapVaLuu(rapGps.id)
      daKhoiTaoMacDinh.current = true
      return
    }

    const thanhPhoBanDau = (cheDo === 'khu_vuc' && khuVuc) ? khuVuc : THANH_PHO_MAC_DINH
    datThanhPhoDuocChon(thanhPhoBanDau)
    datCheDoLoc('thanh_pho')
    chonKhuVuc(thanhPhoBanDau)
    const rapMacDinh = chonRapUuTien(
      locRapTheoThanhPho(danhSachRap, thanhPhoBanDau),
      { viTri, tinhRapGan, danhSachRapCoSuat },
    )
    if (rapMacDinh) chonRapVaLuu(rapMacDinh.id)
    daKhoiTaoMacDinh.current = true
  }, [danhSachRap, danhSachRapCoSuat, cheDo, khuVuc, chonKhuVuc, tinhRapGan, viTri])

  useEffect(() => {
    const dong = (suKien) => {
      if (khungTpRef.current && !khungTpRef.current.contains(suKien.target)) datMoDropdownTp(false)
    }
    document.addEventListener('mousedown', dong)
    return () => document.removeEventListener('mousedown', dong)
  }, [])

  const danhSachRapLoc = useMemo(() => {
    const tuKhoaCat = tuKhoa.trim()
    if (tuKhoaCat) {
      const ketQua = locRapThongMinh(danhSachRap, tuKhoaCat).map((rap) => ganKhoangCachRap(rap, viTri))
      return viTri?.viDo
        ? [...ketQua].sort((a, b) => (a.khoangCachKm ?? 9999) - (b.khoangCachKm ?? 9999))
        : ketQua
    }
    if (cheDoLoc === 'gps' && viTri?.viDo) return tinhRapGan(danhSachRap)
    if (cheDoLoc === 'thanh_pho' && thanhPhoDuocChon) {
      return locRapTheoThanhPho(danhSachRap, thanhPhoDuocChon).map((rap) => ganKhoangCachRap(rap, viTri))
    }
    return danhSachRap.map((rap) => ganKhoangCachRap(rap, viTri))
  }, [cheDoLoc, thanhPhoDuocChon, danhSachRap, viTri, tinhRapGan, tuKhoa])

  const rapNoiBat = useMemo(() => {
    if (!danhSachRapLoc.length) return null
    const tim = danhSachRapLoc.find((rap) => rap.id === maRapDuocChon)
    if (tim) return ganKhoangCachRap(tim, viTri)
    const uuTien = chonRapUuTien(danhSachRapLoc, { viTri, tinhRapGan, danhSachRapCoSuat })
    return uuTien ? ganKhoangCachRap(uuTien, viTri) : null
  }, [danhSachRapLoc, maRapDuocChon, viTri, tinhRapGan, danhSachRapCoSuat])

  useEffect(() => {
    if (rapNoiBat?.id && rapNoiBat.id !== maRapDuocChon) chonRapVaLuu(rapNoiBat.id)
  }, [rapNoiBat?.id, maRapDuocChon])

  const xuLyGps = async () => {
    datTuKhoa('')
    const toaDo = await layViTriGps()
    if (!toaDo) return
    datCheDoLoc('gps')
    datThanhPhoDuocChon('')
    datMoDropdownTp(false)
    const dsGan = sapXepRapTheoKhoangCach(danhSachRap, toaDo)
    const rapGps = chonRapUuTien(dsGan, {
      viTri: toaDo,
      tinhRapGan: (ds) => sapXepRapTheoKhoangCach(ds, toaDo),
      danhSachRapCoSuat,
    })
    if (rapGps) chonRapVaLuu(rapGps.id)
  }

  const xuLyChonThanhPho = (giaTri) => {
    datTuKhoa('')
    datThanhPhoDuocChon(giaTri)
    datMoDropdownTp(false)
    if (!giaTri) {
      datCheDoLoc('tat_ca')
      return
    }
    datCheDoLoc('thanh_pho')
    chonKhuVuc(giaTri)
    const rapUuTien = chonRapUuTien(
      locRapTheoThanhPho(danhSachRap, giaTri),
      { viTri, tinhRapGan, danhSachRapCoSuat },
    )
    chonRapVaLuu(rapUuTien?.id || null)
  }

  const cuonToiLichChieu = () => {
    const element = document.getElementById('cinema-showtimes-section')
    if (!element) return
    const y = element.getBoundingClientRect().top + window.pageYOffset - OFFSET_NAVBAR
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const linkMaps = rapNoiBat ? layLinkChiDuong(rapNoiBat) : null
  const hotline = hotlineRap(rapNoiBat)
  const dangGps = cheDoLoc === 'gps' && !!viTri?.viDo
  const nhanThanhPho = thanhPhoDuocChon || (dangGps ? 'Theo vị trí GPS' : 'Tất cả thành phố')

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#120a1f] via-cinema-950 to-fuchsia-950/35 p-5 shadow-2xl shadow-black/40 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cinema-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            <Sparkles size={14} />
            Bản đồ bỏ túi
          </p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Tìm Rạp Gần Bạn &amp; Lịch Chiếu Nhanh</h2>
          <p className="mt-1 text-sm text-slate-400">
            Định vị GPS, gõ tên rạp/đường, hoặc chọn thành phố để xem suất hôm nay ngay trên trang chủ
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <button
            type="button"
            onClick={xuLyGps}
            disabled={dangTaiGps}
            className={`relative inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/40 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-60 ${
              dangGps ? 'ring-2 ring-fuchsia-300/80' : ''
            }`}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              {dangTaiGps ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Radar size={18} className="relative z-10" />
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-400/70" />
                  <span className="absolute right-0 top-0 z-20 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white/80" />
                </>
              )}
            </span>
            {dangTaiGps ? 'Đang định vị...' : 'Định vị gần tôi'}
          </button>

          <label className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => datTuKhoa(e.target.value)}
              placeholder="Tìm rạp, tên đường, quận/huyện, thành phố..."
              className="h-full w-full rounded-2xl border border-white/10 bg-[#0b0813]/80 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none ring-0 transition focus:border-fuchsia-400/60 focus:bg-[#120a1f]"
            />
          </label>

          <div ref={khungTpRef} className="relative w-full shrink-0 lg:w-56">
            <button
              type="button"
              onClick={() => datMoDropdownTp((mo) => !mo)}
              className="flex h-full w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0b0813]/80 px-4 py-3.5 text-left text-sm text-white transition hover:border-white/20"
            >
              <span className="truncate">{nhanThanhPho}</span>
              <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${moDropdownTp ? 'rotate-180' : ''}`} />
            </button>
            {moDropdownTp && (
              <ul className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-[#14101f] p-1.5 shadow-2xl shadow-black/60">
                <li>
                  <button
                    type="button"
                    onClick={() => xuLyChonThanhPho('')}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm ${!thanhPhoDuocChon && !dangGps ? 'bg-fuchsia-600/30 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    Tất cả thành phố
                  </button>
                </li>
                {luaChonThanhPho.map((tp) => (
                  <li key={tp}>
                    <button
                      type="button"
                      onClick={() => xuLyChonThanhPho(tp)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                        thanhPhoDuocChon === tp ? 'bg-fuchsia-600/30 text-white' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {tp}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {thongBao && (
          <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {thongBao} Danh sách rạp mặc định vẫn hiển thị bình thường.
          </p>
        )}

        {danhSachRapLoc.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs text-slate-400">
              {danhSachRapLoc.length} rạp{tuKhoa.trim() ? ' khớp tìm kiếm' : dangGps ? ' gần bạn' : thanhPhoDuocChon ? ` tại ${thanhPhoDuocChon}` : ''} — chọn thẻ để xem lịch
            </p>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
              {danhSachRapLoc.map((rap) => {
                const dangChon = rap.id === maRapDuocChon
                const dangChieu = !danhSachRapCoSuat || danhSachRapCoSuat.size === 0 || danhSachRapCoSuat.has(rap.id)
                const km = ganKhoangCachRap(rap, viTri).khoangCachKm
                return (
                  <button
                    key={rap.id}
                    type="button"
                    onClick={() => chonRapVaLuu(rap.id)}
                    className={`min-w-[210px] max-w-[240px] shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                      dangChon
                        ? 'border-fuchsia-400 bg-fuchsia-500/15 shadow-[0_0_22px_rgba(192,38,211,0.35)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/25'
                    }`}
                  >
                    <p className="line-clamp-2 text-sm font-bold text-white">{tenRapNgan(rap.tenRap)}</p>
                    {km != null && viTri?.viDo ? (
                      <p className="mt-1.5 text-xs font-medium text-emerald-300">Cách bạn {dinhDangKhoangCach(km)}</p>
                    ) : (
                      <p className="mt-1.5 line-clamp-1 text-xs text-slate-400">{rap.khuVuc || '—'}</p>
                    )}
                    <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      dangChieu ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-500'
                    }`}>
                      {dangChieu ? 'Đang chiếu' : 'Chưa có suất'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {rapNoiBat && (
          <div className="mt-4 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-white/10 to-fuchsia-500/5 p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {dangGps && rapNoiBat.id === danhSachRapLoc[0]?.id ? 'Rạp phù hợp nhất' : 'Rạp đang chọn'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{rapNoiBat.tenRap}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-300">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-fuchsia-400" />
                  <span>{rapNoiBat.diaChi}</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${hotline.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
                  >
                    <Phone size={13} className="text-fuchsia-300" />
                    Hotline {hotline}
                  </a>
                  {rapNoiBat.khoangCachKm != null && viTri?.viDo && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <Navigation size={13} />
                      Cách bạn {dinhDangKhoangCach(rapNoiBat.khoangCachKm)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
                {linkMaps && (
                  <a
                    href={linkMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/40 transition hover:from-purple-500 hover:to-pink-500"
                  >
                    <ExternalLink size={16} />
                    Mở Google Maps chỉ đường
                  </a>
                )}
                <button
                  type="button"
                  onClick={cuonToiLichChieu}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-bold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
                >
                  <Ticket size={16} />
                  Xem lịch chiếu hôm nay
                </button>
              </div>
            </div>
          </div>
        )}

        {!rapNoiBat && (cheDoLoc || tuKhoa.trim()) && (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Chưa tìm thấy rạp phù hợp. Thử xóa từ khóa, chọn thành phố khác, hoặc dùng GPS.
          </p>
        )}
      </div>
    </section>
  )
}
