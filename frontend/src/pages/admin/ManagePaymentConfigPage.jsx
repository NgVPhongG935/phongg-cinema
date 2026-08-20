import { Building2, CreditCard, ImagePlus, Loader2, Save, Smartphone, Trash2, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  layCauHinhThanhToan,
  luuCauHinhThanhToan,
} from '../../services/paymentConfigService'
import { uploadAnh } from '../../services/uploadService'
import { layDanhSachHinhThucThanhToan } from '../../services/paymentMethodService'
import { datCacheHinhThuc } from '../../utils/hinhThucThanhToan'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const DU_LIEU_RONG = {
  soTaiKhoanBank: '',
  tenChuTaiKhoanBank: '',
  qrBankUrl: '',
  batMbBank: true,
  sdtMoMo: '',
  tenChuMoMo: '',
  qrMomoUrl: '',
  batMoMo: true,
  vnpayTmnCode: '',
  vnpayHashSecret: '',
  batVnPay: true,
  batMoMoGateway: true,
}

function CongBatTat({ bat, onChange, nhan }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-slate-300">{nhan}</span>
      <button
        type="button"
        onClick={() => onChange(!bat)}
        className={`relative h-7 w-12 rounded-full transition ${bat ? 'bg-fuchsia-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${bat ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

function ONhap({ label, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-400">{label}</span>
      <input
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-400/30"
        {...props}
      />
    </label>
  )
}

function KhungAnhQr({ tieuDe, urlAnh, goiY, dangLuu, onChonAnh, onXoaAnh }) {
  const fileRef = useRef(null)
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-slate-300">{tieuDe}</p>
      {goiY && <p className="mt-1 text-xs text-slate-500">{goiY}</p>}
      <p className="mt-1 text-xs text-slate-500">Mỗi ô chỉ 1 ảnh — chọn ảnh mới sẽ thay ảnh cũ.</p>
      <div className="mt-3 flex min-h-[120px] items-center justify-center rounded-lg bg-white/5 p-3">
        {urlAnh ? (
          <img src={urlAnh} alt={tieuDe} className="max-h-32 object-contain" />
        ) : (
          <p className="text-sm text-slate-500">Chưa có ảnh QR tùy chỉnh</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={dangLuu}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          <ImagePlus size={16} />
          Chọn ảnh mới
        </button>
        {urlAnh && (
          <button
            type="button"
            disabled={dangLuu}
            onClick={onXoaAnh}
            className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Xóa ảnh QR
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onChonAnh(e)
          e.target.value = ''
        }}
        disabled={dangLuu}
      />
    </div>
  )
}

function mapTuApi(cfg) {
  return {
    soTaiKhoanBank: cfg.soTaiKhoanVietQr || '',
    tenChuTaiKhoanBank: cfg.tenChuVietQr || '',
    qrBankUrl: cfg.qrBankUrl || '',
    batMbBank: cfg.batVietQr ?? true,
    sdtMoMo: cfg.soMoMo || '',
    tenChuMoMo: cfg.tenChuMoMo || '',
    qrMomoUrl: cfg.qrMomoUrl || cfg.anhQrMoMo || '',
    batMoMo: cfg.batMoMo ?? true,
    vnpayTmnCode: cfg.vnpayTmnCode || '',
    vnpayHashSecret: '',
    batVnPay: cfg.batVnPay ?? true,
    batMoMoGateway: cfg.batMoMoGateway ?? true,
  }
}

function mapGuiApi(duLieu) {
  return {
    nganHangVietQr: 'MB Bank',
    soTaiKhoanVietQr: duLieu.soTaiKhoanBank.trim(),
    tenChuVietQr: duLieu.tenChuTaiKhoanBank.trim(),
    batVietQr: duLieu.batMbBank,
    qrBankUrl: duLieu.qrBankUrl || null,
    soMoMo: duLieu.sdtMoMo.trim(),
    tenChuMoMo: duLieu.tenChuMoMo.trim(),
    qrMomoUrl: duLieu.qrMomoUrl || null,
    batMoMo: duLieu.batMoMo,
    vnpayTmnCode: duLieu.vnpayTmnCode?.trim() || null,
    vnpayHashSecret: duLieu.vnpayHashSecret?.trim() || null,
    batVnPay: duLieu.batVnPay,
    batMoMoGateway: duLieu.batMoMoGateway,
  }
}

export default function ManagePaymentConfigPage() {
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)
  const [dangTai, datDangTai] = useState(true)
  const [dangLuu, datDangLuu] = useState(false)
  const [thongBao, datThongBao] = useState('')

  const dongBoCache = async () => {
    const ds = await layDanhSachHinhThucThanhToan()
    datCacheHinhThuc(ds)
  }

  const taiDuLieu = async () => {
    datDangTai(true)
    datThongBao('')
    try {
      const cfg = await layCauHinhThanhToan()
      datDuLieu(mapTuApi(cfg))
      await dongBoCache()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangTai(false)
    }
  }

  useEffect(() => { taiDuLieu() }, [])

  const luuCauHinh = async (suKien) => {
    suKien.preventDefault()
    datDangLuu(true)
    datThongBao('')
    try {
      const ketQua = await luuCauHinhThanhToan(mapGuiApi(duLieu))
      datDuLieu(mapTuApi(ketQua))
      await dongBoCache()
      datThongBao('Đã lưu cấu hình thanh toán.')
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const xuLyUploadQr = async (file, truongUrl, thongBaoOk) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      datThongBao('Vui lòng chọn file ảnh (JPG, PNG, WEBP).')
      return
    }
    datDangLuu(true)
    datThongBao('')
    try {
      const ketQua = await uploadAnh(file)
      const url = ketQua?.url || ''
      if (!url) throw new Error('Backend khong tra ve URL anh')
      datDuLieu((cu) => ({ ...cu, [truongUrl]: url }))
      datThongBao(thongBaoOk)
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datDangLuu(false)
    }
  }

  const xuLyXoaQr = (truongUrl, nhanXacNhan, thongBaoOk) => {
    if (!duLieu[truongUrl]) return
    if (!window.confirm(nhanXacNhan)) return
    datDuLieu((cu) => ({ ...cu, [truongUrl]: '' }))
    datThongBao(thongBaoOk)
  }

  if (dangTai) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Thanh toán</p>
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Cấu Hình Cổng Thanh Toán</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Quản lý đủ 4 hình thức khách thấy khi thanh toán: chuyển khoản MB, ví MoMo thủ công, VNPay và MoMo cổng (sandbox).
        </p>
      </div>

      {thongBao && (
        <p className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100">
          {thongBao}
        </p>
      )}

      <form onSubmit={luuCauHinh} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="the-kinh flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-sky-300">
              <Building2 size={20} />
              <h2 className="font-bold text-white">Chuyển khoản MB Bank (VietQR)</h2>
            </div>
            <ONhap
              label="Số tài khoản"
              value={duLieu.soTaiKhoanBank}
              onChange={(e) => datDuLieu({ ...duLieu, soTaiKhoanBank: e.target.value })}
              placeholder="VD: 0123456789"
            />
            <ONhap
              label="Tên chủ tài khoản"
              value={duLieu.tenChuTaiKhoanBank}
              onChange={(e) => datDuLieu({ ...duLieu, tenChuTaiKhoanBank: e.target.value })}
              placeholder="VD: PHONGG CINEMA"
            />
            <KhungAnhQr
              tieuDe="Ảnh QR MB Bank (VietQR)"
              goiY="Nếu không tải ảnh lên, hệ thống sẽ tự động tạo mã VietQR động theo Số tài khoản và Số tiền."
              urlAnh={duLieu.qrBankUrl}
              dangLuu={dangLuu}
              onChonAnh={(e) => xuLyUploadQr(e.target.files?.[0], 'qrBankUrl', 'Đã tải ảnh lên — bấm «Lưu Cấu Hình» để lưu.')}
              onXoaAnh={() => xuLyXoaQr('qrBankUrl', 'Xóa ảnh QR MB Bank và dùng VietQR động?', 'Đã gỡ ảnh — bấm «Lưu Cấu Hình» để áp dụng.')}
            />
            <CongBatTat
              bat={duLieu.batMbBank}
              onChange={(v) => datDuLieu({ ...duLieu, batMbBank: v })}
              nhan="Bật/Tắt chuyển khoản MB"
            />
          </div>

          <div className="the-kinh flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-pink-300">
              <Smartphone size={20} />
              <h2 className="font-bold text-white">Ví MoMo</h2>
            </div>
            <ONhap
              label="Số điện thoại MoMo"
              value={duLieu.sdtMoMo}
              onChange={(e) => datDuLieu({ ...duLieu, sdtMoMo: e.target.value })}
              placeholder="0901234567"
            />
            <ONhap
              label="Tên chủ tài khoản MoMo"
              value={duLieu.tenChuMoMo}
              onChange={(e) => datDuLieu({ ...duLieu, tenChuMoMo: e.target.value })}
            />
            <KhungAnhQr
              tieuDe="Ảnh QR MoMo"
              urlAnh={duLieu.qrMomoUrl}
              dangLuu={dangLuu}
              onChonAnh={(e) => xuLyUploadQr(e.target.files?.[0], 'qrMomoUrl', 'Đã tải ảnh lên — bấm «Lưu Cấu Hình» để lưu.')}
              onXoaAnh={() => xuLyXoaQr('qrMomoUrl', 'Xóa ảnh QR MoMo và dùng mặc định?', 'Đã gỡ ảnh — bấm «Lưu Cấu Hình» để áp dụng.')}
            />
            <CongBatTat
              bat={duLieu.batMoMo}
              onChange={(v) => datDuLieu({ ...duLieu, batMoMo: v })}
              nhan="Bật/Tắt ví MoMo (nhận tiền thủ công)"
            />
          </div>

          <div className="the-kinh flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-red-300">
              <CreditCard size={20} />
              <h2 className="font-bold text-white">VNPay (cổng online)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Thanh toán qua cổng VNPay sandbox — tự động xác nhận vé sau khi khách thanh toán thành công.
            </p>
            <ONhap
              label="TMN Code (Merchant)"
              value={duLieu.vnpayTmnCode}
              onChange={(e) => datDuLieu({ ...duLieu, vnpayTmnCode: e.target.value })}
              placeholder="Mã merchant VNPay sandbox"
            />
            <ONhap
              label="Hash Secret"
              type="password"
              value={duLieu.vnpayHashSecret}
              onChange={(e) => datDuLieu({ ...duLieu, vnpayHashSecret: e.target.value })}
              placeholder="Để trống nếu không thay đổi"
            />
            <CongBatTat
              bat={duLieu.batVnPay}
              onChange={(v) => datDuLieu({ ...duLieu, batVnPay: v })}
              nhan="Bật/Tắt VNPay"
            />
          </div>

          <div className="the-kinh flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-pink-300">
              <Wallet size={20} />
              <h2 className="font-bold text-white">MoMo (cổng thanh toán)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Thanh toán qua ví MoMo sandbox — tự động xác nhận. Partner Code / Secret cấu hình trong biến môi trường backend.
            </p>
            <CongBatTat
              bat={duLieu.batMoMoGateway}
              onChange={(v) => datDuLieu({ ...duLieu, batMoMoGateway: v })}
              nhan="Bật/Tắt MoMo cổng"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={dangLuu}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-fuchsia-500 px-6 py-3 font-bold text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-50"
          >
            {dangLuu ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu Cấu Hình
          </button>
        </div>
      </form>
    </div>
  )
}
