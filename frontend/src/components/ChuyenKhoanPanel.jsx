import { Copy, Check } from 'lucide-react'
import { dinhDangTien } from '../utils/formatters'
import { taoNoiDungChuyenKhoan } from '../utils/hinhThucThanhToan'
import { layUrlQrThanhToan } from '../utils/vietQr'

function NutSaoChep({ noiDung, nhan, daSaoChep, onSaoChep }) {
  const daCopy = daSaoChep === nhan
  return (
    <button
      type="button"
      onClick={() => onSaoChep(noiDung, nhan)}
      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-fuchsia-200 transition hover:bg-white/10"
    >
      {daCopy ? <Check size={14} /> : <Copy size={14} />}
      {daCopy ? 'Đã sao chép' : 'Sao chép'}
    </button>
  )
}

/** Panel 2 cột: QR trái + thông tin CK phải */
export default function ChuyenKhoanPanel({ ve, chiTiet, daSaoChep, onSaoChep }) {
  if (!ve || !chiTiet) return null
  const noiDungCk = ve.noiDungChuyenKhoan || taoNoiDungChuyenKhoan(ve.id)
  const urlQr = layUrlQrThanhToan(chiTiet, ve)
  const laMoMo = chiTiet.ma === 'MOMO' || (chiTiet.soDienThoai && !chiTiet.soTaiKhoan)

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-4">
        {urlQr ? (
          <>
            <img src={urlQr} alt="Mã QR thanh toán" className="w-full max-w-[280px] rounded-xl bg-white p-2 object-contain" />
            <p className="mt-3 text-center text-xs text-slate-400">
              {laMoMo ? 'Quét bằng app MoMo — nội dung CK tự điền khi quét mã' : 'Quét bằng app Ngân hàng — nội dung CK tự điền khi quét mã'}
            </p>
          </>
        ) : (
          <p className="py-12 text-sm text-slate-500">Chưa có mã QR — chuyển khoản thủ công theo thông tin bên phải</p>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div>
          <p className="text-sm text-slate-400">Số tiền cần thanh toán</p>
          <p className="mt-1 text-3xl font-black text-fuchsia-300">{dinhDangTien(ve.tongTien)}</p>
        </div>

        {chiTiet.soTaiKhoan && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">Số tài khoản</p>
              <p className="font-mono text-lg font-bold text-white">{chiTiet.soTaiKhoan}</p>
            </div>
            <NutSaoChep noiDung={chiTiet.soTaiKhoan} nhan="stk" daSaoChep={daSaoChep} onSaoChep={onSaoChep} />
          </div>
        )}

        {chiTiet.soDienThoai && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">Số MoMo</p>
              <p className="font-mono text-lg font-bold text-white">{chiTiet.soDienThoai}</p>
            </div>
            <NutSaoChep noiDung={chiTiet.soDienThoai} nhan="sdt" daSaoChep={daSaoChep} onSaoChep={onSaoChep} />
          </div>
        )}

        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400">Tên chủ tài khoản</p>
          <p className="mt-1 text-base font-bold uppercase tracking-wide text-white">{chiTiet.tenTaiKhoan}</p>
          {chiTiet.chiNhanh && <p className="mt-0.5 text-xs text-slate-500">{chiTiet.chiNhanh}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-xs text-amber-200/80">Nội dung chuyển khoản</p>
            <p className="mt-1 font-mono text-lg font-bold text-amber-100">{noiDungCk}</p>
          </div>
          <NutSaoChep noiDung={noiDungCk} nhan="nd" daSaoChep={daSaoChep} onSaoChep={onSaoChep} />
        </div>
      </div>
    </div>
  )
}
