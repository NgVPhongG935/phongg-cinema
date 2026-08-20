import { Building2, KeyRound, Lock, LockOpen, MapPin, Plus, UserCog, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import { layDanhSachRap } from '../../services/cinemaService'
import {
  capNhatRapNhanVien,
  capNhatTrangThaiNhanVien,
  datLaiMatKhauNhanVien,
  layDanhSachNhanVien,
  themNhanVien,
} from '../../services/staffService'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const DU_LIEU_RONG = {
  hoTen: '',
  email: '',
  soDienThoai: '',
  matKhau: '',
  maRapPhuTrach: '',
}

function AvatarNhanVien({ hoTen }) {
  const chu = (hoTen || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-blue-700 text-sm font-bold text-white">
      {chu}
    </div>
  )
}

function BadgeTrangThai({ biKhoa }) {
  if (biKhoa) return <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-200 ring-1 ring-rose-400/30">Đã khóa</span>
  return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30">Hoạt động</span>
}

export default function ManageStaffsPage() {
  const [danhSach, datDanhSach] = useState([])
  const [danhSachRap, datDanhSachRap] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const [dangMoThem, datDangMoThem] = useState(false)
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)
  const [nhanVienDoiRap, datNhanVienDoiRap] = useState(null)
  const [maRapChon, datMaRapChon] = useState('')
  const [nhanVienDoiMk, datNhanVienDoiMk] = useState(null)
  const [matKhauMoi, datMatKhauMoi] = useState('')
  const [thongBao, datThongBao] = useState('')
  const [dangLuu, datDangLuu] = useState(false)

  const taiDanhSach = () => {
    datDangTai(true)
    layDanhSachNhanVien()
      .then(datDanhSach)
      .catch(() => datDanhSach([]))
      .finally(() => datDangTai(false))
  }

  useEffect(() => {
    taiDanhSach()
    layDanhSachRap().then(datDanhSachRap).catch(() => datDanhSachRap([]))
  }, [])

  const moThem = () => {
    datDuLieu(DU_LIEU_RONG)
    datThongBao('')
    datDangMoThem(true)
  }

  const luuNhanVien = async (suKien) => {
    suKien.preventDefault()
    datDangLuu(true)
    datThongBao('')
    try {
      await themNhanVien({
        hoTen: duLieu.hoTen.trim(),
        email: duLieu.email.trim(),
        soDienThoai: duLieu.soDienThoai.trim(),
        matKhau: duLieu.matKhau,
        maRapPhuTrach: duLieu.maRapPhuTrach,
      })
      datThongBao('Đã tạo tài khoản nhân viên.')
      datDangMoThem(false)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const luuRap = async () => {
    if (!nhanVienDoiRap || !maRapChon) return
    datDangLuu(true)
    try {
      await capNhatRapNhanVien(nhanVienDoiRap.id, maRapChon)
      datThongBao('Đã cập nhật rạp phụ trách.')
      datNhanVienDoiRap(null)
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const luuMatKhau = async () => {
    if (!nhanVienDoiMk || matKhauMoi.length < 6) return
    datDangLuu(true)
    try {
      await datLaiMatKhauNhanVien(nhanVienDoiMk.id, matKhauMoi)
      datThongBao('Đã đặt lại mật khẩu.')
      datNhanVienDoiMk(null)
      datMatKhauMoi('')
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const chuyenTrangThai = async (nhanVien) => {
    try {
      await capNhatTrangThaiNhanVien(nhanVien.id, !nhanVien.biKhoa)
      datThongBao(nhanVien.biKhoa ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      taiDanhSach()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">Nhân sự</p>
          <h1 className="mt-1 text-3xl font-black">Tài khoản nhân viên</h1>
          <p className="mt-2 text-slate-400">Cấp tài khoản Staff và phân công rạp phụ trách</p>
        </div>
        <button type="button" onClick={moThem} className="nut-chinh flex items-center gap-2">
          <Plus size={18} /> Thêm nhân viên mới
        </button>
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
                <th className="px-5 py-3">Thông tin</th>
                <th className="px-5 py-3">Rạp làm việc</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dangTai ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Đang tải...</td></tr>
              ) : danhSach.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Chưa có nhân viên.</td></tr>
              ) : (
                danhSach.map((nhanVien) => (
                  <tr key={nhanVien.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarNhanVien hoTen={nhanVien.hoTen} />
                        <div>
                          <p className="font-semibold text-white">{nhanVien.hoTen}</p>
                          <p className="text-xs text-slate-400">{nhanVien.email}</p>
                          {nhanVien.soDienThoai && <p className="text-xs text-slate-500">{nhanVien.soDienThoai}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Building2 size={14} className="text-sky-400" />
                        {nhanVien.tenRapPhuTrach || 'Chưa phân công'}
                      </div>
                    </td>
                    <td className="px-5 py-4"><BadgeTrangThai biKhoa={nhanVien.biKhoa} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Đổi rạp phụ trách"
                          onClick={() => { datNhanVienDoiRap(nhanVien); datMaRapChon(nhanVien.maRapPhuTrach || '') }}
                          className="rounded-lg border border-sky-400/30 p-2 text-sky-200 hover:bg-sky-500/10"
                        >
                          <MapPin size={16} />
                        </button>
                        <button
                          type="button"
                          title="Đặt lại mật khẩu"
                          onClick={() => { datNhanVienDoiMk(nhanVien); datMatKhauMoi('') }}
                          className="rounded-lg border border-amber-400/30 p-2 text-amber-200 hover:bg-amber-500/10"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          type="button"
                          title={nhanVien.biKhoa ? 'Mở khóa' : 'Khóa tài khoản'}
                          onClick={() => chuyenTrangThai(nhanVien)}
                          className="rounded-lg border border-violet-400/30 p-2 text-violet-200 hover:bg-violet-500/10"
                        >
                          {nhanVien.biKhoa ? <LockOpen size={16} /> : <Lock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dangMoThem && (
        <AdminModalOverlay onBackdropClick={() => datDangMoThem(false)} maxWidth="max-w-md">
          <form onSubmit={luuNhanVien} className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2"><UserCog size={20} /> Thêm nhân viên mới</h2>
                <button type="button" onClick={() => datDangMoThem(false)}><X size={20} className="text-slate-400" /></button>
              </div>
            </AdminModalHeader>
            <AdminModalBody className="space-y-3">
              <label className="block text-sm text-slate-300">
                Họ và tên
                <input required value={duLieu.hoTen} onChange={(e) => datDuLieu((c) => ({ ...c, hoTen: e.target.value }))} className="o-nhap mt-1" />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input required type="email" value={duLieu.email} onChange={(e) => datDuLieu((c) => ({ ...c, email: e.target.value }))} className="o-nhap mt-1" />
              </label>
              <label className="block text-sm text-slate-300">
                Số điện thoại
                <input value={duLieu.soDienThoai} onChange={(e) => datDuLieu((c) => ({ ...c, soDienThoai: e.target.value }))} className="o-nhap mt-1" />
              </label>
              <label className="block text-sm text-slate-300">
                Mật khẩu
                <input required type="password" minLength={6} value={duLieu.matKhau} onChange={(e) => datDuLieu((c) => ({ ...c, matKhau: e.target.value }))} className="o-nhap mt-1" placeholder="≥ 6 ký tự" />
              </label>
              <label className="block text-sm text-slate-300">
                Chọn rạp phụ trách
                <select required value={duLieu.maRapPhuTrach} onChange={(e) => datDuLieu((c) => ({ ...c, maRapPhuTrach: e.target.value }))} className="o-nhap mt-1">
                  <option value="">— Chọn rạp —</option>
                  {danhSachRap.map((rap) => (
                    <option key={rap.id} value={rap.id}>{rap.tenRap}</option>
                  ))}
                </select>
              </label>
            </AdminModalBody>
            <AdminModalFooter>
            <button type="submit" disabled={dangLuu} className="nut-chinh w-full disabled:opacity-60">
              {dangLuu ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
            </AdminModalFooter>
          </form>
        </AdminModalOverlay>
      )}

      {nhanVienDoiRap && (
        <AdminModalOverlay onBackdropClick={() => datNhanVienDoiRap(null)} maxWidth="max-w-md">
          <div className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Đổi rạp phụ trách</h3>
                <button type="button" onClick={() => datNhanVienDoiRap(null)}><X size={20} className="text-slate-400" /></button>
              </div>
            </AdminModalHeader>
            <AdminModalBody>
            <p className="text-sm text-slate-400">{nhanVienDoiRap.hoTen}</p>
            <select value={maRapChon} onChange={(e) => datMaRapChon(e.target.value)} className="o-nhap mt-4">
              {danhSachRap.map((rap) => (
                <option key={rap.id} value={rap.id}>{rap.tenRap}</option>
              ))}
            </select>
            </AdminModalBody>
            <AdminModalFooter className="flex gap-3">
              <button type="button" onClick={() => datNhanVienDoiRap(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300">Hủy</button>
              <button type="button" disabled={dangLuu} onClick={luuRap} className="nut-chinh flex-1 py-2.5 text-sm disabled:opacity-60">Cập nhật</button>
            </AdminModalFooter>
          </div>
        </AdminModalOverlay>
      )}

      {nhanVienDoiMk && (
        <AdminModalOverlay onBackdropClick={() => datNhanVienDoiMk(null)} maxWidth="max-w-md">
          <div className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Đặt lại mật khẩu</h3>
                <button type="button" onClick={() => datNhanVienDoiMk(null)}><X size={20} className="text-slate-400" /></button>
              </div>
            </AdminModalHeader>
            <AdminModalBody>
            <p className="text-sm text-slate-400">{nhanVienDoiMk.hoTen} · {nhanVienDoiMk.email}</p>
            <input
              type="password"
              minLength={6}
              value={matKhauMoi}
              onChange={(e) => datMatKhauMoi(e.target.value)}
              className="o-nhap mt-4"
              placeholder="Mật khẩu mới (≥ 6 ký tự)"
            />
            </AdminModalBody>
            <AdminModalFooter className="flex gap-3">
              <button type="button" onClick={() => datNhanVienDoiMk(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300">Hủy</button>
              <button type="button" disabled={dangLuu || matKhauMoi.length < 6} onClick={luuMatKhau} className="nut-chinh flex-1 py-2.5 text-sm disabled:opacity-60">Lưu</button>
            </AdminModalFooter>
          </div>
        </AdminModalOverlay>
      )}
    </div>
  )
}
