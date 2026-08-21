import { Eye, EyeOff, Package, Pencil, Plus, Popcorn, Search, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  capNhatCombo,
  layDanhSachCombo,
  themCombo,
  xoaCombo,
} from '../../services/comboService'
import { dinhDangTien } from '../../utils/formatters'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'
import ComboModal from './ComboModal'

const BO_LOC_LOAI = [
  { ma: 'TAT_CA', nhan: 'Tất cả', icon: Package },
  { ma: 'COMBO', nhan: 'Combo', icon: Sparkles },
  { ma: 'BAP', nhan: 'Bắp / Đồ ăn', icon: Popcorn },
  { ma: 'NUOC', nhan: 'Nước uống', icon: UtensilsCrossed },
]

const nhanLoai = (loai) => {
  if (loai === 'BAP') return 'Bắp / Đồ ăn'
  if (loai === 'NUOC') return 'Nước uống'
  return 'Combo'
}

const mauLoai = (loai) => {
  if (loai === 'BAP') return 'from-amber-500/90 to-orange-600/90'
  if (loai === 'NUOC') return 'from-sky-500/90 to-blue-600/90'
  return 'from-fuchsia-500/90 to-violet-600/90'
}

const ANH_MAC_DINH = 'https://images.unsplash.com/photo-1585647340883-2a8c37b7b137?w=400&h=300&fit=crop'

function TheThongKe({ nhan, giaTri, mau, icon: Icon }) {
  return (
    <div className="admin-glass rounded-2xl p-4 transition hover:border-white/15">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${mau} shadow-lg`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{nhan}</p>
          <p className="text-2xl font-black tabular-nums text-white">{giaTri}</p>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="admin-glass overflow-hidden rounded-2xl">
      <div className="aspect-[4/3] skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 skeleton rounded-lg" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="h-6 w-1/3 skeleton rounded-lg" />
      </div>
    </div>
  )
}

export default function ManageCombosPage() {
  const [danhSach, datDanhSach] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const [tuKhoa, datTuKhoa] = useState('')
  const [loaiLoc, datLoaiLoc] = useState('TAT_CA')
  const [dangMo, datDangMo] = useState(false)
  const [comboSua, datComboSua] = useState(null)
  const [thongBao, datThongBao] = useState('')
  const [dangLuu, datDangLuu] = useState(false)

  const taiDanhSach = () => {
    datDangTai(true)
    layDanhSachCombo()
      .then(datDanhSach)
      .catch(() => datDanhSach([]))
      .finally(() => datDangTai(false))
  }

  useEffect(() => { taiDanhSach() }, [])

  const thongKe = useMemo(() => ({
    tong: danhSach.length,
    dangBan: danhSach.filter((c) => c.trangThai === 'HOAT_DONG').length,
    tamNgung: danhSach.filter((c) => c.trangThai === 'TAM_NGUNG').length,
    combo: danhSach.filter((c) => c.loai === 'COMBO').length,
  }), [danhSach])

  const danhSachLoc = useMemo(() => {
    const chuoi = tuKhoa.trim().toLowerCase()
    return danhSach.filter((combo) => {
      const khopLoai = loaiLoc === 'TAT_CA' || combo.loai === loaiLoc
      const khopTen = !chuoi
        || combo.tenCombo?.toLowerCase().includes(chuoi)
        || combo.moTa?.toLowerCase().includes(chuoi)
        || combo.maCombo?.toLowerCase().includes(chuoi)
      return khopLoai && khopTen
    })
  }, [danhSach, tuKhoa, loaiLoc])

  const moBieuMau = (combo = null) => {
    datComboSua(combo)
    datThongBao('')
    datDangMo(true)
  }

  const luuCombo = async (duLieuGui) => {
    datDangLuu(true)
    datThongBao('')
    try {
      if (comboSua) await capNhatCombo(comboSua.id, duLieuGui)
      else await themCombo(duLieuGui)
      datThongBao(comboSua ? 'Cập nhật combo thành công.' : 'Tạo combo thành công.')
      datDangMo(false)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const chuyenTrangThai = async (combo) => {
    const trangThaiMoi = combo.trangThai === 'HOAT_DONG' ? 'TAM_NGUNG' : 'HOAT_DONG'
    try {
      await capNhatCombo(combo.id, {
        maCombo: combo.maCombo,
        tenCombo: combo.tenCombo,
        loai: combo.loai,
        moTa: combo.moTa,
        giaTien: combo.giaTien,
        hinhAnh: combo.hinhAnh,
        trangThai: trangThaiMoi,
      })
      datThongBao(trangThaiMoi === 'HOAT_DONG' ? 'Đã bật bán combo.' : 'Đã tạm ngừng combo.')
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    }
  }

  const xoaComboItem = async (id) => {
    if (!window.confirm('Xóa combo này? Hành động không thể hoàn tác.')) return
    try {
      await xoaCombo(id)
      datThongBao('Đã xóa combo.')
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    }
  }

  const laLoi = thongBao && (thongBao.includes('Lỗi') || thongBao.includes('Không') || thongBao.includes('HTTP'))

  return (
    <div className="space-y-6">
      <section className="admin-hero relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
              <Popcorn size={14} /> Dịch vụ & Ưu đãi
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Quản lý <span className="bg-gradient-to-r from-amber-200 via-fuchsia-200 to-violet-200 bg-clip-text text-transparent">Combo Bắp Nước</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Thiết kế menu combo, bật/tắt bán và cập nhật giá — khách chọn khi đặt vé.
            </p>
          </div>
          <button
            type="button"
            onClick={() => moBieuMau()}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/40 transition hover:brightness-110"
          >
            <Plus size={18} /> Thêm combo mới
          </button>
        </div>
      </section>

      {thongBao && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${laLoi ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
          {thongBao}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TheThongKe nhan="Tổng sản phẩm" giaTri={thongKe.tong} mau="from-violet-500 to-fuchsia-600" icon={Package} />
        <TheThongKe nhan="Đang bán" giaTri={thongKe.dangBan} mau="from-emerald-500 to-teal-600" icon={Eye} />
        <TheThongKe nhan="Tạm ngừng" giaTri={thongKe.tamNgung} mau="from-rose-500 to-orange-600" icon={EyeOff} />
        <TheThongKe nhan="Combo gói" giaTri={thongKe.combo} mau="from-amber-500 to-orange-500" icon={Sparkles} />
      </div>

      <div className="admin-glass rounded-2xl p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => datTuKhoa(e.target.value)}
              placeholder="Tìm theo tên, mã combo, mô tả..."
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-400/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {BO_LOC_LOAI.map((muc) => {
              const Icon = muc.icon
              const chon = loaiLoc === muc.ma
              return (
                <button
                  key={muc.ma}
                  type="button"
                  onClick={() => datLoaiLoc(muc.ma)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${chon ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={15} />
                  {muc.nhan}
                </button>
              )
            })}
          </div>
        </div>
        {!dangTai && (
          <p className="mt-3 text-xs text-slate-500">
            Hiển thị <b className="text-slate-300">{danhSachLoc.length}</b> / {danhSach.length} mục
          </p>
        )}
      </div>

      {dangTai ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : danhSachLoc.length === 0 ? (
        <div className="admin-glass flex flex-col items-center justify-center rounded-3xl py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30">
            <Popcorn size={32} className="text-fuchsia-300" />
          </div>
          <p className="text-lg font-bold text-white">Chưa có combo phù hợp</p>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            {tuKhoa.trim() ? 'Thử từ khóa khác hoặc đổi bộ lọc.' : 'Bấm «Thêm combo mới» để tạo gói bắp nước đầu tiên.'}
          </p>
          {!tuKhoa.trim() && (
            <button type="button" onClick={() => moBieuMau()} className="mt-6 rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-500">
              <Plus size={16} className="mr-2 inline" /> Tạo combo
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {danhSachLoc.map((combo) => (
            <article
              key={combo.id}
              className="group admin-glass overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/25 hover:shadow-[0_20px_50px_rgba(168,85,247,0.12)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                <img
                  src={combo.hinhAnh || ANH_MAC_DINH}
                  alt={combo.tenCombo}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = ANH_MAC_DINH
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  {combo.trangThai === 'HOAT_DONG' ? (
                    <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">Đang bán</span>
                  ) : (
                    <span className="rounded-full bg-rose-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">Tạm ngừng</span>
                  )}
                </div>
                <span className={`absolute right-3 top-3 rounded-lg bg-gradient-to-r ${mauLoai(combo.loai)} px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg`}>
                  {nhanLoai(combo.loai)}
                </span>
                <p className="absolute bottom-3 left-3 right-3 text-xl font-black text-white drop-shadow-lg">
                  {dinhDangTien(combo.giaTien)}
                </p>
              </div>
              <div className="p-4">
                <h2 className="text-base font-bold leading-snug text-white group-hover:text-fuchsia-100 transition">{combo.tenCombo}</h2>
                <p className="mt-1 font-mono text-[11px] text-slate-500">{combo.maCombo}</p>
                {combo.moTa && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 line-clamp-2">{combo.moTa}</p>
                )}
                <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => moBieuMau(combo)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-white"
                  >
                    <Pencil size={14} /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => chuyenTrangThai(combo)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title={combo.trangThai === 'HOAT_DONG' ? 'Tạm ngừng' : 'Bật bán'}
                  >
                    {combo.trangThai === 'HOAT_DONG' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => xoaComboItem(combo.id)}
                    className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-rose-300 transition hover:bg-rose-500/20"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ComboModal
        mo={dangMo}
        comboSua={comboSua}
        onDong={() => datDangMo(false)}
        onLuu={luuCombo}
        dangLuu={dangLuu}
      />
    </div>
  )
}
