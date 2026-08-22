import { Loader2, MapPin, Navigation, X } from 'lucide-react'
import { useState } from 'react'
import { useDanhSachKhuVuc } from '../hooks/useCatalogQueries'
import { useViTriRap } from '../context/ViTriRapContext'
import { dinhDangKhoangCach } from '../utils/viTriRap'

export default function ChonViTriRap({ compact = false }) {
  const {
    cheDo, viTri, khuVuc, dangTaiGps, thongBao, coViTri,
    layViTriGps, chonKhuVuc, xoaViTri,
  } = useViTriRap()
  const { data: danhSachKhuVuc = [] } = useDanhSachKhuVuc()
  const [moChonKhuVuc, datMoChonKhuVuc] = useState(false)

  const moTaViTri = () => {
    if (cheDo === 'gps' && viTri?.viDo) return 'Đang dùng vị trí GPS của bạn'
    if (cheDo === 'khu_vuc' && khuVuc) return `Khu vực: ${khuVuc}`
    return 'Chọn vị trí để gợi ý rạp gần nhất'
  }

  if (compact && coViTri) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
        <Navigation size={15} />
        <span>{moTaViTri()}</span>
        <button type="button" onClick={xoaViTri} className="ml-auto rounded-lg p-1 hover:bg-emerald-500/20"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-cinema-900/90 via-cinema-950 to-fuchsia-950/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300">
            <MapPin size={16} /> Tìm rạp gần bạn
          </p>
          <p className="mt-1 text-sm text-slate-400">{moTaViTri()}</p>
        </div>
        {coViTri && (
          <button type="button" onClick={xoaViTri} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5">
            Đổi vị trí
          </button>
        )}
      </div>

      {!coViTri && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={layViTriGps}
            disabled={dangTaiGps}
            className="nut-chinh flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {dangTaiGps ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {dangTaiGps ? 'Đang định vị...' : 'Dùng vị trí của tôi'}
          </button>
          <button
            type="button"
            onClick={() => datMoChonKhuVuc((cu) => !cu)}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Chọn khu vực
          </button>
        </div>
      )}

      {moChonKhuVuc && !coViTri && (
        <div className="mt-3">
          <select
            className="o-nhap"
            defaultValue=""
            onChange={(suKien) => {
              if (!suKien.target.value) return
              chonKhuVuc(suKien.target.value)
              datMoChonKhuVuc(false)
            }}
          >
            <option value="">— Chọn tỉnh/thành phố —</option>
            {danhSachKhuVuc.map((muc) => <option key={muc} value={muc}>{muc}</option>)}
          </select>
        </div>
      )}

      {thongBao && <p className="mt-3 text-sm text-amber-300">{thongBao}</p>}
    </div>
  )
}

export function TheRapGanBan({ danhSachRap = [] }) {
  const { coViTri, rapGanTop } = useViTriRap()
  const danhSach = rapGanTop(danhSachRap, 3)

  if (!coViTri || danhSach.length === 0) return null

  return (
    <section className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Navigation size={18} className="text-fuchsia-400" /> Rạp gần bạn
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {danhSach.map((rap) => {
          const link = rap.viDo
            ? `https://www.google.com/maps/dir/?api=1&destination=${rap.viDo},${rap.kinhDo}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rap.diaChi || rap.tenRap)}`
          return (
            <div key={rap.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-fuchsia-400/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{rap.tenRap}</p>
                  <p className="mt-1 text-xs text-cinema-400">{rap.khuVuc}</p>
                </div>
                {rap.khoangCachKm != null && (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                    {dinhDangKhoangCach(rap.khoangCachKm)}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-400">{rap.diaChi}</p>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-fuchsia-300 hover:text-fuchsia-200"
              >
                <MapPin size={13} /> Chỉ đường
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}
