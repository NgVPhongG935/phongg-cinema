import {
  AlertTriangle, Edit2, Lock, LockOpen, Plus, Search, Shield, Ticket, Trash2, UserPlus, X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import { layDanhSachVeCuaToi } from '../../services/ticketService'
import {
  capNhatNguoiDung,
  capNhatTrangThaiNguoiDung,
  capNhatVaiTroNguoiDung,
  layDanhSachNguoiDung,
  taoNguoiDung,
  xoaNguoiDung,
} from '../../services/userService'
import { dinhDangKhoangGio, dinhDangNgayGio, dinhDangTien } from '../../utils/formatters'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'
import { tenTrangThaiVe } from '../../utils/hinhThucThanhToan'

const TAB = {
  TAT_CA: 'TAT_CA',
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  BI_KHOA: 'BI_KHOA',
}

const DANH_SACH_TAB = [
  { ma: TAB.TAT_CA, nhan: 'Tất cả' },
  { ma: TAB.CUSTOMER, nhan: 'Khách hàng' },
  { ma: TAB.STAFF, nhan: 'Nhân viên' },
  { ma: TAB.ADMIN, nhan: 'Quản trị viên' },
  { ma: TAB.BI_KHOA, nhan: 'Bị khóa' },
]

const VAI_TRO_OPTIONS = [
  { ma: 'CUSTOMER', nhan: 'Khách hàng (CUSTOMER)' },
  { ma: 'STAFF', nhan: 'Nhân viên (STAFF)' },
  { ma: 'ADMIN', nhan: 'Quản trị viên (ADMIN)' },
]

function BadgeVaiTro({ vaiTro }) {
  const lop = vaiTro === 'ADMIN'
    ? 'bg-orange-500/20 text-orange-200 ring-orange-400/30'
    : vaiTro === 'STAFF'
      ? 'bg-sky-500/20 text-sky-200 ring-sky-400/30'
      : 'bg-purple-500/20 text-purple-200 ring-purple-400/30'
  const nhan = vaiTro === 'ADMIN' ? 'ADMIN' : vaiTro === 'STAFF' ? 'STAFF' : 'CUSTOMER'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${lop}`}>{nhan}</span>
}

function BadgeTrangThai({ biKhoa }) {
  if (biKhoa) return <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-200 ring-1 ring-rose-400/30">Đã khóa</span>
  return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30">Hoạt động</span>
}

function AvatarNguoiDung({ hoTen }) {
  const chu = (hoTen || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/30">
      {chu}
    </div>
  )
}

function ModalThemNguoiDung({ dangMo, onDong, onLuu, dangXuLy }) {
  const [duLieu, datDuLieu] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    vaiTro: 'CUSTOMER',
  })
  const [loi, datLoi] = useState('')

  useEffect(() => {
    if (dangMo) {
      datDuLieu({ hoTen: '', email: '', soDienThoai: '', matKhau: '', vaiTro: 'CUSTOMER' })
      datLoi('')
    }
  }, [dangMo])

  if (!dangMo) return null

  const xuLySubmit = (e) => {
    e.preventDefault()
    if (!duLieu.hoTen.trim()) { datLoi('Vui lòng nhập họ tên'); return }
    if (!duLieu.email.trim()) { datLoi('Vui lòng nhập email'); return }
    if (!duLieu.matKhau || duLieu.matKhau.length < 6) { datLoi('Mật khẩu tối thiểu 6 ký tự'); return }
    datLoi('')
    onLuu(duLieu)
  }

  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-md">
      <div className="admin-modal-panel">
        <AdminModalHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserPlus size={20} className="text-fuchsia-400" />
              Thêm người dùng mới
            </h3>
            <button type="button" onClick={onDong} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
        </AdminModalHeader>
        <form onSubmit={xuLySubmit}>
          <AdminModalBody className="space-y-4">
            {loi && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {loi}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300">Họ và tên *</label>
              <input
                type="text"
                required
                value={duLieu.hoTen}
                onChange={(e) => datDuLieu({ ...duLieu, hoTen: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Email *</label>
              <input
                type="email"
                required
                value={duLieu.email}
                onChange={(e) => datDuLieu({ ...duLieu, email: e.target.value })}
                placeholder="user@example.com"
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Số điện thoại</label>
              <input
                type="tel"
                value={duLieu.soDienThoai}
                onChange={(e) => datDuLieu({ ...duLieu, soDienThoai: e.target.value })}
                placeholder="0987 654 321"
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Mật khẩu ban đầu *</label>
              <input
                type="password"
                required
                value={duLieu.matKhau}
                onChange={(e) => datDuLieu({ ...duLieu, matKhau: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Vai trò</label>
              <select
                value={duLieu.vaiTro}
                onChange={(e) => datDuLieu({ ...duLieu, vaiTro: e.target.value })}
                className="o-nhap mt-1 w-full"
              >
                {VAI_TRO_OPTIONS.map((opt) => (
                  <option key={opt.ma} value={opt.ma}>{opt.nhan}</option>
                ))}
              </select>
            </div>
          </AdminModalBody>
          <AdminModalFooter className="flex gap-3">
            <button type="button" onClick={onDong} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5">Hủy</button>
            <button type="submit" disabled={dangXuLy} className="nut-chinh flex-1 py-2.5 text-sm disabled:opacity-60">
              {dangXuLy ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </AdminModalFooter>
        </form>
      </div>
    </AdminModalOverlay>
  )
}

function ModalSuaNguoiDung({ nguoiDung, onDong, onLuu, dangXuLy }) {
  const [duLieu, datDuLieu] = useState({
    hoTen: '',
    soDienThoai: '',
    matKhau: '',
    vaiTro: 'CUSTOMER',
  })
  const [loi, datLoi] = useState('')

  useEffect(() => {
    if (nguoiDung) {
      datDuLieu({
        hoTen: nguoiDung.hoTen || '',
        soDienThoai: nguoiDung.soDienThoai || '',
        matKhau: '',
        vaiTro: nguoiDung.vaiTro || 'CUSTOMER',
      })
      datLoi('')
    }
  }, [nguoiDung])

  if (!nguoiDung) return null

  const xuLySubmit = (e) => {
    e.preventDefault()
    if (!duLieu.hoTen.trim()) { datLoi('Vui lòng nhập họ tên'); return }
    if (duLieu.matKhau && duLieu.matKhau.length < 6) { datLoi('Mật khẩu mới tối thiểu 6 ký tự'); return }
    datLoi('')
    onLuu(duLieu)
  }

  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-md">
      <div className="admin-modal-panel">
        <AdminModalHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Edit2 size={18} className="text-fuchsia-400" />
              Chỉnh sửa người dùng
            </h3>
            <button type="button" onClick={onDong} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
        </AdminModalHeader>
        <form onSubmit={xuLySubmit}>
          <AdminModalBody className="space-y-4">
            {loi && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {loi}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400">Email (Không thể sửa)</label>
              <input
                type="email"
                disabled
                value={nguoiDung.email}
                className="o-nhap mt-1 w-full cursor-not-allowed opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Họ và tên *</label>
              <input
                type="text"
                required
                value={duLieu.hoTen}
                onChange={(e) => datDuLieu({ ...duLieu, hoTen: e.target.value })}
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Số điện thoại</label>
              <input
                type="tel"
                value={duLieu.soDienThoai}
                onChange={(e) => datDuLieu({ ...duLieu, soDienThoai: e.target.value })}
                placeholder="0987 654 321"
                className="o-nhap mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Vai trò</label>
              <select
                value={duLieu.vaiTro}
                onChange={(e) => datDuLieu({ ...duLieu, vaiTro: e.target.value })}
                className="o-nhap mt-1 w-full"
              >
                {VAI_TRO_OPTIONS.map((opt) => (
                  <option key={opt.ma} value={opt.ma}>{opt.nhan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Đổi mật khẩu mới <span className="text-slate-500 font-normal">(để trống nếu không đổi)</span>
              </label>
              <input
                type="password"
                value={duLieu.matKhau}
                onChange={(e) => datDuLieu({ ...duLieu, matKhau: e.target.value })}
                placeholder="Nhập mật khẩu mới nếu muốn đổi"
                className="o-nhap mt-1 w-full"
              />
            </div>
          </AdminModalBody>
          <AdminModalFooter className="flex gap-3">
            <button type="button" onClick={onDong} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5">Hủy</button>
            <button type="submit" disabled={dangXuLy} className="nut-chinh flex-1 py-2.5 text-sm disabled:opacity-60">
              {dangXuLy ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </AdminModalFooter>
        </form>
      </div>
    </AdminModalOverlay>
  )
}

function ModalXacNhanXoa({ nguoiDung, onDong, onXacNhan, dangXuLy }) {
  if (!nguoiDung) return null
  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-md">
      <div className="admin-modal-panel">
        <AdminModalHeader>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle size={22} />
            <h3 className="text-lg font-bold">Xác nhận xóa tài khoản</h3>
          </div>
        </AdminModalHeader>
        <AdminModalBody>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa tài khoản <strong className="text-white">{nguoiDung.hoTen}</strong> (
            <span className="text-fuchsia-300">{nguoiDung.email}</span>)?
          </p>
          <p className="mt-2 text-xs text-rose-300/80">
            ⚠️ Hành động này sẽ xóa vĩnh viễn dữ liệu người dùng khỏi hệ thống và không thể hoàn tác.
          </p>
        </AdminModalBody>
        <AdminModalFooter className="flex gap-3">
          <button type="button" onClick={onDong} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5">
            Hủy
          </button>
          <button
            type="button"
            disabled={dangXuLy}
            onClick={onXacNhan}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition"
          >
            {dangXuLy ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </button>
        </AdminModalFooter>
      </div>
    </AdminModalOverlay>
  )
}

function ModalPhanQuyen({ nguoiDung, onDong, onLuu, dangXuLy }) {
  const [vaiTro, datVaiTro] = useState(nguoiDung?.vaiTro || 'CUSTOMER')
  useEffect(() => { datVaiTro(nguoiDung?.vaiTro || 'CUSTOMER') }, [nguoiDung])
  if (!nguoiDung) return null
  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-md">
      <div className="admin-modal-panel">
        <AdminModalHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Phân quyền tài khoản</h3>
            <button type="button" onClick={onDong} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
        </AdminModalHeader>
        <AdminModalBody>
        <p className="text-sm text-slate-400">{nguoiDung.hoTen} · {nguoiDung.email}</p>
        <label className="mt-4 block text-sm text-slate-300">
          Vai trò mới
          <select value={vaiTro} onChange={(e) => datVaiTro(e.target.value)} className="o-nhap mt-2">
            {VAI_TRO_OPTIONS.map((muc) => (
              <option key={muc.ma} value={muc.ma}>{muc.nhan}</option>
            ))}
          </select>
        </label>
        </AdminModalBody>
        <AdminModalFooter className="flex gap-3">
          <button type="button" onClick={onDong} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5">Hủy</button>
          <button type="button" disabled={dangXuLy} onClick={() => onLuu(vaiTro)} className="nut-chinh flex-1 py-2.5 text-sm disabled:opacity-60">
            {dangXuLy ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </AdminModalFooter>
      </div>
    </AdminModalOverlay>
  )
}

function ModalVeNguoiDung({ nguoiDung, onDong }) {
  const [danhSachVe, datDanhSachVe] = useState([])
  const [dangTai, datDangTai] = useState(true)
  useEffect(() => {
    if (!nguoiDung?.id) return
    datDangTai(true)
    layDanhSachVeCuaToi(nguoiDung.id)
      .then(datDanhSachVe)
      .catch(() => datDanhSachVe([]))
      .finally(() => datDangTai(false))
  }, [nguoiDung?.id])
  if (!nguoiDung) return null
  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-2xl">
      <div className="admin-modal-panel">
        <AdminModalHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Vé đã đặt</h3>
            <button type="button" onClick={onDong} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
        </AdminModalHeader>
        <AdminModalBody>
        <p className="text-sm text-slate-400">{nguoiDung.hoTen} · {nguoiDung.email}</p>
        <div className="mt-4 space-y-3">
          {dangTai ? (
            <p className="text-sm text-slate-400">Đang tải vé...</p>
          ) : danhSachVe.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có vé nào.</p>
          ) : (
            danhSachVe.map((ve) => (
              <div key={ve.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{ve.movieTitle || ve.title || '—'}</p>
                    <p className="mt-1 text-slate-400">
                      {ve.tenRap} · Phòng {ve.maPhong} · Ghế {(ve.danhSachGheChon || []).join(', ')}
                    </p>
                    <p className="mt-1 text-slate-400">
                      {dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc)} · {dinhDangNgayGio(ve.ngayTao)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">
                      {tenTrangThaiVe(ve.trangThai)}
                    </span>
                    <p className="mt-2 font-bold text-fuchsia-300">{dinhDangTien(ve.tongTien)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </AdminModalBody>
      </div>
    </AdminModalOverlay>
  )
}

export default function ManageUsersPage() {
  const [tab, datTab] = useState(TAB.TAT_CA)
  const [tuKhoa, datTuKhoa] = useState('')
  const [danhSach, datDanhSach] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const [thongBao, datThongBao] = useState('')
  const [nguoiPhanQuyen, datNguoiPhanQuyen] = useState(null)
  const [nguoiXemVe, datNguoiXemVe] = useState(null)
  const [nguoiChinhSua, datNguoiChinhSua] = useState(null)
  const [nguoiXoa, datNguoiXoa] = useState(null)
  const [moModalThem, datMoModalThem] = useState(false)
  const [dangXuLy, datDangXuLy] = useState(false)

  const thamSoLoc = useCallback(() => {
    const thamSo = { size: 200 }
    if (tuKhoa.trim()) thamSo.tuKhoa = tuKhoa.trim()
    if (tab === TAB.BI_KHOA) thamSo.trangThai = 'LOCKED'
    else if (tab !== TAB.TAT_CA) thamSo.vaiTro = tab
    return thamSo
  }, [tab, tuKhoa])

  const taiDanhSach = useCallback(() => {
    datDangTai(true)
    layDanhSachNguoiDung(thamSoLoc())
      .then((phanHoi) => datDanhSach(phanHoi.content || phanHoi))
      .catch((loi) => {
        datDanhSach([])
        datThongBao(layThongBaoLoiApi(loi))
      })
      .finally(() => datDangTai(false))
  }, [thamSoLoc])

  useEffect(() => {
    const hen = setTimeout(taiDanhSach, tuKhoa.trim() ? 300 : 0)
    return () => clearTimeout(hen)
  }, [taiDanhSach, tuKhoa])

  // Thêm người dùng mới
  const luuTaoNguoiDung = async (duLieu) => {
    datDangXuLy(true)
    datThongBao('')
    try {
      await taoNguoiDung(duLieu)
      datThongBao('🎉 Đã tạo người dùng mới thành công!')
      datMoModalThem(false)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi, 'Không thể tạo người dùng'))
    } finally {
      datDangXuLy(false)
    }
  }

  // Cập nhật người dùng
  const luuCapNhatNguoiDung = async (duLieu) => {
    if (!nguoiChinhSua) return
    datDangXuLy(true)
    datThongBao('')
    try {
      await capNhatNguoiDung(nguoiChinhSua.id, duLieu)
      datThongBao('Đã cập nhật thông tin người dùng thành công!')
      datNguoiChinhSua(null)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi, 'Không thể cập nhật người dùng'))
    } finally {
      datDangXuLy(false)
    }
  }

  // Xóa người dùng
  const xacNhanXoaNguoiDung = async () => {
    if (!nguoiXoa) return
    datDangXuLy(true)
    datThongBao('')
    try {
      await xoaNguoiDung(nguoiXoa.id)
      datThongBao('Đã xóa người dùng thành công!')
      datNguoiXoa(null)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi, 'Không thể xóa người dùng'))
    } finally {
      datDangXuLy(false)
    }
  }

  const luuVaiTro = async (vaiTro) => {
    if (!nguoiPhanQuyen) return
    datDangXuLy(true)
    datThongBao('')
    try {
      await capNhatVaiTroNguoiDung(nguoiPhanQuyen.id, vaiTro)
      datThongBao('Đã cập nhật vai trò.')
      datNguoiPhanQuyen(null)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangXuLy(false)
    }
  }

  const chuyenTrangThai = async (nguoiDung) => {
    datThongBao('')
    try {
      await capNhatTrangThaiNguoiDung(nguoiDung.id, !nguoiDung.biKhoa)
      datThongBao(nguoiDung.biKhoa ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Tài khoản</p>
          <h1 className="mt-1 text-3xl font-black text-white">Quản lý người dùng</h1>
          <p className="mt-2 text-slate-400">Thêm, sửa, xóa, phân quyền và khóa/mở khóa tài khoản người dùng</p>
        </div>
        <button
          type="button"
          onClick={() => datMoModalThem(true)}
          className="nut-chinh flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-600/30"
        >
          <Plus size={18} />
          Thêm người dùng mới
        </button>
      </div>

      <div className="admin-glass mb-6 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={tuKhoa}
            onChange={(e) => datTuKhoa(e.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="o-nhap pl-10"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DANH_SACH_TAB.map((muc) => (
            <button
              key={muc.ma}
              type="button"
              onClick={() => datTab(muc.ma)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === muc.ma ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20' : 'border border-white/10 text-slate-400 hover:text-white'}`}
            >
              {muc.nhan}
            </button>
          ))}
        </div>
      </div>

      {thongBao && (
        <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${thongBao.includes('Lỗi') || thongBao.includes('Không') ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
          {thongBao}
        </p>
      )}

      <div className="admin-glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Họ và tên</th>
                <th className="px-5 py-3">Số điện thoại</th>
                <th className="px-5 py-3">Vai trò</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dangTai ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Đang tải...</td></tr>
              ) : danhSach.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Không có người dùng phù hợp.</td></tr>
              ) : (
                danhSach.map((nguoiDung) => (
                  <tr key={nguoiDung.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarNguoiDung hoTen={nguoiDung.hoTen} />
                        <div>
                          <p className="font-semibold text-white">{nguoiDung.hoTen || 'Chưa có tên'}</p>
                          <p className="text-xs text-slate-400">{nguoiDung.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{nguoiDung.soDienThoai || '—'}</td>
                    <td className="px-5 py-4"><BadgeVaiTro vaiTro={nguoiDung.vaiTro} /></td>
                    <td className="px-5 py-4"><BadgeTrangThai biKhoa={nguoiDung.biKhoa} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* Nút Sửa */}
                        <button
                          type="button"
                          title="Sửa thông tin"
                          onClick={() => datNguoiChinhSua(nguoiDung)}
                          className="rounded-lg border border-fuchsia-400/30 p-2 text-fuchsia-200 hover:bg-fuchsia-500/10 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        {/* Nút Xóa */}
                        <button
                          type="button"
                          title="Xóa người dùng"
                          onClick={() => datNguoiXoa(nguoiDung)}
                          className="rounded-lg border border-rose-400/30 p-2 text-rose-300 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        {/* Nút Phân quyền */}
                        <button
                          type="button"
                          title="Phân quyền"
                          onClick={() => datNguoiPhanQuyen(nguoiDung)}
                          className="rounded-lg border border-violet-400/30 p-2 text-violet-200 hover:bg-violet-500/10 transition"
                        >
                          <Shield size={16} />
                        </button>
                        {/* Nút Khóa / Mở khóa */}
                        <button
                          type="button"
                          title={nguoiDung.biKhoa ? 'Mở khóa' : 'Khóa tài khoản'}
                          onClick={() => chuyenTrangThai(nguoiDung)}
                          className="rounded-lg border border-amber-400/30 p-2 text-amber-200 hover:bg-amber-500/10 transition"
                        >
                          {nguoiDung.biKhoa ? <LockOpen size={16} /> : <Lock size={16} />}
                        </button>
                        {/* Nút Xem vé */}
                        <button
                          type="button"
                          title="Xem vé đã đặt"
                          onClick={() => datNguoiXemVe(nguoiDung)}
                          className="rounded-lg border border-sky-400/30 p-2 text-sky-200 hover:bg-sky-500/10 transition"
                        >
                          <Ticket size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!dangTai && danhSach.length > 0 && (
          <p className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
            Hiển thị {danhSach.length} người dùng
          </p>
        )}
      </div>

      <ModalThemNguoiDung
        dangMo={moModalThem}
        onDong={() => datMoModalThem(false)}
        onLuu={luuTaoNguoiDung}
        dangXuLy={dangXuLy}
      />
      <ModalSuaNguoiDung
        nguoiDung={nguoiChinhSua}
        onDong={() => datNguoiChinhSua(null)}
        onLuu={luuCapNhatNguoiDung}
        dangXuLy={dangXuLy}
      />
      <ModalXacNhanXoa
        nguoiDung={nguoiXoa}
        onDong={() => datNguoiXoa(null)}
        onXacNhan={xacNhanXoaNguoiDung}
        dangXuLy={dangXuLy}
      />
      <ModalPhanQuyen
        nguoiDung={nguoiPhanQuyen}
        onDong={() => datNguoiPhanQuyen(null)}
        onLuu={luuVaiTro}
        dangXuLy={dangXuLy}
      />
      <ModalVeNguoiDung nguoiDung={nguoiXemVe} onDong={() => datNguoiXemVe(null)} />
    </div>
  )
}

