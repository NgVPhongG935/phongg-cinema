import { Check, Circle } from 'lucide-react'
import { HUONG_DAN_MAT_KHAU, layLoiMatKhauDangKy } from '../utils/matKhauDangKy'

export default function HuongDanMatKhau({ matKhau }) {
  const valid = Boolean(matKhau) && !layLoiMatKhauDangKy(matKhau)
  return (
    <div className={`mt-2 flex items-start gap-2 text-xs leading-5 ${valid ? 'text-emerald-400' : 'text-slate-400'}`}>
      {valid ? <Check size={15} className="mt-0.5 shrink-0" /> : <Circle size={12} className="mt-1 shrink-0" />}
      <p>{valid ? 'Mật khẩu đáp ứng yêu cầu.' : HUONG_DAN_MAT_KHAU}</p>
    </div>
  )
}
