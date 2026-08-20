import { Bot, ChevronDown, Film, QrCode, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { dangXuat } from '../services/authService'
import TimKiemPhim from './TimKiemPhim'

export default function Navbar() {
  const [moMenu, datMoMenu] = useState(false)
  const [daCuon, datDaCuon] = useState(false)
  const { nguoiDung } = useAuth()
  const khuVucMenu = useRef(null)

  const vaiTro = nguoiDung?.role || nguoiDung?.vaiTro || localStorage.getItem('role')
  const hoTen = nguoiDung?.hoTen || localStorage.getItem('hoTen')
  const laAdmin = vaiTro === 'ADMIN'
  const laStaff = vaiTro === 'STAFF'

  useEffect(() => {
    const dongMenu = (suKien) => { if (khuVucMenu.current && !khuVucMenu.current.contains(suKien.target)) datMoMenu(false) }
    document.addEventListener('mousedown', dongMenu)
    return () => document.removeEventListener('mousedown', dongMenu)
  }, [])

  useEffect(() => {
    const xuLyCuon = () => datDaCuon(window.scrollY > 8)
    xuLyCuon()
    window.addEventListener('scroll', xuLyCuon, { passive: true })
    return () => window.removeEventListener('scroll', xuLyCuon)
  }, [])

  const xuLyDangXuat = () => {
    dangXuat()
    datMoMenu(false)
    window.location.href = '/'
  }

  const chuCaiAvatar = hoTen?.trim()?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${daCuon ? 'border-white/15 bg-cinema-950/95 shadow-lg shadow-black/30 backdrop-blur-xl' : 'border-white/10 bg-cinema-950/80 backdrop-blur-md'}`}>
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-black">
          <span className="rounded-lg bg-cinema-500 p-2"><Film size={20} /></span>
          PhongG <span className="text-cinema-500">Cinema</span>
        </Link>

        <TimKiemPhim className="flex-1" />

        <div className="flex items-center gap-2">
          {nguoiDung ? (
            <>
              {laStaff && (
                <Link to="/staff/scan-qr" className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 px-3 py-2 text-sm font-bold shadow-lg shadow-violet-900/40 transition hover:brightness-110 sm:flex">
                  <QrCode size={16} />📱 Soát Vé QR
                </Link>
              )}
              {laAdmin && (
                <Link to="/admin" className="nut-neon-cyber hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 px-3 py-2 text-sm font-bold shadow-lg shadow-fuchsia-900/40 transition hover:brightness-110 sm:flex">
                  <Shield size={16} />Quản Trị Admin
                </Link>
              )}

              <div className="relative" ref={khuVucMenu}>
                <button onClick={() => datMoMenu((cu) => !cu)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 transition hover:bg-white/10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cinema-500 text-sm font-bold">{chuCaiAvatar}</span>
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold md:block">{hoTen}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition ${moMenu ? 'rotate-180' : ''}`} />
                </button>

                {moMenu && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-cinema-900 shadow-2xl">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="truncate font-semibold">{hoTen}</p>
                      <p className="truncate text-xs text-slate-400">{nguoiDung.email}</p>
                    </div>
                    <Link to="/my-tickets" onClick={() => datMoMenu(false)} className="block px-4 py-3 text-sm hover:bg-white/5">Vé của tôi</Link>
                    <Link to="/profile" onClick={() => datMoMenu(false)} className="block px-4 py-3 text-sm hover:bg-white/5">Thông tin tài khoản</Link>
                    {(laStaff || laAdmin) && (
                      <Link to="/staff/scan-qr" onClick={() => datMoMenu(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/10">
                        <QrCode size={16} />Cổng nhân viên soát vé
                      </Link>
                    )}
                    {laAdmin && (
                      <Link to="/admin" onClick={() => datMoMenu(false)} className="block px-4 py-3 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-500/10">Quản trị hệ thống</Link>
                    )}
                    <button onClick={xuLyDangXuat} className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-500/10">Đăng xuất</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={() => window.dispatchEvent(new Event('open-auth-modal'))} className="nut-chinh text-sm">Đăng nhập</button>
          )}

          <button onClick={() => window.dispatchEvent(new Event('open-ai-chat'))} className="rounded-xl bg-fuchsia-500/20 p-2 text-fuchsia-300 hover:bg-fuchsia-500/30">
            <Bot size={20} />
          </button>
        </div>
      </nav>
    </header>
  )
}
