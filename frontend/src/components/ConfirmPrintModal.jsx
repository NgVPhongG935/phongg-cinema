import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function ConfirmPrintModal({ mo, onXacNhan, onHuy }) {
  useEffect(() => {
    if (!mo) return undefined
    const xuLyEsc = (suKien) => { if (suKien.key === 'Escape') onHuy?.() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', xuLyEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', xuLyEsc)
    }
  }, [mo, onHuy])

  if (!mo) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tieu-de-xac-nhan-in"
      onClick={onHuy}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl animate-fade-in-up"
        onClick={(suKien) => suKien.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle size={36} className="text-orange-500" strokeWidth={2.5} />
          </div>
          <h2 id="tieu-de-xac-nhan-in" className="text-xl font-bold text-slate-900">In Vé</h2>
          <p className="mt-3 text-sm text-slate-600">Bạn có chắc muốn in vé không?</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onHuy}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onXacNhan}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Có, tiếp tục!
          </button>
        </div>
      </div>
    </div>
  )
}
