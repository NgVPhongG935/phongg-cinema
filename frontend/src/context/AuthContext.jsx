import { createContext, useContext, useEffect, useState } from 'react'
import { dangXuat, layThongTinCaNhan } from '../services/authService'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [nguoiDung, datNguoiDung] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const capNhatNguoiDung = (duLieu) => { localStorage.setItem('user', JSON.stringify(duLieu)); datNguoiDung(duLieu) }
  const thoatTaiKhoan = () => { dangXuat(); datNguoiDung(null) }
  useEffect(() => { const xuLyHetHan = () => thoatTaiKhoan(); window.addEventListener('unauthenticated', xuLyHetHan); if (localStorage.getItem('token') && !nguoiDung) layThongTinCaNhan().then(capNhatNguoiDung).catch(thoatTaiKhoan); return () => window.removeEventListener('unauthenticated', xuLyHetHan) }, [])
  return <AuthContext.Provider value={{ nguoiDung, capNhatNguoiDung, thoatTaiKhoan }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
