import { KHU_VUC_COT, layCapGheDoi } from '../utils/soDoGhe'
import { IconGheDon, IconGheDoi } from './IconGheSofa'

const laySoTuGhe = (soGhe) => parseInt(String(soGhe).replace(/^[A-Z]+/, ''), 10)

function layLoaiIcon({ ghe, dangChon, voHieu, cheDoAdmin }) {
  if (cheDoAdmin) {
    if (!ghe?.loaiGhe) return 'trang'
    if (ghe.loaiGhe === 'VIP') return 'adminVip'
    if (ghe.loaiGhe === 'COUPLE') return 'adminDoi'
    return 'adminThuong'
  }
  if (dangChon) return 'chon'
  if (voHieu) return 'daDat'
  if (ghe?.trangThai === 'HELD') return 'giu'
  if (ghe?.loaiGhe === 'VIP') return 'vip'
  if (ghe?.loaiGhe === 'COUPLE') return 'doi'
  return 'thuong'
}

function NutGhe({ ghe, dangChon, voHieu, cheDoAdmin, onChon, onVe }) {
  if (!ghe) return <span className="inline-block h-11 w-9 sm:h-12 sm:w-10" />
  const loaiIcon = layLoaiIcon({ ghe, dangChon, voHieu, cheDoAdmin })
  const gachCheo = !cheDoAdmin && voHieu
  const nhanGhe = ghe.soGhe
  const voHieuNut = !cheDoAdmin && (voHieu || ghe.trangThai === 'HELD')
  const lopChon = dangChon && !cheDoAdmin ? 'ring-2 ring-blue-400/80 rounded-lg shadow-[0_0_14px_rgba(96,165,250,0.45)]' : ''

  return (
    <button
      type="button"
      onClick={() => (onVe ? onVe(ghe.hang, laySoTuGhe(ghe.soGhe) - 1) : onChon?.(ghe))}
      disabled={voHieuNut}
      className={`group relative flex h-11 w-9 flex-col items-center justify-center transition-all duration-200 sm:h-12 sm:w-10 ${lopChon} ${voHieuNut ? 'cursor-not-allowed' : 'hover:scale-105'}`}
      title={nhanGhe}
    >
      <IconGheDon loai={loaiIcon} kichThuoc={22} gachCheo={gachCheo} className="sm:[&_svg]:!w-6 sm:[&_svg]:!h-6" />
      <span className={`mt-0.5 text-[8px] font-bold leading-none sm:text-[9px] ${gachCheo ? 'text-slate-500 line-through' : dangChon ? 'text-blue-300' : 'text-slate-300'}`}>
        {nhanGhe}
      </span>
    </button>
  )
}

function HangGheThuong({ hang, danhSachGhe, gheChon, cheDoAdmin, onChon, onVe }) {
  const timGhe = (so) => danhSachGhe.find((g) => g.soGhe === `${hang}${so}`)
  const renderKhu = (danhSachSo) => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {danhSachSo.map((so) => (
        <NutGhe
          key={`${hang}${so}`}
          ghe={timGhe(so) || (cheDoAdmin ? { soGhe: `${hang}${so}`, loaiGhe: null, hang } : null)}
          dangChon={gheChon?.includes(`${hang}${so}`)}
          voHieu={timGhe(so)?.trangThai === 'BOOKED'}
          cheDoAdmin={cheDoAdmin}
          onChon={onChon}
          onVe={onVe}
        />
      ))}
    </div>
  )

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:w-6">{hang}</span>
      {renderKhu(KHU_VUC_COT[0])}
      <div className="w-3 shrink-0 sm:w-5" />
      {renderKhu(KHU_VUC_COT[1])}
      <div className="hidden w-3 shrink-0 sm:block sm:w-5" />
      {renderKhu(KHU_VUC_COT[2])}
      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:w-6">{hang}</span>
    </div>
  )
}

function HangGheDoi({ danhSachGhe, gheChon, cheDoAdmin, onChon, onVe }) {
  const gheHang = danhSachGhe.filter((g) => g.soGhe.startsWith('L')).sort((a, b) => laySoTuGhe(a.soGhe) - laySoTuGhe(b.soGhe))
  const cacCap = []
  for (let i = 0; i < gheHang.length; i += 2) cacCap.push([gheHang[i], gheHang[i + 1]])
  const khuVuc = [cacCap.slice(0, 2), cacCap.slice(2, 6), cacCap.slice(6, 8)]

  const renderCap = (cap) => {
    if (!cap?.[0]) return null
    const [ghe1, ghe2] = cap
    const dangChon = gheChon?.includes(ghe1.soGhe) || gheChon?.includes(ghe2?.soGhe)
    const voHieu = ghe1.trangThai === 'BOOKED' || ghe2?.trangThai === 'BOOKED'
    const dangGiu = ghe1.trangThai === 'HELD' || ghe2?.trangThai === 'HELD'
    const loaiIcon = cheDoAdmin
      ? (ghe1.loaiGhe === 'COUPLE' ? 'adminDoi' : 'trang')
      : dangChon ? 'chon' : voHieu ? 'daDat' : dangGiu ? 'giu' : 'doi'
    const gachCheo = !cheDoAdmin && voHieu
    const nhan = ghe2 ? `${ghe1.soGhe} · ${ghe2.soGhe}` : ghe1.soGhe
    const lopChon = dangChon && !cheDoAdmin ? 'ring-2 ring-blue-400/80 rounded-xl shadow-[0_0_14px_rgba(96,165,250,0.45)]' : ''

    return (
      <button
        type="button"
        key={ghe1.soGhe}
        disabled={!cheDoAdmin && (voHieu || dangGiu)}
        onClick={() => (cheDoAdmin ? onVe?.('L', laySoTuGhe(ghe1.soGhe) - 1) : onChon?.(ghe1))}
        className={`relative flex min-w-[5.5rem] flex-col items-center justify-center px-1 py-0.5 transition-all duration-200 sm:min-w-[6.5rem] ${lopChon} ${!cheDoAdmin && (voHieu || dangGiu) ? 'cursor-not-allowed' : 'hover:scale-105'}`}
        title={nhan}
      >
        <IconGheDoi loai={loaiIcon} kichThuoc={22} gachCheo={gachCheo} />
        <span className={`mt-0.5 text-[8px] font-bold leading-tight sm:text-[9px] ${gachCheo ? 'text-slate-500 line-through' : dangChon ? 'text-blue-300' : 'text-slate-300'}`}>
          {ghe2 ? `${ghe1.soGhe} · ${ghe2.soGhe}` : ghe1.soGhe}
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:w-6">L</span>
      <div className="flex gap-0.5 sm:gap-1">{khuVuc[0].map(renderCap)}</div>
      <div className="w-3 shrink-0 sm:w-5" />
      <div className="flex gap-0.5 sm:gap-1">{khuVuc[1].map(renderCap)}</div>
      <div className="hidden w-3 shrink-0 sm:block sm:w-5" />
      <div className="flex gap-0.5 sm:gap-1">{khuVuc[2].map(renderCap)}</div>
      <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:w-6">L</span>
    </div>
  )
}

export default function SoDoGheHienThi({ danhSachGhe = [], gheChon = [], cheDoAdmin = false, onChon, onVe }) {
  const hangThuong = danhSachGhe.filter((g) => !g.soGhe.startsWith('L'))
  const hangLabels = [...new Set(hangThuong.map((g) => g.soGhe[0]))].sort()
  const coGheDoi = danhSachGhe.some((g) => g.soGhe.startsWith('L'))

  if (cheDoAdmin && hangLabels.length === 0 && !coGheDoi) {
    return <p className="text-center text-sm text-slate-500">Chưa có ghế — hãy vẽ trên lưới bên dưới</p>
  }

  return (
    <div className="space-y-2">
      {hangLabels.map((hang) => (
        <HangGheThuong
          key={hang}
          hang={hang}
          danhSachGhe={cheDoAdmin ? danhSachGhe : hangThuong}
          gheChon={gheChon}
          cheDoAdmin={cheDoAdmin}
          onChon={onChon}
          onVe={onVe}
        />
      ))}
      {(coGheDoi || cheDoAdmin) && (
        <HangGheDoi danhSachGhe={danhSachGhe} gheChon={gheChon} cheDoAdmin={cheDoAdmin} onChon={onChon} onVe={onVe} />
      )}
    </div>
  )
}

export { layCapGheDoi }
