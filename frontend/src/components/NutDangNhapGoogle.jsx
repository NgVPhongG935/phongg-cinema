import { GoogleLogin } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { dangNhapGoogle } from '../services/authService'
import { layThongBaoLoiAuth } from '../utils/layThongBaoLoiApi'
import { laDomainNgrok, layThongBaoLoiGoogle } from '../utils/layThongBaoLoiGoogle'

export default function NutDangNhapGoogle({ onThanhCong, onLoi, dangXuLy, datDangXuLy }) {
  const [dangTaiGoogle, datDangTaiGoogle] = useState(false)
  const khoaXuLy = useRef(false)
  const dangKhoa = dangTaiGoogle || dangXuLy

  const baoLoi = useCallback((thongDiep) => {
    onLoi?.(thongDiep)
  }, [onLoi])

  const xuLyThanhCong = useCallback(async (phanHoi) => {
    if (khoaXuLy.current || dangTaiGoogle) return

    const token = phanHoi?.credential
    if (!token) {
      baoLoi('Không lấy được thông tin từ Google. Vui lòng thử lại.')
      return
    }

    khoaXuLy.current = true
    datDangTaiGoogle(true)
    datDangXuLy?.(true)

    try {
      const ketQua = await dangNhapGoogle(token)
      onThanhCong?.(ketQua)
    } catch (loiPhanHoi) {
      baoLoi(layThongBaoLoiAuth(loiPhanHoi, layThongBaoLoiGoogle(loiPhanHoi)))
    } finally {
      khoaXuLy.current = false
      datDangTaiGoogle(false)
      datDangXuLy?.(false)
    }
  }, [baoLoi, dangTaiGoogle, datDangXuLy, onThanhCong])

  const xuLyLoiGoogle = useCallback(() => {
    if (khoaXuLy.current) return

    const thongDiep = laDomainNgrok()
      ? layThongBaoLoiGoogle('origin is not allowed')
      : layThongBaoLoiGoogle('popup_closed')

    baoLoi(thongDiep)
    khoaXuLy.current = false
    datDangTaiGoogle(false)
    datDangXuLy?.(false)
  }, [baoLoi, datDangXuLy])

  return (
    <div className="mt-4">
      <div className="relative my-4 flex items-center">
        <div className="flex-grow border-t border-white/10" />
        <span className="mx-3 text-xs text-slate-500">hoặc</span>
        <div className="flex-grow border-t border-white/10" />
      </div>

      <div className="relative">
        {dangKhoa && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-[1px]"
            aria-hidden="true"
          >
            <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
          </div>
        )}

        <div
          className={`flex justify-center transition-opacity [&>div]:w-full [&_iframe]:!w-full ${dangKhoa ? 'pointer-events-none opacity-50' : ''}`}
          aria-busy={dangKhoa}
        >
          <GoogleLogin
            onSuccess={xuLyThanhCong}
            onError={xuLyLoiGoogle}
            theme="filled_black"
            size="large"
            text="signin_with"
            locale="vi"
            width="100%"
          />
        </div>
      </div>

      {laDomainNgrok() && !dangKhoa && (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
          Đang dùng Ngrok? Thêm <span className="text-slate-400">{window.location.origin}</span> vào Authorized JavaScript origins trên Google Cloud Console.
        </p>
      )}
    </div>
  )
}
