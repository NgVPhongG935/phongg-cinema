import { Mail, Phone, Shield, User, Pencil, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { capNhatProfile, doiMatKhau } from '../services/authService'

const tenVaiTro = { ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', CUSTOMER: 'Khách hàng' }
const moTaVaiTro = {
  ADMIN: 'Quản lý phim, rạp, suất chiếu, vé và doanh thu',
  STAFF: 'Soát vé QR tại cửa rạp',
  CUSTOMER: 'Đặt vé, xem lịch sử vé cá nhân',
}

export default function ProfilePage() {
  const { nguoiDung, capNhatNguoiDung } = useAuth()
  const [cheDoSua, datCheDoSua] = useState(false)
  const [hoTen, datHoTen] = useState('')
  const [soDienThoai, datSoDienThoai] = useState('')
  const [matKhauCu, datMatKhauCu] = useState('')
  const [matKhauMoi, datMatKhauMoi] = useState('')
  const [dangLuu, datDangLuu] = useState(false)
  const [thongBao, datThongBao] = useState('')
  const [loi, datLoi] = useState('')

  const email = nguoiDung?.email
  const vaiTro = nguoiDung?.role || localStorage.getItem('role')

  useEffect(() => {
    if (nguoiDung) {
      datHoTen(nguoiDung.hoTen || '')
      datSoDienThoai(nguoiDung.soDienThoai || '')
    }
  }, [nguoiDung])

  if (!nguoiDung) return <p className="py-20 text-center text-slate-400">Vui lòng đăng nhập để xem thông tin tài khoản.</p>

  const luuProfile = async () => {
    datDangLuu(true)
    datLoi('')
    datThongBao('')
    try {
      const capNhat = await capNhatProfile({ hoTen: hoTen.trim(), soDienThoai: soDienThoai.trim() })
      capNhatNguoiDung(capNhat)
      if (matKhauCu && matKhauMoi) {
        await doiMatKhau({ matKhauCu, matKhauMoi })
        datMatKhauCu('')
        datMatKhauMoi('')
        datThongBao('Đã cập nhật thông tin và mật khẩu')
      } else {
        datThongBao('Đã cập nhật thông tin')
      }
      datCheDoSua(false)
    } catch (err) {
      datLoi(err.response?.data?.message || err.message || 'Lỗi cập nhật')
    } finally {
      datDangLuu(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Thông tin tài khoản</h1>
          <p className="mt-2 text-slate-400">Quản lý thông tin cá nhân tại PhongG Cinema</p>
        </div>
        {!cheDoSua && (
          <button onClick={() => datCheDoSua(true)} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5">
            <Pencil size={16} /> Chỉnh sửa
          </button>
        )}
      </div>

      <div className="the-kinh mt-8 p-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cinema-500 text-2xl font-black">{hoTen?.charAt(0)?.toUpperCase()}</span>
          <div>
            <h2 className="text-xl font-bold">{hoTen}</h2>
            <p className="text-sm text-slate-400">{tenVaiTro[vaiTro] || vaiTro}</p>
            <p className="mt-1 text-xs text-slate-500">{moTaVaiTro[vaiTro]}</p>
          </div>
        </div>

        {cheDoSua ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-slate-400">Họ tên</label>
              <input className="o-nhap mt-1" value={hoTen} onChange={(e) => datHoTen(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Số điện thoại</label>
              <input className="o-nhap mt-1" value={soDienThoai} onChange={(e) => datSoDienThoai(e.target.value)} />
            </div>
            <p className="text-xs text-slate-500">Đổi mật khẩu (tùy chọn)</p>
            <input className="o-nhap" type="password" value={matKhauCu} onChange={(e) => datMatKhauCu(e.target.value)} placeholder="Mật khẩu hiện tại" />
            <input className="o-nhap" type="password" value={matKhauMoi} onChange={(e) => datMatKhauMoi(e.target.value)} placeholder="Mật khẩu mới (≥ 6 ký tự)" />
            {loi && <p className="text-sm text-rose-400">{loi}</p>}
            <div className="flex gap-3">
              <button onClick={() => datCheDoSua(false)} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2">
                <X size={16} /> Hủy
              </button>
              <button onClick={luuProfile} disabled={dangLuu} className="nut-chinh flex items-center gap-2">
                <Save size={16} /> {dangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <User size={18} className="text-cinema-500" />
              <div>
                <p className="text-xs text-slate-400">Họ tên</p>
                <p className="font-semibold">{hoTen}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <Mail size={18} className="text-cinema-500" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-semibold">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <Phone size={18} className="text-cinema-500" />
              <div>
                <p className="text-xs text-slate-400">Số điện thoại</p>
                <p className="font-semibold">{soDienThoai || 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <Shield size={18} className="text-cinema-500" />
              <div>
                <p className="text-xs text-slate-400">Vai trò</p>
                <p className="font-semibold">{tenVaiTro[vaiTro] || vaiTro}</p>
              </div>
            </div>
          </div>
        )}
        {thongBao && <p className="mt-4 text-sm text-emerald-400">{thongBao}</p>}
      </div>
    </div>
  )
}
