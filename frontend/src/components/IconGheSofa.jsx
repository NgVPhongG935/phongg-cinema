import { Armchair } from 'lucide-react'

const MAU_GHE = {
  thuong: 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.45)]',
  vip: 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.55)]',
  doi: 'text-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.45)]',
  chon: 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.75)]',
  daDat: 'text-slate-600',
  giu: 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]',
  adminThuong: 'text-purple-500',
  adminVip: 'text-red-500',
  adminDoi: 'text-pink-500',
  trang: 'text-slate-700',
}

export function IconGheDon({ loai = 'thuong', kichThuoc = 26, className = '', gachCheo = false }) {
  const mau = MAU_GHE[loai] || MAU_GHE.thuong
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <Armchair size={kichThuoc} strokeWidth={1.75} className={mau} aria-hidden />
      {gachCheo && (
        <div
          className="pointer-events-none absolute inset-0 rounded-sm bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(255,255,255,0.35)_3px,rgba(255,255,255,0.35)_5px)]"
          aria-hidden
        />
      )}
    </div>
  )
}

export function IconGheDoi({ loai = 'doi', kichThuoc = 24, className = '', gachCheo = false }) {
  const mau = MAU_GHE[loai] || MAU_GHE.doi
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: kichThuoc * 1.75, height: kichThuoc }}>
      <Armchair size={kichThuoc} strokeWidth={1.75} className={`${mau} -mr-3`} aria-hidden />
      <Armchair size={kichThuoc} strokeWidth={1.75} className={mau} aria-hidden />
      {gachCheo && (
        <div
          className="pointer-events-none absolute inset-0 rounded-sm bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(255,255,255,0.35)_3px,rgba(255,255,255,0.35)_5px)]"
          aria-hidden
        />
      )}
    </div>
  )
}

export function MauGheChuThich({ loai, gachCheo = false, kichThuoc = 20 }) {
  if (loai === 'doi') return <IconGheDoi loai="doi" kichThuoc={kichThuoc} gachCheo={gachCheo} />
  return <IconGheDon loai={loai} kichThuoc={kichThuoc} gachCheo={gachCheo} />
}
