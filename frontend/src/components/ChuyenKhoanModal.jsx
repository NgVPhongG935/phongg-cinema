import { CheckCircle2, X } from 'lucide-react'
import ChuyenKhoanPanel from './ChuyenKhoanPanel'

/** Modal chuyển khoản — trạng thái chờ CK hoặc chờ Admin duyệt */
export default function ChuyenKhoanModal({
  ve,
  chiTiet,
  daSaoChep,
  onSaoChep,
  dangXuLy,
  thongBao,
  onDaChuyenKhoan,
  onQuayVe,
  onDiDenVe,
}) {
  if (!ve || !chiTiet) return null

  const choXacNhan = ve.trangThai === 'CHO_XAC_NHAN'
  const laLoi = thongBao && (thongBao.includes('Lỗi') || thongBao.includes('Không') || thongBao.includes('API') || thongBao.includes('backend') || thongBao.includes('Hết thời gian') || thongBao.includes('Ghe'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="the-kinh relative w-full max-w-3xl p-6 sm:p-8">
        {choXacNhan ? (
          <>
            <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
              ĐÃ GỬI YÊU CẦU XÁC NHẬN
            </span>
            <h2 className="mt-3 text-xl font-black text-white">Đang chờ Admin duyệt</h2>
            <p className="mt-2 text-sm text-slate-300">
              Cảm ơn bạn! Admin đang kiểm tra giao dịch và sẽ cấp mã QR qua Email.
            </p>
            <p className="mt-1 text-xs text-slate-500">Mã vé #{ve.id?.slice(-8)} · {chiTiet.ten}</p>
            <button
              type="button"
              onClick={onDiDenVe}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-500 py-3.5 font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Đi đến Vé của tôi
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onQuayVe}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Đóng"
            >
              <X size={22} />
            </button>
            <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Thanh toán chuyển khoản</p>
            <h2 className="mt-1 text-xl font-black text-white">Quét mã QR hoặc chuyển khoản thủ công</h2>
            <p className="mt-1 text-sm text-slate-400">Mã vé #{ve.id?.slice(-8)} · {chiTiet.ten}</p>

            <ChuyenKhoanPanel ve={ve} chiTiet={chiTiet} daSaoChep={daSaoChep} onSaoChep={onSaoChep} />

            <p className="mt-4 text-xs text-slate-500">
              Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống xác thực tự động.
            </p>
            {thongBao && (
              <p className={`mt-3 rounded-xl px-4 py-3 text-sm ${laLoi ? 'border border-red-400/30 bg-red-500/10 text-red-200' : 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
                {thongBao}
              </p>
            )}
            <button
              type="button"
              disabled={dangXuLy}
              onClick={onDaChuyenKhoan}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-500 py-3.5 font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 disabled:opacity-50"
            >
              {dangXuLy ? '⏳ Đang ghi nhận...' : 'Tôi đã chuyển khoản'}
            </button>
            <button
              type="button"
              onClick={onQuayVe}
              className="mt-3 w-full text-center text-sm text-slate-400 transition hover:text-slate-200"
            >
              Để sau / Quay về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  )
}
