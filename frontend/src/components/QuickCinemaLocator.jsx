import { ExternalLink, Loader2, MapPin, Navigation, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { layDanhSachKhuVuc } from '../services/regionService'
import { useViTriRap } from '../context/ViTriRapContext'
import {
  DANH_SACH_QUAN_HCM,
  THANH_PHO_MAC_DINH,
  chonRapUuTien,
  locRapTheoQuan,
  locRapTheoThanhPho,
} from '../utils/quickCinemaLocator'
import { dinhDangKhoangCach, ganKhoangCachRap, layLinkChiDuong } from '../utils/viTriRap'

export default function QuickCinemaLocator({ danhSachRap = [], maRapDuocChon, onChonRap, danhSachRapCoSuat }) {
  const {
    cheDo, viTri, khuVuc, dangTaiGps, thongBao, layViTriGps, chonKhuVuc, tinhRapGan,
  } = useViTriRap()
  const [danhSachThanhPho, datDanhSachThanhPho] = useState([])
  const [cheDoLoc, datCheDoLoc] = useState(null)
  const [quanDuocChon, datQuanDuocChon] = useState('')
  const [thanhPhoDuocChon, datThanhPhoDuocChon] = useState('')
  const daKhoiTaoMacDinh = useRef(false)

  useEffect(() => {
    layDanhSachKhuVuc().then(datDanhSachThanhPho).catch(() => datDanhSachThanhPho([]))
  }, [])

  useEffect(() => {
    if (daKhoiTaoMacDinh.current || !danhSachRap.length) return

    if (cheDo === 'gps' && viTri?.viDo) {
      datCheDoLoc('gps')
      const rapGps = chonRapUuTien(tinhRapGan(danhSachRap), { viTri, tinhRapGan, danhSachRapCoSuat })
      if (rapGps) onChonRap?.(rapGps.id)
      daKhoiTaoMacDinh.current = true
      return
    }

    if (cheDo === 'khu_vuc' && khuVuc) {
      datThanhPhoDuocChon(khuVuc)
      datCheDoLoc('thanh_pho')
      const rapLuu = chonRapUuTien(
        locRapTheoThanhPho(danhSachRap, khuVuc),
        { viTri, tinhRapGan, danhSachRapCoSuat },
      )
      if (rapLuu) onChonRap?.(rapLuu.id)
      daKhoiTaoMacDinh.current = true
      return
    }

    datThanhPhoDuocChon(THANH_PHO_MAC_DINH)
    datCheDoLoc('thanh_pho')
    chonKhuVuc(THANH_PHO_MAC_DINH)

    const rapMacDinh = chonRapUuTien(
      locRapTheoThanhPho(danhSachRap, THANH_PHO_MAC_DINH),
      { viTri, tinhRapGan, danhSachRapCoSuat },
    )
    if (rapMacDinh) onChonRap?.(rapMacDinh.id)
    daKhoiTaoMacDinh.current = true
  }, [danhSachRap, danhSachRapCoSuat, cheDo, khuVuc, chonKhuVuc, onChonRap, tinhRapGan, viTri])

  useEffect(() => {
    if (cheDo === 'gps' && viTri?.viDo) datCheDoLoc('gps')
    else if (cheDo === 'khu_vuc') datCheDoLoc('thanh_pho')
  }, [cheDo, viTri])

  const danhSachRapLoc = useMemo(() => {
    if (cheDoLoc === 'quan' && quanDuocChon) return locRapTheoQuan(danhSachRap, quanDuocChon)
    if (cheDoLoc === 'thanh_pho' && thanhPhoDuocChon) return locRapTheoThanhPho(danhSachRap, thanhPhoDuocChon)
    if (cheDoLoc === 'gps' && viTri?.viDo) return tinhRapGan(danhSachRap)
    return []
  }, [cheDoLoc, quanDuocChon, thanhPhoDuocChon, danhSachRap, viTri, tinhRapGan])

  const rapNoiBat = useMemo(() => {
    if (!danhSachRapLoc.length) return null
    const tim = danhSachRapLoc.find((rap) => rap.id === maRapDuocChon)
    if (tim) return ganKhoangCachRap(tim, viTri)
    const uuTien = chonRapUuTien(danhSachRapLoc, { viTri, tinhRapGan, danhSachRapCoSuat })
    return uuTien ? ganKhoangCachRap(uuTien, viTri) : null
  }, [danhSachRapLoc, maRapDuocChon, viTri, tinhRapGan, danhSachRapCoSuat])

  useEffect(() => {
    if (rapNoiBat?.id && rapNoiBat.id !== maRapDuocChon) onChonRap?.(rapNoiBat.id)
  }, [rapNoiBat?.id, maRapDuocChon, onChonRap])

  const xuLyGps = async () => {
    datCheDoLoc('gps')
    datQuanDuocChon('')
    datThanhPhoDuocChon('')
    await layViTriGps()
  }

  const xuLyChonQuan = (suKien) => {
    const giaTri = suKien.target.value
    datQuanDuocChon(giaTri)
    datThanhPhoDuocChon('')
    datCheDoLoc(giaTri ? 'quan' : null)
    if (!giaTri) {
      onChonRap?.(null)
      return
    }
    const rapUuTien = chonRapUuTien(
      locRapTheoQuan(danhSachRap, giaTri),
      { viTri, tinhRapGan, danhSachRapCoSuat },
    )
    onChonRap?.(rapUuTien?.id || null)
  }

  const xuLyChonThanhPho = (suKien) => {
    const giaTri = suKien.target.value
    datThanhPhoDuocChon(giaTri)
    datQuanDuocChon('')
    if (giaTri) {
      datCheDoLoc('thanh_pho')
      chonKhuVuc(giaTri)
      const rapUuTien = chonRapUuTien(
        locRapTheoThanhPho(danhSachRap, giaTri),
        { viTri, tinhRapGan, danhSachRapCoSuat },
      )
      onChonRap?.(rapUuTien?.id || null)
    } else {
      datCheDoLoc(null)
      onChonRap?.(null)
    }
  }

  const linkMaps = rapNoiBat ? layLinkChiDuong(rapNoiBat) : null
  const coNhieuRap = danhSachRapLoc.length > 1

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cinema-900 via-cinema-950 to-fuchsia-950/40 p-5 shadow-2xl shadow-black/40 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cinema-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
              <Sparkles size={14} />
              Bản đồ bỏ túi
            </p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">Tìm Rạp Gần Bạn &amp; Lịch Chiếu Nhanh</h2>
            <p className="mt-1 text-sm text-slate-400">Định vị GPS hoặc chọn khu vực để xem suất chiếu hôm nay ngay tại trang chủ</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <button
            type="button"
            onClick={xuLyGps}
            disabled={dangTaiGps}
            className={`nut-chinh nut-neon-cyber flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-60 ${cheDoLoc === 'gps' ? 'ring-2 ring-fuchsia-400/60' : ''}`}
          >
            {dangTaiGps ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            {dangTaiGps ? 'Đang định vị...' : '🎯 Tìm rạp gần tôi (GPS)'}
          </button>

          <label className="min-w-0 flex-1 text-sm text-slate-300">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Chọn Khu Vực / Quận</span>
            <select
              className="o-nhap"
              value={quanDuocChon ? `quan:${quanDuocChon}` : thanhPhoDuocChon ? `tp:${thanhPhoDuocChon}` : ''}
              onChange={(suKien) => {
                const giaTri = suKien.target.value
                if (!giaTri) {
                  datQuanDuocChon('')
                  datThanhPhoDuocChon('')
                  datCheDoLoc(null)
                  onChonRap?.(null)
                  return
                }
                if (giaTri.startsWith('quan:')) {
                  datThanhPhoDuocChon('')
                  xuLyChonQuan({ target: { value: giaTri.slice(5) } })
                } else if (giaTri.startsWith('tp:')) {
                  xuLyChonThanhPho({ target: { value: giaTri.slice(3) } })
                }
              }}
            >
              <option value="">— Chọn quận hoặc tỉnh/thành —</option>
              <optgroup label="Quận TP. Hồ Chí Minh">
                {DANH_SACH_QUAN_HCM.map((quan) => (
                  <option key={quan} value={`quan:${quan}`}>{quan}</option>
                ))}
              </optgroup>
              <optgroup label="Tỉnh / Thành phố">
                {danhSachThanhPho.map((tp) => (
                  <option key={tp} value={`tp:${tp}`}>{tp}</option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>

        {thongBao && <p className="mt-3 text-sm text-amber-300">{thongBao}</p>}

        {rapNoiBat && (
          <div className="mt-6 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-white/10 to-fuchsia-500/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Rạp phù hợp nhất</p>
                <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{rapNoiBat.tenRap}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-300">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-fuchsia-400" />
                  <span>{rapNoiBat.diaChi}</span>
                </p>
                {rapNoiBat.khoangCachKm != null && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <Navigation size={13} />
                    Cách bạn {dinhDangKhoangCach(rapNoiBat.khoangCachKm)}
                  </p>
                )}
              </div>

              {linkMaps && (
                <a
                  href={linkMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/40 transition hover:bg-fuchsia-500"
                >
                  <ExternalLink size={16} />
                  Mở Google Maps chỉ đường
                </a>
              )}
            </div>

            {coNhieuRap && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs text-slate-400">Có {danhSachRapLoc.length} rạp trong khu vực — chọn rạp khác:</p>
                <div className="flex flex-wrap gap-2">
                  {danhSachRapLoc.map((rap) => (
                    <button
                      key={rap.id}
                      type="button"
                      onClick={() => onChonRap?.(rap.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        rap.id === maRapDuocChon
                          ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {rap.tenRap.replace('PhongG Cinema - ', '').replace('Phong Cinema ', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!rapNoiBat && cheDoLoc && (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Chưa tìm thấy rạp trong khu vực đã chọn. Hãy thử GPS hoặc chọn quận/thành phố khác.
          </p>
        )}

        {!cheDoLoc && !maRapDuocChon && (
          <p className="mt-5 text-center text-sm text-slate-500">
            Đang tải rạp mặc định...
          </p>
        )}
      </div>
    </section>
  )
}
