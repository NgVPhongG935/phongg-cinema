/** Toast thông báo toàn hệ thống — z-index 99999 nổi trên mọi layer */
export function hienThongBao(thongDiep, { loai = 'error', thoiGian = 4500 } = {}) {
  if (!thongDiep) return

  const mau = loai === 'success'
    ? 'border-emerald-400/50 bg-emerald-950/95 text-emerald-100 shadow-emerald-950/60 ring-1 ring-emerald-400/30'
    : 'border-rose-400/50 bg-rose-950/95 text-rose-100 shadow-rose-950/60 ring-1 ring-rose-400/30'

  const el = document.createElement('div')
  el.setAttribute('role', 'alert')
  el.style.zIndex = '99999'
  el.style.top = '24px'
  el.style.right = '24px'
  el.className = `fixed z-[99999] max-w-md rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-2xl backdrop-blur-xl transition-all animate-fade-in-down ${mau}`
  el.textContent = thongDiep
  document.body.appendChild(el)

  const timer = setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(-10px)'
    setTimeout(() => el.remove(), 300)
  }, thoiGian)

  el.addEventListener('click', () => {
    clearTimeout(timer)
    el.remove()
  })
}

export const hienThongBaoLoi = (msg) => hienThongBao(msg, { loai: 'error' })
export const hienThongBaoThanhCong = (msg) => hienThongBao(msg, { loai: 'success' })

export const toast = {
  success: (msg) => hienThongBao(msg, { loai: 'success' }),
  error: (msg) => hienThongBao(msg, { loai: 'error' }),
  info: (msg) => hienThongBao(msg, { loai: 'success' }),
}

