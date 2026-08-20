import { MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import { capNhatKhuVuc, layDanhSachKhuVucDayDu, themKhuVuc, xoaKhuVuc } from '../../services/regionService'

const DU_LIEU_RONG = { tenKhuVuc: '', thuTu: '' }

export default function ManageRegionsPage() {
  const [danhSach, datDanhSach] = useState([])
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)
  const [khuVucSua, datKhuVucSua] = useState(null)
  const [dangMo, datDangMo] = useState(false)
  const [thongBao, datThongBao] = useState('')

  const taiDuLieu = () => layDanhSachKhuVucDayDu().then(datDanhSach).catch(() => datDanhSach([]))
  useEffect(() => { taiDuLieu() }, [])

  const moBieuMau = (khuVuc = null) => {
    datKhuVucSua(khuVuc)
    datThongBao('')
    datDuLieu(khuVuc ? { tenKhuVuc: khuVuc.tenKhuVuc, thuTu: String(khuVuc.thuTu ?? '') } : DU_LIEU_RONG)
    datDangMo(true)
  }

  const luuKhuVuc = async (suKien) => {
    suKien.preventDefault()
    try {
      const duLieuGui = { tenKhuVuc: duLieu.tenKhuVuc.trim(), thuTu: duLieu.thuTu ? Number(duLieu.thuTu) : null }
      if (khuVucSua) await capNhatKhuVuc(khuVucSua.id, duLieuGui)
      else await themKhuVuc(duLieuGui)
      datThongBao(khuVucSua ? 'Cập nhật khu vực thành công.' : 'Thêm khu vực thành công.')
      datDangMo(false)
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể lưu khu vực.')
    }
  }

  const xoaKhuVucHandler = async (id) => {
    if (!window.confirm('Xóa khu vực này?')) return
    try {
      await xoaKhuVuc(id)
      datThongBao('Đã xóa khu vực.')
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể xóa (có thể đang có rạp thuộc khu vực).')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Khu vực</h1>
          <p className="mt-1 text-slate-400">Quản lý danh sách khu vực trong MongoDB</p>
        </div>
        <button type="button" onClick={() => moBieuMau()} className="nut-chinh flex items-center gap-2"><Plus size={18} />Thêm khu vực</button>
      </div>

      {thongBao && <p className="mt-4 text-sm text-cinema-500">{thongBao}</p>}

      {dangMo && (
        <AdminModalOverlay onBackdropClick={() => datDangMo(false)} maxWidth="max-w-md">
          <form onSubmit={luuKhuVuc} className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{khuVucSua ? 'Sửa khu vực' : 'Thêm khu vực'}</h2>
                <button type="button" onClick={() => datDangMo(false)}><X size={20} /></button>
              </div>
            </AdminModalHeader>
            <AdminModalBody className="space-y-4">
            <label className="block text-sm text-slate-300">Tên khu vực<input required name="tenKhuVuc" value={duLieu.tenKhuVuc} onChange={(e) => datDuLieu((cu) => ({ ...cu, tenKhuVuc: e.target.value }))} className="o-nhap mt-2" placeholder="Tp. Hồ Chí Minh" /></label>
            <label className="block text-sm text-slate-300">Thứ tự hiển thị<input name="thuTu" type="number" value={duLieu.thuTu} onChange={(e) => datDuLieu((cu) => ({ ...cu, thuTu: e.target.value }))} className="o-nhap mt-2" placeholder="1" /></label>
            </AdminModalBody>
            <AdminModalFooter>
            <button className="nut-chinh w-full">{khuVucSua ? 'Cập nhật' : 'Thêm'}</button>
            </AdminModalFooter>
          </form>
        </AdminModalOverlay>
      )}

      <div className="the-kinh mt-8 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin size={18} />Danh sách ({danhSach.length})</h2>
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto scrollbar-thin">
          {danhSach.map((khuVuc) => (
            <div key={khuVuc.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium">{khuVuc.tenKhuVuc}</p>
                <p className="text-xs text-slate-500">Thứ tự: {khuVuc.thuTu ?? '-'}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => moBieuMau(khuVuc)} className="rounded-lg bg-white/10 p-2 hover:bg-white/20"><Pencil size={16} /></button>
                <button type="button" onClick={() => xoaKhuVucHandler(khuVuc.id)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
