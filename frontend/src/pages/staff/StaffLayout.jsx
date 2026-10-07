import { Film, LayoutDashboard, ScanLine, History, UserRound, LogOut, ArrowUpRight } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menu = [
  { to: '/staff', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/staff/scan-qr', label: 'Soát vé QR', icon: ScanLine },
  { to: '/staff/scan-qr?tab=lich-su', label: 'Lịch sử soát vé', icon: History },
  { to: '/staff/profile', label: 'Tài khoản', icon: UserRound },
]

export default function StaffLayout() {
  const { nguoiDung, thoatTaiKhoan } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const role = nguoiDung?.role || nguoiDung?.vaiTro
  if (!nguoiDung) {
    if (localStorage.getItem('token')) return <p role="status" className="p-10 text-center">Đang tải tài khoản…</p>
    return <Navigate to="/login" replace />
  }
  if (!['STAFF', 'ADMIN'].includes(role)) return <Navigate to="/" replace />

  const name = nguoiDung.hoTen || 'Nhân viên'
  const history = new URLSearchParams(location.search).get('tab') === 'lich-su'
  const active = (to) => to.includes('?')
    ? location.pathname === '/staff/scan-qr' && history
    : location.pathname === to && (to !== '/staff/scan-qr' || !history)

  return (
    <div className="min-h-screen bg-[#090b13] text-slate-100 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-white/[0.07] bg-[#10121e] p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:p-6">
        <Link to="/staff" className="flex items-center gap-3 font-black">
          <span className="rounded-xl bg-violet-500 p-2.5 shadow-lg shadow-violet-500/20"><Film size={23} /></span>
          <span>PhongG Cinema<span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Không gian nhân viên</span></span>
        </Link>
        <p className="mb-3 mt-10 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 lg:block">Công việc của bạn</p>
        <nav aria-label="Điều hướng nhân viên" className="mt-4 grid grid-cols-2 gap-2 lg:mt-0 lg:grid-cols-1">
          {menu.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} aria-current={active(to) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active(to) ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 hidden rounded-2xl border border-white/5 bg-white/[0.025] p-4 lg:block">
          <ScanLine size={23} className="mb-3 text-violet-400" />
          <p className="text-sm font-semibold">Sẵn sàng đón khách</p>
          <p className="mt-2 text-xs leading-6 text-slate-500">Quét vé, kiểm tra thông tin và xác nhận trước khi khách vào phòng chiếu.</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-4 lg:mt-auto">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white">Trang đặt vé <ArrowUpRight size={14} /></Link>
          <button type="button" onClick={() => { thoatTaiKhoan(); navigate('/login', { replace: true }) }} className="flex items-center gap-2 rounded-lg p-2 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><LogOut size={16} />Đăng xuất</button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8">
          <div><p className="text-sm font-semibold">Cổng nhân viên</p><p className="mt-1 text-xs text-slate-500">PhongG Cinema · Vận hành rạp</p></div>
          <Link to="/staff/profile" className="flex min-w-0 items-center gap-3 rounded-xl p-1 hover:bg-white/5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 font-bold text-violet-300">{name.charAt(0).toUpperCase()}</span>
            <span className="hidden min-w-0 sm:block"><span className="block max-w-48 truncate text-sm font-semibold">{name}</span><span className="text-xs text-slate-500">{role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</span></span>
          </Link>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8 lg:p-10"><Outlet /></main>
      </div>
    </div>
  )
}
