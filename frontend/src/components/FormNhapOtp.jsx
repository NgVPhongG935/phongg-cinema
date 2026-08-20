import { ArrowLeft, CheckCircle2, Clock, KeyRound, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function FormNhapOtp({
  email,
  onXacThuc,
  onGuiLai,
  onQuayLai,
  dangXuLy = false,
  loi = '',
  thongBao = '',
}) {
  const [mangOtp, datMangOtp] = useState(['', '', '', '', '', ''])
  const [thoiGianHetHan, datThoiGianHetHan] = useState(300) // 5 phút = 300s
  const [demNguocGuiLai, datDemNguocGuiLai] = useState(60) // 60s cooldown gửi lại
  const [dangGuiLai, datDangGuiLai] = useState(false)
  const oNhapRefs = useRef([])

  // Đếm ngược thời gian hết hạn OTP (300s)
  useEffect(() => {
    if (thoiGianHetHan <= 0) return
    const timer = setInterval(() => {
      datThoiGianHetHan((cu) => (cu > 0 ? cu - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [thoiGianHetHan])

  // Đếm ngược thời gian chờ gửi lại (60s)
  useEffect(() => {
    if (demNguocGuiLai <= 0) return
    const timer = setInterval(() => {
      datDemNguocGuiLai((cu) => (cu > 0 ? cu - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [demNguocGuiLai])

  // Tự động focus ô đầu tiên
  useEffect(() => {
    if (oNhapRefs.current[0]) {
      oNhapRefs.current[0].focus()
    }
  }, [])

  const dinhDangThoiGian = (giay) => {
    const m = Math.floor(giay / 60)
    const s = giay % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const xuLyThayDoi = (chiSo, giaTri) => {
    // Chỉ chấp nhận ký tự số
    const kyTuSo = giaTri.replace(/\D/g, '')
    const mangMoi = [...mangOtp]
    mangMoi[chiSo] = kyTuSo.slice(-1)
    datMangOtp(mangMoi)

    // Nếu đã nhập số và chưa phải ô cuối cùng thì chuyển sang ô kế tiếp
    if (kyTuSo && chiSo < 5 && oNhapRefs.current[chiSo + 1]) {
      oNhapRefs.current[chiSo + 1].focus()
    }

    // Tự động submit khi đã nhập đủ 6 số
    const otpDayDu = mangMoi.join('')
    if (otpDayDu.length === 6 && !mangMoi.includes('')) {
      onXacThuc(otpDayDu)
    }
  }

  const xuLyKeyDown = (chiSo, suKien) => {
    if (suKien.key === 'Backspace' && !mangOtp[chiSo] && chiSo > 0) {
      // Khi xóa ở ô trống, lùi về ô trước
      oNhapRefs.current[chiSo - 1]?.focus()
    }
  }

  const xuLyDanOtp = (suKien) => {
    suKien.preventDefault()
    const duLieuDan = suKien.clipboardData.getData('text').trim().replace(/\D/g, '')
    if (!duLieuDan) return

    const mangMoi = ['', '', '', '', '', '']
    for (let i = 0; i < Math.min(duLieuDan.length, 6); i++) {
      mangMoi[i] = duLieuDan[i]
    }
    datMangOtp(mangMoi)

    const viTriFocus = Math.min(duLieuDan.length, 5)
    oNhapRefs.current[viTriFocus]?.focus()

    const otpDayDu = mangMoi.join('')
    if (otpDayDu.length === 6 && !mangMoi.includes('')) {
      onXacThuc(otpDayDu)
    }
  }

  const xuLySubmit = (suKien) => {
    suKien.preventDefault()
    const otpDayDu = mangOtp.join('')
    if (otpDayDu.length < 6) return
    onXacThuc(otpDayDu)
  }

  const xuLyGuiLaiMa = async () => {
    if (demNguocGuiLai > 0 || dangGuiLai) return
    datDangGuiLai(true)
    try {
      await onGuiLai()
      datThoiGianHetHan(300)
      datDemNguocGuiLai(60)
      datMangOtp(['', '', '', '', '', ''])
      oNhapRefs.current[0]?.focus()
    } finally {
      datDangGuiLai(false)
    }
  }

  const otpHoanTat = mangOtp.join('').length === 6

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30">
          <KeyRound size={28} />
        </div>
        <h3 className="text-xl font-black text-white">Xác Thực Tài Khoản</h3>
        <p className="mt-1 text-sm text-slate-300">
          Mã OTP 6 số đã được gửi đến email: <strong className="text-fuchsia-400 break-all">{email}</strong>. Mã có hiệu lực trong 5 phút.
        </p>
      </div>

      {thongBao && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-300">
          {thongBao}
        </div>
      )}

      {loi && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-sm text-rose-300">
          {loi}
        </div>
      )}

      <form onSubmit={xuLySubmit} className="space-y-5">
        {/* 6 Ô nhập OTP */}
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={xuLyDanOtp}>
          {mangOtp.map((giaTri, index) => (
            <input
              key={index}
              ref={(el) => (oNhapRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={giaTri}
              onChange={(e) => xuLyThayDoi(index, e.target.value)}
              onKeyDown={(e) => xuLyKeyDown(index, e)}
              disabled={dangXuLy || thoiGianHetHan <= 0}
              className={`h-12 w-11 rounded-xl border text-center text-2xl font-black transition-all sm:h-14 sm:w-13 ${
                giaTri
                  ? 'border-fuchsia-500 bg-purple-950/40 text-white shadow-md shadow-fuchsia-500/20 ring-2 ring-fuchsia-500/30'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 focus:border-purple-500 focus:bg-purple-950/20 focus:ring-2 focus:ring-purple-500/30'
              }`}
            />
          ))}
        </div>

        {/* Đồng hồ đếm ngược hiệu lực */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={thoiGianHetHan <= 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} />
            <span>
              Mã hết hạn sau:{' '}
              <strong className={thoiGianHetHan <= 60 ? 'text-rose-400' : 'text-amber-400'}>
                {dinhDangThoiGian(thoiGianHetHan)}
              </strong>
            </span>
          </div>

          {/* Nút gửi lại mã */}
          <button
            type="button"
            onClick={xuLyGuiLaiMa}
            disabled={demNguocGuiLai > 0 || dangGuiLai || dangXuLy}
            className={`flex items-center gap-1 font-medium transition-colors ${
              demNguocGuiLai > 0 || dangGuiLai
                ? 'cursor-not-allowed text-slate-500'
                : 'text-fuchsia-400 hover:text-fuchsia-300 hover:underline'
            }`}
          >
            <RotateCw size={13} className={dangGuiLai ? 'animate-spin' : ''} />
            {demNguocGuiLai > 0 ? `Gửi lại sau (${demNguocGuiLai}s)` : 'Gửi lại mã OTP'}
          </button>
        </div>

        {/* Nút xác nhận */}
        <button
          type="submit"
          disabled={!otpHoanTat || dangXuLy || thoiGianHetHan <= 0}
          className="nut-chinh flex w-full items-center justify-center gap-2 py-3 text-base font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
        >
          {dangXuLy ? (
            <>
              <RotateCw size={18} className="animate-spin" />
              Đang xác thực...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Xác Nhận Đăng Ký
            </>
          )}
        </button>
      </form>

      {/* Nút quay lại sửa thông tin */}
      <button
        type="button"
        onClick={onQuayLai}
        disabled={dangXuLy}
        className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} />
        Quay lại thay đổi thông tin đăng ký
      </button>
    </div>
  )
}
