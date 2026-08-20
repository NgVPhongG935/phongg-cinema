import {
  Building2,
  CalendarPlus,
  ChevronRight,
  DoorOpen,
  ExternalLink,
  Film,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Popcorn,
  QrCode,
  Sparkles,
  Theater,
  Ticket,
  UserCog,
  Users,
  CreditCard,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import BackupRestoreModal from '../../components/admin/BackupRestoreModal'
import { useAuth } from '../../context/AuthContext'

const MUC_DON = {
  id: 'tong-quan',
  duongDan: '/admin/dashboard',
  nhan: 'Tổng quan',
  bieuTuong: LayoutDashboard,
}

const DANH_SACH_CUM = [
  {
    id: 'he-thong-rap',
    tieuDe: 'Hệ thống rạp',
    bieuTuong: Building2,
    mucCon: [
      { duongDan: '/admin/cinemas', nhan: 'Danh sách cụm rạp', bieuTuong: Building2 },
      { duongDan: '/admin/rooms', nhan: 'Phòng chiếu & sơ đồ ghế', bieuTuong: DoorOpen },
    ],
  },
  {
    id: 'phim-suat-chieu',
    tieuDe: 'Phim và Suất Chiếu',
    bieuTuong: Film,
    mucCon: [
      { duongDan: '/admin/movies', nhan: 'Quản lý phim', bieuTuong: Film },
      { duongDan: '/admin/persons', nhan: 'Diễn viên & Đạo diễn', bieuTuong: UserCog },
      { duongDan: '/admin/showtimes', nhan: 'Quản lý suất chiếu', bieuTuong: CalendarPlus },
    ],
  },
  {
    id: 'dich-vu-u-dai',
    tieuDe: 'Dịch Vụ và Ưu Đãi',
    bieuTuong: Gift,
    mucCon: [
      { duongDan: '/admin/combos', nhan: 'Quản lý Combo Bắp Nước', bieuTuong: Popcorn },
      { duongDan: '/admin/vouchers', nhan: 'Mã giảm giá / Ưu đãi', bieuTuong: Gift },
    ],
  },
  {
    id: 'quan-ly-ve',
    tieuDe: 'Quản Lý Vé & Soát Vé',
    bieuTuong: Ticket,
    mucCon: [
      { duongDan: '/admin/tickets', nhan: 'Danh sách vé đặt', bieuTuong: Ticket },
      { duongDan: '/admin/scan-qr', nhan: 'Soát vé QR Code', bieuTuong: QrCode },
      { duongDan: '/admin/payments', nhan: 'Cấu hình cổng thanh toán', bieuTuong: CreditCard },
    ],
  },
  {
    id: 'tai-khoan',
    tieuDe: 'Tài Khoản',
    bieuTuong: Users,
    mucCon: [
      { duongDan: '/admin/users', nhan: 'Quản lý người dùng', bieuTuong: Users },
      { duongDan: '/admin/staffs', nhan: 'Tài khoản nhân viên', bieuTuong: UserCog },
    ],
  },
]

const TAT_CA_MUC = [
  MUC_DON,
  ...DANH_SACH_CUM.flatMap((cum) => cum.mucCon),
]

function timCumTheoDuongDan(pathname) {
  return DANH_SACH_CUM.find((cum) =>
    cum.mucCon.some((muc) => pathname === muc.duongDan || pathname.startsWith(`${muc.duongDan}/`)),
  )?.id
}

function layChuCaiAvatar(ten) {
  if (!ten) return 'A'
  const phan = ten.trim().split(/\s+/)
  if (phan.length >= 2) return `${phan[0][0]}${phan[phan.length - 1][0]}`.toUpperCase()
  return ten.slice(0, 2).toUpperCase()
}

function timTieuDeTrang(pathname) {
  const muc = TAT_CA_MUC.find(
    (m) => m.duongDan === pathname || pathname.startsWith(`${m.duongDan}/`),
  )
  return muc?.nhan || 'Admin'
}

function KhungIconNav({ active, children }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
        active
          ? 'bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-900/40'
          : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'
      }`}
    >
      {children}
    </span>
  )
}

function MucMenuDon({ muc, onNavigate }) {
  const BieuTuong = muc.bieuTuong
  return (
    <NavLink
      to={muc.duongDan}
      end
      onClick={onNavigate}
      className={({ isActive }) => `admin-nav-link group ${isActive ? 'admin-nav-link-active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <KhungIconNav active={isActive}>
            <BieuTuong size={17} />
          </KhungIconNav>
          <span className="flex-1 truncate">{muc.nhan}</span>
          {isActive && <Sparkles size={14} className="shrink-0 text-fuchsia-300/80 animate-pulse" />}
        </>
      )}
    </NavLink>
  )
}

function MucMenuCon({ muc, onNavigate }) {
  const BieuTuong = muc.bieuTuong
  return (
    <NavLink
      to={muc.duongDan}
      onClick={onNavigate}
      className={({ isActive }) => `admin-nav-link admin-nav-link-con group ${isActive ? 'admin-nav-link-active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${isActive ? 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]' : 'bg-slate-600 group-hover:bg-slate-400'}`} />
          <BieuTuong size={15} className={`shrink-0 ${isActive ? 'text-fuchsia-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
          <span className="flex-1 truncate">{muc.nhan}</span>
          {isActive && <Sparkles size={11} className="shrink-0 text-fuchsia-300/70" />}
        </>
      )}
    </NavLink>
  )
}

function CumMenuAccordion({ cum, mo, onChuyen, onNavigate }) {
  const location = useLocation()
  const BieuTuongCum = cum.bieuTuong
  const coMucActive = cum.mucCon.some(
    (muc) => location.pathname === muc.duongDan || location.pathname.startsWith(`${muc.duongDan}/`),
  )

  return (
    <div className={`admin-nav-cum rounded-2xl transition-all duration-300 ${coMucActive ? 'admin-nav-cum-active' : ''}`}>
      <button
        type="button"
        onClick={() => onChuyen(cum.id)}
        className={`admin-nav-link group w-full ${coMucActive ? 'text-white' : ''}`}
        aria-expanded={mo}
      >
        <KhungIconNav active={coMucActive}>
          <BieuTuongCum size={17} />
        </KhungIconNav>
        <span className="flex-1 truncate font-medium">{cum.tieuDe}</span>
        <ChevronRight
          size={16}
          className={`shrink-0 text-violet-400/80 transition-transform duration-300 ${mo ? 'rotate-90' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${mo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-60'}`}
      >
        <div className="overflow-hidden">
          <div className="relative space-y-0.5 pb-2 pl-4 before:absolute before:left-[1.35rem] before:top-1 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-fuchsia-500/30 before:via-violet-500/20 before:to-transparent">
            {cum.mucCon.map((muc) => (
              <MucMenuCon key={muc.duongDan} muc={muc} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarNoiDung({ tenHienThi, menuDangMo, chuyenCumMenu, thoatTaiKhoan, onNavigate }) {
  const chuCai = layChuCaiAvatar(tenHienThi)

  return (
    <>
      <div className="admin-sidebar-brand">
        <Link to="/" className="group flex items-center gap-3" onClick={onNavigate}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 opacity-40 blur-md transition group-hover:opacity-60" />
            <div className="relative rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 p-2.5 shadow-xl shadow-fuchsia-900/40">
              <Theater className="text-white" size={22} />
            </div>
          </div>
          <div>
            <p className="text-lg font-black tracking-tight leading-tight">
              Phong<span className="text-fuchsia-300">G</span>
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">Cinema Admin</p>
          </div>
        </Link>
      </div>

      <div className="admin-user-card mt-5">
        <div className="flex items-center gap-3">
          <div className="admin-user-avatar">{chuCai}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{tenHienThi}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Quản trị viên
            </p>
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav mt-6 space-y-1 scrollbar-thin">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Menu</p>
        <MucMenuDon muc={MUC_DON} onNavigate={onNavigate} />
        <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Quản lý</p>
        {DANH_SACH_CUM.map((cum) => (
          <CumMenuAccordion
            key={cum.id}
            cum={cum}
            mo={menuDangMo[cum.id]}
            onChuyen={chuyenCumMenu}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="admin-sidebar-footer mt-auto space-y-2 pt-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="admin-nav-link group text-slate-400"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-500 transition group-hover:bg-white/10 group-hover:text-white">
            <ExternalLink size={16} />
          </span>
          <span>Về trang khách</span>
        </Link>
        <button
          type="button"
          onClick={thoatTaiKhoan}
          className="admin-nav-link group w-full text-slate-400 hover:!border-rose-400/25 hover:!bg-rose-500/10 hover:!text-rose-200"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 transition group-hover:bg-rose-500/20">
            <LogOut size={16} />
          </span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const { nguoiDung, thoatTaiKhoan } = useAuth()
  const location = useLocation()
  const tenHienThi = nguoiDung?.hoTen || localStorage.getItem('hoTen') || 'Admin'
  const tieuDeTrang = useMemo(() => timTieuDeTrang(location.pathname), [location.pathname])

  const [menuDangMo, datMenuDangMo] = useState(() => {
    const cumId = timCumTheoDuongDan(location.pathname)
    return cumId ? { [cumId]: true } : {}
  })
  const [moSidebarMobile, datMoSidebarMobile] = useState(false)

  useEffect(() => {
    const cumId = timCumTheoDuongDan(location.pathname)
    if (cumId) datMenuDangMo((cu) => ({ ...cu, [cumId]: true }))
  }, [location.pathname])

  useEffect(() => {
    datMoSidebarMobile(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = moSidebarMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [moSidebarMobile])

  const chuyenCumMenu = (idCum) => {
    datMenuDangMo((cu) => ({ ...cu, [idCum]: !cu[idCum] }))
  }

  const dongSidebarMobile = () => datMoSidebarMobile(false)

  return (
    <div className="admin-shell min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {moSidebarMobile && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={dongSidebarMobile}
          aria-label="Đóng menu"
        />
      )}

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.06] p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          moSidebarMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fuchsia-500/[0.07] via-transparent to-cyan-500/[0.04]" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-fuchsia-500/20 to-transparent" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <button
            type="button"
            onClick={dongSidebarMobile}
            className="absolute right-0 top-0 rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
          <SidebarNoiDung
            tenHienThi={tenHienThi}
            menuDangMo={menuDangMo}
            chuyenCumMenu={chuyenCumMenu}
            thoatTaiKhoan={thoatTaiKhoan}
            onNavigate={dongSidebarMobile}
          />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        {/* Topbar Header (Responsive Desktop & Mobile) */}
        <header className="admin-topbar sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => datMoSidebarMobile(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">{tieuDeTrang}</p>
              <p className="text-[11px] text-slate-400 hidden sm:block">Hệ thống quản trị rạp chiếu phim PhongG Cinema</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 📥 Sao Lưu & 📤 Phục Hồi Dữ Liệu */}
            <BackupRestoreModal />

            <div className="hidden sm:flex items-center gap-2.5 border-l border-white/10 pl-3">
              <div className="admin-user-avatar !h-9 !w-9 !text-xs">{layChuCaiAvatar(tenHienThi)}</div>
              <div className="hidden xl:block">
                <p className="truncate text-xs font-bold text-white">{tenHienThi}</p>
                <p className="text-[10px] text-emerald-400">Admin Active</p>
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex-1 p-4 md:p-6 lg:p-8 xl:p-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="nen-dong-orb nen-dong-orb-1" />
            <div className="nen-dong-orb nen-dong-orb-2" />
            <div className="nen-dong-orb nen-dong-orb-3" />
            <div className="absolute inset-0 admin-grid-pattern opacity-[0.35]" />
          </div>
          <div className="relative animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
