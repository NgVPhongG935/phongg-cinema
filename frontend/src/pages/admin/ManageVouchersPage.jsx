import { Ban, Gift, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import {
  capNhatVoucher,
  layDanhSachVoucher,
  themVoucher,
  voHieuHoaVoucher,
} from '../../services/voucherService'
import { dinhDangNgayGio, dinhDangTien } from '../../utils/formatters'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const DU_LIEU_RONG = {
  maCode: '',
  kieuGiam: 'FIXED',
  giaTriGiam: '',
  giamToiDa: '',
  donToiThieu: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  soLuong: '',
}

const dinhDangInputNgay = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const chuyenNgayGui = (giaTri) => (giaTri ? `${giaTri}:00` : null)

function BadgeTrangThai({ trangThai }) {
  const map = {
    DANG_AP_DUNG: { nhan: 'Đang áp dụng', lop: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30' },
    HET_HAN: { nhan: 'Hết hạn', lop: 'bg-rose-500/15 text-rose-200 ring-rose-400/30' },
    HET_SO_LUONG: { nhan: 'Hết số lượng', lop: 'bg-slate-500/20 text-slate-300 ring-slate-400/30' },
    VO_HIEU: { nhan: 'Vô hiệu', lop: 'bg-slate-500/20 text-slate-400 ring-slate-500/30' },
  }
  const muc = map[trangThai] || map.VO_HIEU
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${muc.lop}`}>{muc.nhan}</span>
}

function hienThiGiaTriGiam(voucher) {
  if (voucher.kieuGiam === 'PERCENT') return `${voucher.giaTriGiam}%`
  return dinhDangTien(voucher.giaTriGiam)
}

function hienThiDieuKien(voucher) {
  const phan = []
  if (voucher.donToiThieu) phan.push(`Đơn từ ${dinhDangTien(voucher.donToiThieu)}`)
  if (voucher.kieuGiam === 'PERCENT' && voucher.giamToiDa) phan.push(`Giảm tối đa ${dinhDangTien(voucher.giamToiDa)}`)
  return phan.join(' · ') || 'Không có điều kiện'
}

export default function ManageVouchersPage() {
  const [danhSach, datDanhSach] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const [dangMo, datDangMo] = useState(false)
  const [voucherSua, datVoucherSua] = useState(null)
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)
  const [thongBao, datThongBao] = useState('')
  const [dangLuu, datDangLuu] = useState(false)

  const taiDanhSach = () => {
    datDangTai(true)
    layDanhSachVoucher()
      .then(datDanhSach)
      .catch(() => datDanhSach([]))
      .finally(() => datDangTai(false))
  }

  useEffect(() => { taiDanhSach() }, [])

  const moBieuMau = (voucher = null) => {
    datVoucherSua(voucher)
    datThongBao('')
    if (voucher) {
      datDuLieu({
        maCode: voucher.maCode || '',
        kieuGiam: voucher.kieuGiam || 'FIXED',
        giaTriGiam: String(voucher.giaTriGiam ?? ''),
        giamToiDa: voucher.giamToiDa ? String(voucher.giamToiDa) : '',
        donToiThieu: voucher.donToiThieu ? String(voucher.donToiThieu) : '',
        ngayBatDau: dinhDangInputNgay(voucher.ngayBatDau),
        ngayKetThuc: dinhDangInputNgay(voucher.ngayKetThuc),
        soLuong: String(voucher.soLuong ?? ''),
      })
    } else datDuLieu(DU_LIEU_RONG)
    datDangMo(true)
  }

  const luuVoucher = async (suKien) => {
    suKien.preventDefault()
    datDangLuu(true)
    datThongBao('')
    const duLieuGui = {
      maCode: duLieu.maCode.trim(),
      kieuGiam: duLieu.kieuGiam,
      giaTriGiam: Number(duLieu.giaTriGiam),
      giamToiDa: duLieu.giamToiDa ? Number(duLieu.giamToiDa) : null,
      donToiThieu: duLieu.donToiThieu ? Number(duLieu.donToiThieu) : null,
      ngayBatDau: chuyenNgayGui(duLieu.ngayBatDau),
      ngayKetThuc: chuyenNgayGui(duLieu.ngayKetThuc),
      soLuong: Number(duLieu.soLuong),
    }
    try {
      if (voucherSua) await capNhatVoucher(voucherSua.id, duLieuGui)
      else await themVoucher(duLieuGui)
      datThongBao(voucherSua ? 'Cập nhật mã giảm giá thành công.' : 'Tạo mã giảm giá thành công.')
      datDangMo(false)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const xoaVoucher = async (id) => {
    if (!window.confirm('Vô hiệu hóa mã giảm giá này?')) return
    try {
      await voHieuHoaVoucher(id)
      datThongBao('Đã vô hiệu hóa mã giảm giá.')
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Ưu đãi</p>
          <h1 className="mt-1 text-3xl font-black">Mã giảm giá</h1>
          <p className="mt-2 text-slate-400">Tạo và quản lý voucher cho khách hàng</p>
        </div>
        <button type="button" onClick={() => moBieuMau()} className="nut-chinh flex items-center gap-2">
          <Plus size={18} /> Tạo mã giảm giá mới
        </button>
      </div>

      {thongBao && (
        <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${thongBao.includes('Lỗi') || thongBao.includes('Không') ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
          {thongBao}
        </p>
      )}

      <div className="admin-glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Mã code</th>
                <th className="px-5 py-3">Giá trị giảm</th>
                <th className="px-5 py-3">Điều kiện</th>
                <th className="px-5 py-3">Hạn sử dụng</th>
                <th className="px-5 py-3">Còn lại</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dangTai ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Đang tải...</td></tr>
              ) : danhSach.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Chưa có mã giảm giá.</td></tr>
              ) : (
                danhSach.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-fuchsia-400" />
                        <span className="font-mono font-bold text-white">{voucher.maCode}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-fuchsia-300">{hienThiGiaTriGiam(voucher)}</td>
                    <td className="px-5 py-4 text-slate-300">{hienThiDieuKien(voucher)}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {dinhDangNgayGio(voucher.ngayBatDau)} → {dinhDangNgayGio(voucher.ngayKetThuc)}
                    </td>
                    <td className="px-5 py-4 text-white">{voucher.soLuongConLai ?? 0} / {voucher.soLuong}</td>
                    <td className="px-5 py-4"><BadgeTrangThai trangThai={voucher.trangThai} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" title="Sửa" onClick={() => moBieuMau(voucher)} className="rounded-lg border border-violet-400/30 p-2 text-violet-200 hover:bg-violet-500/10">
                          <Pencil size={16} />
                        </button>
                        {voucher.trangThai !== 'VO_HIEU' && (
                          <button type="button" title="Vô hiệu hóa" onClick={() => xoaVoucher(voucher.id)} className="rounded-lg border border-rose-400/30 p-2 text-rose-200 hover:bg-rose-500/10">
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dangMo && (
        <AdminModalOverlay onBackdropClick={() => datDangMo(false)} maxWidth="max-w-lg">
          <form onSubmit={luuVoucher} className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{voucherSua ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h2>
                <button type="button" onClick={() => datDangMo(false)}><X size={20} className="text-slate-400" /></button>
              </div>
            </AdminModalHeader>
            <AdminModalBody className="space-y-3">
              <label className="block text-sm text-slate-300">
                Mã code
                <input required value={duLieu.maCode} onChange={(e) => datDuLieu((c) => ({ ...c, maCode: e.target.value.toUpperCase() }))} className="o-nhap mt-1 font-mono" placeholder="PHONGG20K" />
              </label>
              <label className="block text-sm text-slate-300">
                Kiểu giảm
                <select value={duLieu.kieuGiam} onChange={(e) => datDuLieu((c) => ({ ...c, kieuGiam: e.target.value }))} className="o-nhap mt-1">
                  <option value="FIXED">Tiền mặt (VND)</option>
                  <option value="PERCENT">Theo %</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Giá trị giảm {duLieu.kieuGiam === 'PERCENT' ? '(%)' : '(VND)'}
                <input required type="number" min="1" value={duLieu.giaTriGiam} onChange={(e) => datDuLieu((c) => ({ ...c, giaTriGiam: e.target.value }))} className="o-nhap mt-1" />
              </label>
              {duLieu.kieuGiam === 'PERCENT' && (
                <label className="block text-sm text-slate-300">
                  Giảm tối đa (VND)
                  <input type="number" min="0" value={duLieu.giamToiDa} onChange={(e) => datDuLieu((c) => ({ ...c, giamToiDa: e.target.value }))} className="o-nhap mt-1" />
                </label>
              )}
              <label className="block text-sm text-slate-300">
                Đơn tối thiểu (VND)
                <input type="number" min="0" value={duLieu.donToiThieu} onChange={(e) => datDuLieu((c) => ({ ...c, donToiThieu: e.target.value }))} className="o-nhap mt-1" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Ngày bắt đầu
                  <input required type="datetime-local" value={duLieu.ngayBatDau} onChange={(e) => datDuLieu((c) => ({ ...c, ngayBatDau: e.target.value }))} className="o-nhap mt-1" />
                </label>
                <label className="block text-sm text-slate-300">
                  Ngày kết thúc
                  <input required type="datetime-local" value={duLieu.ngayKetThuc} onChange={(e) => datDuLieu((c) => ({ ...c, ngayKetThuc: e.target.value }))} className="o-nhap mt-1" />
                </label>
              </div>
              <label className="block text-sm text-slate-300">
                Số lượng
                <input required type="number" min="1" value={duLieu.soLuong} onChange={(e) => datDuLieu((c) => ({ ...c, soLuong: e.target.value }))} className="o-nhap mt-1" />
              </label>
            </AdminModalBody>
            <AdminModalFooter>
            <button type="submit" disabled={dangLuu} className="nut-chinh w-full disabled:opacity-60">
              {dangLuu ? 'Đang lưu...' : voucherSua ? 'Cập nhật' : 'Tạo mã'}
            </button>
            </AdminModalFooter>
          </form>
        </AdminModalOverlay>
      )}
    </div>
  )
}
