import { ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DANH_SACH_DINH_DANG, DANH_SACH_DO_TUOI, DANH_SACH_THE_LOAI, KIEU_SAP_XEP, layNhanMuc, taoDanhSachRap } from '../utils/locPhim'
import { useViTriRap } from '../context/ViTriRapContext'

function MenuDropdown({ nhan, giaTriChon, danhSachMuc, onChon, dangTai = false }) {
  const [dangMo, datDangMo] = useState(false)
  const khuVuc = useRef(null)

  useEffect(() => {
    const dongMenu = (suKien) => {
      if (khuVuc.current && !khuVuc.current.contains(suKien.target)) datDangMo(false)
    }
    document.addEventListener('mousedown', dongMenu)
    return () => document.removeEventListener('mousedown', dongMenu)
  }, [])

  return (
    <div className="relative" ref={khuVuc}>
      <button
        type="button"
        onClick={() => datDangMo((cu) => !cu)}
        className={`flex min-w-[140px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
          dangMo || giaTriChon !== 'TAT_CA'
            ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-white'
            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
      >
        <span className="truncate">
          {nhan}: <b className="font-semibold">{layNhanMuc(danhSachMuc, giaTriChon)}</b>
        </span>
        {dangTai ? (
          <Loader2 size={15} className="animate-spin text-fuchsia-400" />
        ) : (
          <ChevronDown size={16} className={`shrink-0 transition ${dangMo ? 'rotate-180' : ''}`} />
        )}
      </button>

      {dangMo && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 w-full min-w-[240px] overflow-y-auto rounded-xl border border-white/10 bg-cinema-900 shadow-2xl scrollbar-thin">
          {danhSachMuc.map((muc) => (
            <button
              key={muc.ma}
              type="button"
              onClick={() => {
                onChon(muc.ma)
                datDangMo(false)
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                giaTriChon === muc.ma
                  ? 'bg-fuchsia-500/15 font-semibold text-fuchsia-300'
                  : 'text-slate-200'
              }`}
            >
              {muc.nhan}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ThanhLocPhim({
  theLoaiDuocChon, datTheLoaiDuocChon,
  rapDuocChon, datRapDuocChon, danhSachRap = [],
  dinhDangDuocChon, datDinhDangDuocChon,
  doTuoiDuocChon, datDoTuoiDuocChon,
  kieuSapXep, datKieuSapXep,
}) {
  const { coGps, dangTaiGps, layViTriGps } = useViTriRap()
  const danhMucRap = useMemo(() => taoDanhSachRap(danhSachRap), [danhSachRap])

  const xuLyChonRap = async (ma) => {
    if (ma === 'GAN_NHAT' && !coGps) {
      await layViTriGps()
    }
    datRapDuocChon(ma)
  }

  const tabSapXep = [
    { ma: KIEU_SAP_XEP.MOI_NHAT, nhan: 'Mới cập nhật' },
    { ma: KIEU_SAP_XEP.PHO_BIEN, nhan: 'Phổ biến' },
    { ma: KIEU_SAP_XEP.DANH_GIA, nhan: 'Đánh giá' },
  ]

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-cinema-900/80 via-cinema-950/90 to-fuchsia-950/40 p-3 shadow-lg shadow-black/20 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <MenuDropdown nhan="Thể loại" giaTriChon={theLoaiDuocChon} danhSachMuc={DANH_SACH_THE_LOAI} onChon={datTheLoaiDuocChon} />
          <MenuDropdown nhan="Rạp" giaTriChon={rapDuocChon} danhSachMuc={danhMucRap} onChon={xuLyChonRap} dangTai={dangTaiGps} />
          <MenuDropdown nhan="Định dạng" giaTriChon={dinhDangDuocChon} danhSachMuc={DANH_SACH_DINH_DANG} onChon={datDinhDangDuocChon} />
          <MenuDropdown nhan="Độ tuổi" giaTriChon={doTuoiDuocChon} danhSachMuc={DANH_SACH_DO_TUOI} onChon={datDoTuoiDuocChon} />
        </div>

        <div className="flex rounded-xl bg-black/30 p-1">
          {tabSapXep.map((tab) => (
            <button
              key={tab.ma}
              type="button"
              onClick={() => datKieuSapXep(tab.ma)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                kieuSapXep === tab.ma ? 'bg-cinema-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.nhan}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
