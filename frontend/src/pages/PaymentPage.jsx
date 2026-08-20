import { ArrowLeft, Clock3, CreditCard, Gift, Loader2, Sparkles, Tag, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ChuyenKhoanModal from '../components/ChuyenKhoanModal'
import { useAuth } from '../context/AuthContext'
import { giuGheTamThoi } from '../services/showtimeService'
import { taoVeMoi, taoVaGuiYeuCauCk, huyVeTam } from '../services/ticketService'
import { taoLienKetMomo, taoLienKetVnpay } from '../services/paymentService'
import { apDungMaGiamGia } from '../services/voucherService'
import { taoDanhSachComboDat } from '../utils/comboFood'
import { dinhDangTien } from '../utils/formatters'
import {
  layDanhSachHinhThuc, layHinhThucTheoMa, tenHinhThucThanhToan, datCacheHinhThuc, chuyenMaGuiApi,
  laChuyenKhoanThuCong, taoMaThamChieuTam, taoNoiDungChuyenKhoan,
} from '../utils/hinhThucThanhToan'
import { layDanhSachHinhThucThanhToan } from '../services/paymentMethodService'
import { layThongBaoLoiApi } from '../utils/layThongBaoLoiApi'
import { hienThongBaoLoi } from '../utils/hienThongBao'
import { kiemTraTaoVe, LoiDuLieuDatVe } from '../utils/kiemTraDuLieuDatVe'

export default function PaymentPage() {
  const { id } = useParams()
  const dieuHuong = useNavigate()
  const viTri = useLocation()
  const { nguoiDung } = useAuth()
  const [hinhThucChon, datHinhThucChon] = useState(null)
  const [veDaTao, datVeDaTao] = useState(null)
  const [giayConLai, datGiayConLai] = useState(viTri.state?.giayConLai || 0)
  const [dangXuLy, datDangXuLy] = useState(false)
  const [dangGiaHanGhe, datDangGiaHanGhe] = useState(false)
  const [thongBaoLoi, datThongBaoLoi] = useState('')
  const [daSaoChep, datDaSaoChep] = useState('')
  const [maGiamGiaNhap, datMaGiamGiaNhap] = useState('')
  const [voucherApDung, datVoucherApDung] = useState(null)
  const [dangApMa, datDangApMa] = useState(false)
  const [loiVoucher, datLoiVoucher] = useState('')
  const [danhSachHt, datDanhSachHt] = useState(() => layDanhSachHinhThuc())
  const [hienModalCk, datHienModalCk] = useState(false)
  const [maThamChieu, datMaThamChieu] = useState('')
  const [donHangXem, datDonHangXem] = useState(null)
  const [thongBaoModal, datThongBaoModal] = useState('')
  const dangDatVeRef = useRef(false)
  const daGiuGheLanDau = useRef(false)
  const dangGiaHanRef = useRef(false)
  const [dangKhoiTaoGhe, datDangKhoiTaoGhe] = useState(true)

  useEffect(() => {
    layDanhSachHinhThucThanhToan()
      .then((ds) => {
        datCacheHinhThuc(ds)
        datDanhSachHt(ds)
      })
      .catch(() => {})
  }, [])

  const gheChon = viTri.state?.gheChon || []
  const tienGhe = viTri.state?.tienGhe || 0
  const tienBapNuoc = viTri.state?.tienBapNuoc || 0
  const soLuongCombo = viTri.state?.soLuongCombo || {}
  const phim = viTri.state?.phim
  const tongGoc = tienGhe + tienBapNuoc
  const soTienGiam = voucherApDung?.soTienGiam || 0
  const tongTien = Math.max(0, tongGoc - soTienGiam)

  const giaHanGiuGhe = useCallback(async () => {
    if (!nguoiDung?.id || !gheChon.length || dangGiaHanRef.current) return false
    dangGiaHanRef.current = true
    datDangGiaHanGhe(true)
    try {
      const phanHoi = await giuGheTamThoi(id, gheChon, nguoiDung.id)
      const giay = Math.max(0, Math.floor((new Date(phanHoi.thoiGianHetHan) - new Date()) / 1000))
      datGiayConLai(giay)
      return giay > 0
    } catch (loi) {
      const msg = loi instanceof LoiDuLieuDatVe ? loi.message : layThongBaoLoiApi(loi)
      datThongBaoLoi(msg)
      hienThongBaoLoi(msg)
      return false
    } finally {
      dangGiaHanRef.current = false
      datDangGiaHanGhe(false)
    }
  }, [nguoiDung?.id, gheChon, id])

  useEffect(() => {
    if (!nguoiDung) window.dispatchEvent(new Event('open-auth-modal'))
    if (!gheChon.length) dieuHuong(`/booking/${id}`, { replace: true, state: { phim } })
  }, [nguoiDung, gheChon.length, id, dieuHuong, phim])

  useEffect(() => {
    let huy = false
    const khoiTao = async () => {
      if (!nguoiDung?.id || !gheChon.length) {
        datDangKhoiTaoGhe(false)
        return
      }
      await giaHanGiuGhe()
      if (!huy) {
        daGiuGheLanDau.current = true
        datDangKhoiTaoGhe(false)
      }
    }
    khoiTao()
    return () => { huy = true }
  }, [nguoiDung?.id, gheChon.length, giaHanGiuGhe])

  useEffect(() => {
    if (!giayConLai) return undefined
    const boDem = setInterval(() => datGiayConLai((cu) => Math.max(0, cu - 1)), 1000)
    return () => clearInterval(boDem)
  }, [giayConLai])

  useEffect(() => {
    if (!daGiuGheLanDau.current || dangKhoiTaoGhe) return
    if (giayConLai === 0 && gheChon.length && !dangGiaHanGhe && !veDaTao && !hienModalCk) {
      const msg = 'Hết thời gian giữ ghế. Vui lòng chọn lại.'
      datThongBaoLoi(msg)
      hienThongBaoLoi(msg)
      dieuHuong(`/booking/${id}`, { replace: true, state: { phim } })
    }
  }, [giayConLai, gheChon.length, dieuHuong, id, phim, dangGiaHanGhe, veDaTao, hienModalCk, dangKhoiTaoGhe])

  const demNguocThoiGian = `${String(Math.floor(giayConLai / 60)).padStart(2, '0')}:${String(giayConLai % 60).padStart(2, '0')}`
  const thongTinHinhThuc = useMemo(() => layHinhThucTheoMa(hinhThucChon), [hinhThucChon])

  const apMaGiamGia = async () => {
    const ma = maGiamGiaNhap.trim()
    if (!ma) return
    datDangApMa(true)
    datLoiVoucher('')
    try {
      const ketQua = await apDungMaGiamGia(ma, tongGoc)
      datVoucherApDung(ketQua)
      datMaGiamGiaNhap('')
    } catch (loi) {
      datVoucherApDung(null)
      datLoiVoucher(layThongBaoLoiApi(loi))
    } finally {
      datDangApMa(false)
    }
  }

  const goBoMaGiamGia = () => {
    datVoucherApDung(null)
    datMaGiamGiaNhap('')
    datLoiVoucher('')
  }

  const taoPayloadVe = (noiDungCk) => {
    const kt = kiemTraTaoVe({
      maSuatChieu: id,
      danhSachGhe: gheChon,
      maNguoiDung: nguoiDung?.id,
      tongTien,
      tienGhe,
      tienBapNuoc,
      danhSachCombo: taoDanhSachComboDat(soLuongCombo),
      hinhThucThanhToan: chuyenMaGuiApi(hinhThucChon),
      kenhDatVe: 'WEB',
      ...(voucherApDung?.maCode ? { maCodeGiamGia: voucherApDung.maCode } : {}),
      ...(noiDungCk ? { noiDungChuyenKhoan: noiDungCk } : {}),
    })
    if (!kt.hopLe) throw new LoiDuLieuDatVe(kt.thongDiep)
    return kt.duLieu
  }

  const xuLyLoiThanhToan = (loi) => {
    const msg = loi instanceof LoiDuLieuDatVe ? loi.message : layThongBaoLoiApi(loi)
    datThongBaoLoi(msg)
    hienThongBaoLoi(msg)
  }

  const moModalChuyenKhoan = async () => {
    const maTam = taoMaThamChieuTam()
    const noiDungCk = taoNoiDungChuyenKhoan(maTam)
    datMaThamChieu(maTam)
    datDonHangXem({
      id: maTam,
      tongTien,
      trangThai: null,
      hinhThucThanhToan: chuyenMaGuiApi(hinhThucChon),
      noiDungChuyenKhoan: noiDungCk,
    })
    datHienModalCk(true)
    await giaHanGiuGhe()
  }

  const xacNhanDatVe = async () => {
    if (!nguoiDung || !hinhThucChon || dangDatVeRef.current || dangKhoiTaoGhe) return
    if (!giayConLai) {
      const msg = 'Ghế chưa được giữ hoặc đã hết hạn. Vui lòng quay lại chọn ghế.'
      datThongBaoLoi(msg)
      hienThongBaoLoi(msg)
      return
    }
    dangDatVeRef.current = true
    datDangXuLy(true)
    datThongBaoLoi('')
    try {
      if (hinhThucChon === 'VNPAY') {
        const ve = await taoVeMoi(taoPayloadVe())
        const phanHoi = await taoLienKetVnpay(ve?.id)
        window.location.href = phanHoi.paymentUrl
        return
      }
      if (hinhThucChon === 'MOMO_GATEWAY') {
        const ve = await taoVeMoi(taoPayloadVe())
        const phanHoi = await taoLienKetMomo(ve?.id)
        window.location.href = phanHoi.paymentUrl
        return
      }
      if (laChuyenKhoanThuCong(hinhThucChon)) {
        await moModalChuyenKhoan()
        return
      }
      const ve = await taoVeMoi(taoPayloadVe())
      datVeDaTao(ve)
      datHienModalCk(true)
    } catch (loi) {
      xuLyLoiThanhToan(loi)
    } finally {
      datDangXuLy(false)
      dangDatVeRef.current = false
    }
  }

  const dongModalCk = async () => {
    datHienModalCk(false)
    datDonHangXem(null)
    datMaThamChieu('')
    datThongBaoModal('')
    if (veDaTao?.trangThai === 'PENDING' && nguoiDung?.id) {
      try {
        await huyVeTam(veDaTao.id, nguoiDung.id)
      } catch { /* bo qua */ }
      datVeDaTao(null)
    }
  }

  const xuLyDaChuyenKhoan = async () => {
    if (dangXuLy) return
    datDangXuLy(true)
    datThongBaoLoi('')
    datThongBaoModal('')
    try {
      const noiDungCk = donHangXem?.noiDungChuyenKhoan || taoNoiDungChuyenKhoan(maThamChieu)
      const veCapNhat = await taoVaGuiYeuCauCk(taoPayloadVe(noiDungCk))
      
      // Đóng modal và chuyển hướng ngay sang màn hình Vé Chờ Duyệt
      datHienModalCk(false)
      datVeDaTao(veCapNhat)
      dieuHuong(`/booking/success/${veCapNhat?.id || ''}`, {
        replace: true,
        state: { ve: veCapNhat },
      })
    } catch (loi) {
      xuLyLoiThanhToan(loi)
      datThongBaoModal(loi instanceof LoiDuLieuDatVe ? loi.message : layThongBaoLoiApi(loi))
    } finally {
      datDangXuLy(false)
    }
  }

  const xuLyQuayVe = async () => {
    await dongModalCk()
    dieuHuong('/')
  }

  const xuLyDiDenVe = () => {
    datHienModalCk(false)
    dieuHuong('/my-tickets', { state: { ve: veDaTao } })
  }

  const saoChep = async (noiDung, nhan) => {
    try {
      await navigator.clipboard.writeText(noiDung)
      datDaSaoChep(nhan)
      setTimeout(() => datDaSaoChep(''), 2000)
    } catch { /* bo qua */ }
  }

  const veHienThi = veDaTao || donHangXem
  const chiTietCk = veHienThi ? layHinhThucTheoMa(veHienThi.hinhThucThanhToan || hinThucChon) : null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      {(hienModalCk || veDaTao?.trangThai === 'CHO_XAC_NHAN') && veHienThi && chiTietCk && (
        <ChuyenKhoanModal
          ve={veHienThi}
          chiTiet={chiTietCk}
          daSaoChep={daSaoChep}
          onSaoChep={saoChep}
          dangXuLy={dangXuLy}
          thongBao={thongBaoModal}
          onDaChuyenKhoan={xuLyDaChuyenKhoan}
          onQuayVe={xuLyQuayVe}
          onDiDenVe={xuLyDiDenVe}
        />
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/booking/${id}/combo`} state={{ phim, gheChon, tienGhe, giayConLai, soLuongCombo: viTri.state?.soLuongCombo }} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Quay lại bắp nước
          </Link>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Bước 3 · Thanh toán</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">Chọn hình thức thanh toán</h1>
          <p className="mt-1 text-slate-400">{phim?.title || 'Suất chiếu'} · Ghế {gheChon.join(', ')}</p>
        </div>
        {giayConLai > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-amber-200">
            {dangGiaHanGhe ? <Loader2 size={18} className="animate-spin" /> : <Clock3 size={18} />}
            <span className="text-sm">Giữ ghế: <b className="font-mono text-base">{demNguocThoiGian}</b></span>
          </div>
        )}
      </div>

      {thongBaoLoi && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{thongBaoLoi}</p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {danhSachHt.map((hinhThuc) => (
            <button
              key={hinhThuc.ma}
              type="button"
              onClick={() => datHinhThucChon(hinhThuc.ma)}
              className={`the-kinh w-full p-5 text-left transition ${hinhThucChon === hinhThuc.ma ? 'border-fuchsia-400/50 ring-2 ring-fuchsia-400/30' : 'hover:border-white/20'}`}
            >
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${hinhThuc.mau} px-3 py-1 text-xs font-bold uppercase tracking-wide text-white`}>
                {hinhThuc.ma === 'MOMO' ? 'MoMo' : hinhThuc.ma === 'VNPAY' || hinhThuc.ma === 'MOMO_GATEWAY' ? 'Online' : 'Chuyển khoản'}
              </div>
              <h2 className="mt-3 text-lg font-bold">{hinhThuc.ten}</h2>
              <p className="mt-1 text-sm text-slate-400">{hinhThuc.moTa}</p>
              {hinhThuc.soTaiKhoan && (
                <p className="mt-2 text-sm text-slate-300">STK: <b>{hinhThuc.soTaiKhoan}</b> · {hinhThuc.tenTaiKhoan}</p>
              )}
              {!hinhThuc.soTaiKhoan && hinhThuc.soDienThoai && (
                <p className="mt-2 text-sm text-slate-300">MoMo: <b>{hinhThuc.soDienThoai}</b> · {hinhThuc.tenTaiKhoan}</p>
              )}
              {!hinhThuc.soTaiKhoan && !hinhThuc.soDienThoai && (
                <p className="mt-2 text-sm text-slate-300">{hinhThuc.tenTaiKhoan} · {hinhThuc.chiNhanh}</p>
              )}
            </button>
          ))}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="the-kinh overflow-hidden p-0">
            <div className="border-b border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-violet-600/10 to-transparent px-5 py-4">
              <div className="flex items-center gap-2 text-fuchsia-200">
                <Gift size={18} />
                <h2 className="font-bold">Mã giảm giá</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">Nhập mã để giảm giá đơn hàng (VD: PHONGG20K)</p>
            </div>
            <div className="p-5">
              {voucherApDung ? (
                <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-emerald-300" />
                        <span className="font-mono text-sm font-bold text-emerald-100">{voucherApDung.maCode}</span>
                      </div>
                      <p className="mt-2 text-sm text-emerald-200">
                        Giảm <b>{dinhDangTien(voucherApDung.soTienGiam)}</b>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300/80">
                        <Sparkles size={12} /> {voucherApDung.thongBao || 'Áp dụng thành công'}
                      </p>
                    </div>
                    <button type="button" onClick={goBoMaGiamGia} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title="Gỡ mã">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={maGiamGiaNhap}
                    onChange={(e) => datMaGiamGiaNhap(e.target.value.toUpperCase())}
                    placeholder="PHONGG20K"
                    className="o-nhap flex-1 font-mono uppercase tracking-wide"
                    disabled={dangApMa}
                  />
                  <button
                    type="button"
                    onClick={apMaGiamGia}
                    disabled={dangApMa || !maGiamGiaNhap.trim()}
                    className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
                  >
                    {dangApMa ? <Loader2 size={18} className="animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>
              )}
              {loiVoucher && <p className="mt-3 text-sm text-rose-300">{loiVoucher}</p>}
            </div>
          </div>

          <div className="the-kinh p-5">
          <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ghế ({gheChon.length})</span>
              <span className="font-medium text-white">{dinhDangTien(tienGhe)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Bắp nước</span>
              <span className="font-medium text-white">{dinhDangTien(tienBapNuoc)}</span>
            </div>
            {soTienGiam > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Giảm giá ({voucherApDung?.maCode})</span>
                <span className="font-medium">−{dinhDangTien(soTienGiam)}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-cinema-500">{dinhDangTien(tongTien)}</span>
              </div>
              {soTienGiam > 0 && (
                <p className="mt-1 text-xs text-slate-500 line-through">{dinhDangTien(tongGoc)}</p>
              )}
            </div>
          </div>
          {thongTinHinhThuc && (
            <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400">
              Đã chọn: <b className="text-white">{thongTinHinhThuc.ten}</b>
            </p>
          )}
          <button
            type="button"
            onClick={xacNhanDatVe}
            disabled={!hinhThucChon || dangXuLy || dangGiaHanGhe || dangKhoiTaoGhe || !giayConLai || veDaTao || hienModalCk}
            className="nut-chinh mt-6 flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            {dangXuLy ? <><Loader2 size={18} className="animate-spin" />Đang tạo vé...</> : <><CreditCard size={18} />Xác nhận &amp; nhận thông tin CK</>}
          </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
