import { Film, LogIn, Mail, Phone, UserCheck, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NutDangNhapGoogle from '../components/NutDangNhapGoogle'
import { useAuth } from '../context/AuthContext'
import { dangNhap, dangKy } from '../services/authService'
import { layThongBaoLoiAuth } from '../utils/layThongBaoLoiApi'
import { layDuongDanSauDangNhap } from '../utils/dieuHuongSauDangNhap'

export default function LoginPage() {
  const [laDangKy, datLaDangKy] = useState(false)
  const [duLieu, datDuLieu] = useState({
    email: '',
    matKhau: '',
    xacNhanMatKhau: '',
    hoTen: '',
    soDienThoai: '',
  })
  const [loi, datLoi] = useState('')
  const [dangXuLy, datDangXuLy] = useState(false)
  const { capNhatNguoiDung } = useAuth()
  const dieuHuong = useNavigate()

  const xuLyThayDoi = (suKien) =>
    datDuLieu((cu) => ({ ...cu, [suKien.target.name]: suKien.target.value }))

  const luuPhienDangNhap = (phanHoi) => {
    localStorage.setItem('token', phanHoi.token)
    localStorage.setItem('role', phanHoi.role)
    localStorage.setItem('hoTen', phanHoi.hoTen)
    capNhatNguoiDung({ id: phanHoi.id, email: phanHoi.email, hoTen: phanHoi.hoTen, role: phanHoi.role })
    dieuHuong(layDuongDanSauDangNhap(phanHoi.role))
  }

  // 1. Đăng nhập
  const xuLyDangNhap = async (suKien) => {
    suKien.preventDefault()
    datLoi('')
    datDangXuLy(true)
    try {
      const phanHoi = await dangNhap({ email: duLieu.email, matKhau: duLieu.matKhau })
      luuPhienDangNhap(phanHoi)
    } catch (loiPhanHoi) {
      datLoi(layThongBaoLoiAuth(loiPhanHoi, 'Đăng nhập không thành công'))
    } finally {
      datDangXuLy(false)
    }
  }

  // 2. Đăng ký trực tiếp (Không cần OTP)
  const xuLyDangKy = async (suKien) => {
    suKien.preventDefault()
    datLoi('')

    if (duLieu.matKhau.length < 6) {
      datLoi('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (duLieu.xacNhanMatKhau && duLieu.matKhau !== duLieu.xacNhanMatKhau) {
      datLoi('Mật khẩu xác nhận không khớp')
      return
    }

    datDangXuLy(true)
    try {
      const phanHoi = await dangKy({
        hoTen: duLieu.hoTen,
        email: duLieu.email,
        matKhau: duLieu.matKhau,
        soDienThoai: duLieu.soDienThoai,
      })
      luuPhienDangNhap(phanHoi)
    } catch (loiPhanHoi) {
      datLoi(layThongBaoLoiAuth(loiPhanHoi, 'Đăng ký không thành công'))
    } finally {
      datDangXuLy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10">
      <div className="the-kinh w-full p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 p-3 text-white shadow-lg shadow-purple-500/20">
            <Film size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white">
              {laDangKy ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
            </h1>
            <p className="text-sm text-slate-400">PhongG Cinema đang chờ bạn</p>
          </div>
        </div>

        <form onSubmit={laDangKy ? xuLyDangKy : xuLyDangNhap} className="space-y-3.5">
          {laDangKy && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Họ và tên</label>
              <div className="relative">
                <input
                  className="o-nhap w-full pl-10"
                  name="hoTen"
                  value={duLieu.hoTen}
                  onChange={xuLyThayDoi}
                  placeholder="Nguyễn Văn A"
                  required
                />
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Email</label>
            <div className="relative">
              <input
                className="o-nhap w-full pl-10"
                name="email"
                type="email"
                value={duLieu.email}
                onChange={xuLyThayDoi}
                placeholder="example@gmail.com"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {laDangKy && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Số điện thoại <span className="text-slate-500 font-normal">(không bắt buộc)</span>
              </label>
              <div className="relative">
                <input
                  className="o-nhap w-full pl-10"
                  name="soDienThoai"
                  type="tel"
                  value={duLieu.soDienThoai}
                  onChange={xuLyThayDoi}
                  placeholder="0987 654 321"
                />
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Mật khẩu</label>
            <input
              className="o-nhap w-full"
              name="matKhau"
              type="password"
              value={duLieu.matKhau}
              onChange={xuLyThayDoi}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </div>

          {laDangKy && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Xác nhận mật khẩu</label>
              <input
                className="o-nhap w-full"
                name="xacNhanMatKhau"
                type="password"
                value={duLieu.xacNhanMatKhau}
                onChange={xuLyThayDoi}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          )}

          {loi && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-300">
              <p className="font-semibold">{loi}</p>
              {laDangKy && (loi.includes('đăng ký') || loi.includes('đã được sử dụng') || loi.includes('Email này')) && (
                <button
                  type="button"
                  onClick={() => {
                    datLaDangKy(false)
                    datLoi('')
                  }}
                  className="mt-1.5 text-xs text-fuchsia-300 font-semibold underline hover:text-white transition-colors"
                >
                  Chuyển sang Đăng nhập ngay
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={dangXuLy}
            className="nut-chinh mt-4 flex w-full justify-center items-center gap-2 py-3 text-base font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            {laDangKy ? (
              <>
                <UserCheck size={18} />
                {dangXuLy ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </>
            ) : (
              <>
                <LogIn size={18} />
                {dangXuLy ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </>
            )}
          </button>
        </form>

        {!laDangKy && (
          <NutDangNhapGoogle
            onThanhCong={luuPhienDangNhap}
            onLoi={datLoi}
            dangXuLy={dangXuLy}
            datDangXuLy={datDangXuLy}
          />
        )}

        <button
          type="button"
          onClick={() => {
            datLaDangKy((cu) => !cu)
            datLoi('')
          }}
          className="mt-5 w-full text-center text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
        >
          {laDangKy ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
        </button>
      </div>
    </div>
  )
}
