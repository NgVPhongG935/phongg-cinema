import { CheckCircle2, XCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentResultPage() {
  const [thamSo] = useSearchParams()
  const status = thamSo.get('status')
  const maVe = thamSo.get('maVe')
  const thanhCong = status === 'success'

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {thanhCong ? (
        <CheckCircle2 className="mx-auto text-emerald-400" size={56} />
      ) : (
        <XCircle className="mx-auto text-rose-400" size={56} />
      )}
      <h1 className="mt-4 text-2xl font-black">
        {thanhCong ? 'Thanh toán thành công!' : 'Thanh toán chưa hoàn tất'}
      </h1>
      <p className="mt-2 text-slate-400">
        {thanhCong
          ? 'Vé đã được kích hoạt. Kiểm tra email xác nhận (nếu đã bật) hoặc mở Vé của tôi.'
          : 'Giao dịch thất bại hoặc bị hủy. Bạn có thể thử lại từ trang thanh toán.'}
      </p>
      {maVe && <p className="mt-2 text-sm text-slate-500">Mã vé: #{maVe.slice(-8)}</p>}
      <Link to="/my-tickets" className="nut-chinh mt-8 inline-block">Xem vé của tôi</Link>
      <Link to="/" className="mt-4 block text-sm text-fuchsia-300 hover:underline">Về trang chủ</Link>
    </div>
  )
}
