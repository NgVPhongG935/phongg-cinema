import { ImageIcon, Loader2, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'

const DU_LIEU_RONG = {
  maCombo: '',
  tenCombo: '',
  loai: 'COMBO',
  moTa: '',
  giaTien: '',
  hinhAnh: '',
  trangThai: 'HOAT_DONG',
}

const LOAI_OPTIONS = [
  { value: 'COMBO', nhan: 'Combo gói', moTa: 'Bắp + nước kết hợp' },
  { value: 'BAP', nhan: 'Bắp / Đồ ăn', moTa: 'Chỉ bắp hoặc snack' },
  { value: 'NUOC', nhan: 'Nước uống', moTa: 'Pepsi, nước ngọt...' },
]

export default function ComboModal({ mo, comboSua, onDong, onLuu, dangLuu }) {
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)

  useEffect(() => {
    if (!mo) return
    if (comboSua) {
      datDuLieu({
        maCombo: comboSua.maCombo || '',
        tenCombo: comboSua.tenCombo || '',
        loai: comboSua.loai || 'COMBO',
        moTa: comboSua.moTa || '',
        giaTien: String(comboSua.giaTien ?? ''),
        hinhAnh: comboSua.hinhAnh || '',
        trangThai: comboSua.trangThai || 'HOAT_DONG',
      })
    } else datDuLieu(DU_LIEU_RONG)
  }, [mo, comboSua])

  useEffect(() => {
    if (!mo) return undefined
    const xuLyEsc = (e) => { if (e.key === 'Escape' && !dangLuu) onDong?.() }
    window.addEventListener('keydown', xuLyEsc)
    return () => window.removeEventListener('keydown', xuLyEsc)
  }, [mo, onDong, dangLuu])

  if (!mo) return null

  const xuLyThayDoi = (suKien) => {
    const { name, value } = suKien.target
    datDuLieu((cu) => ({ ...cu, [name]: value }))
  }

  const xuLyGui = (suKien) => {
    suKien.preventDefault()
    onLuu({
      maCombo: duLieu.maCombo.trim() || undefined,
      tenCombo: duLieu.tenCombo.trim(),
      loai: duLieu.loai,
      moTa: duLieu.moTa.trim(),
      giaTien: Number(duLieu.giaTien),
      hinhAnh: duLieu.hinhAnh.trim(),
      trangThai: duLieu.trangThai,
    })
  }

  const anhXemTruoc = duLieu.hinhAnh?.trim()

  return (
    <AdminModalOverlay onBackdropClick={onDong}>
      <form onSubmit={xuLyGui} className="admin-modal-panel">
        <AdminModalHeader className="relative border-b border-white/10">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                <Sparkles size={14} />
                {comboSua ? 'Cập nhật sản phẩm' : 'Sản phẩm mới'}
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {comboSua ? 'Sửa combo' : 'Thêm combo bắp nước'}
              </h2>
            </div>
            <button type="button" onClick={onDong} disabled={dangLuu} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </AdminModalHeader>

        <AdminModalBody>
          <div className="grid gap-6 md:grid-cols-[1fr_200px]">
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-300">Tên combo <span className="text-red-400">*</span></span>
                <input required name="tenCombo" value={duLieu.tenCombo} onChange={xuLyThayDoi} className="o-nhap w-full" placeholder="Sweet Combo 69oz" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-slate-300">Mã combo</span>
                  <input name="maCombo" value={duLieu.maCombo} onChange={xuLyThayDoi} className="o-nhap w-full font-mono text-sm" placeholder="COMBO_2_PHIM" />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-slate-300">Giá (VNĐ) <span className="text-red-400">*</span></span>
                  <input required type="number" min="1000" step="1000" name="giaTien" value={duLieu.giaTien} onChange={xuLyThayDoi} className="o-nhap w-full" placeholder="99000" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-300">Phân loại</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {LOAI_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => datDuLieu((cu) => ({ ...cu, loai: opt.value }))}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${duLieu.loai === opt.value ? 'border-fuchsia-400/50 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
                    >
                      <span className="block text-sm font-semibold text-white">{opt.nhan}</span>
                      <span className="block text-[10px] text-slate-500">{opt.moTa}</span>
                    </button>
                  ))}
                </div>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-300">Mô tả thành phần</span>
                <textarea name="moTa" value={duLieu.moTa} onChange={xuLyThayDoi} rows={3} className="o-nhap w-full resize-none" placeholder="1 Bắp phô mai lớn + 2 Pepsi 22oz" />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-slate-300">URL hình ảnh</span>
                <input name="hinhAnh" value={duLieu.hinhAnh} onChange={xuLyThayDoi} className="o-nhap w-full" placeholder="https://..." />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-slate-300">Trạng thái bán</span>
                  <p className="text-xs text-slate-500">Khách chỉ thấy mục đang bán</p>
                </div>
                <button
                  type="button"
                  onClick={() => datDuLieu((cu) => ({
                    ...cu,
                    trangThai: cu.trangThai === 'HOAT_DONG' ? 'TAM_NGUNG' : 'HOAT_DONG',
                  }))}
                  className={`relative h-7 w-12 rounded-full transition ${duLieu.trangThai === 'HOAT_DONG' ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${duLieu.trangThai === 'HOAT_DONG' ? 'left-6' : 'left-0.5'}`} />
                </button>
              </label>
            </div>

            <div className="flex flex-col">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Xem trước</p>
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {anhXemTruoc ? (
                  <img src={anhXemTruoc} alt="Xem trước" className="h-full min-h-[180px] w-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-slate-500">
                    <ImageIcon size={32} />
                    <span className="text-xs">Chưa có ảnh</span>
                  </div>
                )}
                {duLieu.giaTien && (
                  <p className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-sm font-bold text-white">
                    {Number(duLieu.giaTien).toLocaleString('vi-VN')} đ
                  </p>
                )}
              </div>
              {duLieu.tenCombo && (
                <p className="mt-3 text-sm font-bold text-white line-clamp-2">{duLieu.tenCombo}</p>
              )}
            </div>
          </div>
        </AdminModalBody>

        <AdminModalFooter className="flex gap-3">
          <button type="button" onClick={onDong} disabled={dangLuu} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">
            Hủy
          </button>
          <button
            type="submit"
            disabled={dangLuu}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/30 disabled:opacity-60"
          >
            {dangLuu ? <Loader2 size={18} className="animate-spin" /> : null}
            {dangLuu ? 'Đang lưu...' : comboSua ? 'Cập nhật combo' : 'Tạo combo'}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModalOverlay>
  )
}
