import { CheckCircle2, Clock3, Eye, Loader2, RefreshCw, Search, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmPrintModal from '../../components/ConfirmPrintModal'
import NutInVe from '../../components/NutInVe'
import PrintTicketTemplate from '../../components/PrintTicketTemplate'
import { useInVePhim } from '../../hooks/useInVePhim'
import { layDanhSachPhim } from '../../services/movieService'
import { layVeChoThanhToan, layVeDaXacNhan, duyetVeBooking } from '../../services/ticketService'
import { dinhDangKhoangGio, dinhDangNgayGio, dinhDangTien } from '../../utils/formatters'
import { tenHinhThucThanhToan, tenTrangThaiVe } from '../../utils/hinhThucThanhToan'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const TAB = { CHO: 'cho', DA: 'da' }

function ChiTietVeAdmin({ ve, thongTinPhim, onInVe }) {
  if (!ve) return null
  const thoiLuong = thongTinPhim?.duration ? `${thongTinPhim.duration} phút` : '—'

  return (
    <div className="mt-4 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">Chi tiết vé</p>
          <h3 className="mt-1 text-lg font-bold">{ve.movieTitle || ve.title}</h3>
        </div>
        <NutInVe onClick={() => onInVe(ve, thongTinPhim)} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <p className="text-slate-400">
          Suất: <span className="text-white">{dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc)}</span>
        </p>
        <p className="text-slate-400">
          Định dạng: <span className="text-white">{ve.dinhDang || '—'}</span>
        </p>
        <p className="text-slate-400">
          Ghế: <span className="font-semibold text-white">{(ve.danhSachGheChon || []).join(', ')}</span>
        </p>
        <p className="text-slate-400">
          Tổng giá ghế: <span className="text-white">{dinhDangTien(ve.tienGhe ?? 0)}</span>
        </p>
        <p className="text-slate-400">
          Thời lượng: <span className="text-white">{thoiLuong}</span>
        </p>
        <p className="text-slate-400">
          Thanh toán: <span className="text-white">{tenHinhThucThanhToan(ve.hinhThucThanhToan)} · {dinhDangNgayGio(ve.ngayTao)}</span>
        </p>
        {(ve.hoTenNguoiDung || ve.emailNguoiDung) && (
          <p className="text-slate-400">
            Khách: <span className="text-white">{ve.hoTenNguoiDung || '—'}</span>
            {ve.emailNguoiDung && <span className="text-slate-500"> · {ve.emailNguoiDung}</span>}
            {ve.soDienThoaiNguoiDung && <span className="text-slate-500"> · {ve.soDienThoaiNguoiDung}</span>}
          </p>
        )}
      </div>
      {ve.danhSachCombo?.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Combo bắp nước</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2">Tên combo</th>
                <th className="pb-2 text-center">SL</th>
                <th className="pb-2 text-right">Giá</th>
              </tr>
            </thead>
            <tbody>
              {ve.danhSachCombo.map((combo) => (
                <tr key={combo.maCombo || combo.tenCombo} className="border-t border-white/5">
                  <td className="py-1.5 text-white">{combo.tenCombo}</td>
                  <td className="py-1.5 text-center text-slate-300">{combo.soLuong}</td>
                  <td className="py-1.5 text-right text-slate-300">{dinhDangTien((combo.donGia || 0) * (combo.soLuong || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-lg font-bold text-emerald-300">Tổng cộng: {dinhDangTien(ve.tongTien)}</p>
    </div>
  )
}

export default function ManageTicketsPage() {
  const [tab, datTab] = useState(TAB.CHO)
  const [danhSachCho, datDanhSachCho] = useState([])
  const [danhSachDa, datDanhSachDa] = useState([])
  const [dangTaiCho, datDangTaiCho] = useState(true)
  const [dangTaiDa, datDangTaiDa] = useState(false)
  const [daTaiDa, datDaTaiDa] = useState(false)
  const [maVeDangXuLy, datMaVeDangXuLy] = useState('')
  const [thongBao, datThongBao] = useState('')
  const [loiTai, datLoiTai] = useState('')
  const [veVuaXacNhan, datVeVuaXacNhan] = useState('')
  const [veChiTiet, datVeChiTiet] = useState(null)
  const [thongTinPhimChiTiet, datThongTinPhimChiTiet] = useState(null)
  const [tuKhoa, datTuKhoa] = useState('')

  const {
    moXacNhanIn,
    veCanIn,
    thongTinPhimCanIn,
    hienTemplateIn,
    yeuCauInVe,
    huyInVe,
    xacNhanInVe,
  } = useInVePhim()

  const taiCho = useCallback(async () => {
    datDangTaiCho(true)
    datLoiTai('')
    try {
      const cho = await layVeChoThanhToan()
      datDanhSachCho(cho)
    } catch (loi) {
      datDanhSachCho([])
      datLoiTai(layThongBaoLoiApi(loi))
    } finally {
      datDangTaiCho(false)
    }
  }, [])

  const taiDa = useCallback(async () => {
    datDangTaiDa(true)
    try {
      const da = await layVeDaXacNhan()
      datDanhSachDa(da)
      datDaTaiDa(true)
    } catch (loi) {
      datDanhSachDa([])
      datLoiTai(layThongBaoLoiApi(loi))
    } finally {
      datDangTaiDa(false)
    }
  }, [])

  const taiDanhSach = useCallback(async () => {
    await taiCho()
    if (tab === TAB.DA || daTaiDa) await taiDa()
  }, [taiCho, taiDa, tab, daTaiDa])

  useEffect(() => { taiCho() }, [taiCho])

  useEffect(() => {
    if (tab === TAB.DA && !daTaiDa) taiDa()
  }, [tab, daTaiDa, taiDa])

  useEffect(() => {
    const movieTitle = veChiTiet?.movieTitle || veChiTiet?.title
    if (!movieTitle) {
      datThongTinPhimChiTiet(null)
      return
    }
    layDanhSachPhim({ tuKhoa: movieTitle, size: 10 })
      .then((phanHoi) => {
        const ds = phanHoi.content || phanHoi
        const danhSach = Array.isArray(ds) ? ds : []
        datThongTinPhimChiTiet(danhSach.find((p) => (p.title || p.movieTitle) === movieTitle) || danhSach[0] || null)
      })
      .catch(() => datThongTinPhimChiTiet(null))
  }, [veChiTiet?.movieTitle, veChiTiet?.title])

  const xacNhan = async (maVe) => {
    datMaVeDangXuLy(maVe)
    datThongBao('')
    try {
      await duyetVeBooking(maVe)
      datVeVuaXacNhan(maVe)
      datTab(TAB.DA)
      datThongBao('Đã xác nhận thanh toán. Email vé (QR soát vé) đã gửi tới khách.')
      await taiCho()
      await taiDa()
    } catch (loi) {
      datThongBao(layThongBaoLoiApi(loi))
    } finally {
      datMaVeDangXuLy('')
    }
  }

  const moChiTietVe = (ve) => {
    datVeChiTiet(veChiTiet?.id === ve.id ? null : ve)
  }

  const thongKeCho = useMemo(() => {
    const pending = danhSachCho.filter((v) => v.trangThai === 'PENDING').length
    const choXacNhan = danhSachCho.filter((v) => v.trangThai === 'CHO_XAC_NHAN').length
    return { pending, choXacNhan, tong: danhSachCho.length }
  }, [danhSachCho])

  const locTuKhoa = (ve) => {
    const k = tuKhoa.trim().toLowerCase()
    if (!k) return true
    const noiDung = [
      ve.movieTitle || ve.title, ve.tenRap, ve.maPhong, ve.hoTenNguoiDung, ve.emailNguoiDung,
      ve.noiDungChuyenKhoan, ve.hinhThucThanhToan,
      (ve.danhSachGheChon || []).join(' '),
      dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc),
    ].filter(Boolean).join(' ').toLowerCase()
    return noiDung.includes(k)
  }

  const danhSachHienThi = useMemo(() => {
    const nguon = tab === TAB.CHO ? danhSachCho : danhSachDa
    return nguon.filter(locTuKhoa)
  }, [tab, danhSachCho, danhSachDa, tuKhoa])
  const dangTai = tab === TAB.CHO ? dangTaiCho : dangTaiDa

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Quản lý vé</p>
          <h1 className="mt-1 text-3xl font-black">Xác nhận thanh toán</h1>
          <p className="mt-2 text-slate-400">
            Vé chuyển khoản / MoMo thủ công cần admin duyệt. Vé cổng VNPay/MoMo tự xác nhận — không hiện ở đây.
          </p>
        </div>
        <button type="button" onClick={taiDanhSach} disabled={dangTaiCho || dangTaiDa} className="admin-nav-link">
          <RefreshCw size={16} className={dangTaiCho || dangTaiDa ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {tab === TAB.CHO && !dangTaiCho && (
        <p className="mb-4 text-sm text-slate-400">
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">Chờ thanh toán: {thongKeCho.pending}</span>
          {' · '}
          <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-fuchsia-200">Đã báo chuyển khoản: {thongKeCho.choXacNhan}</span>
          {' · '}
          Tổng cần duyệt: <b className="text-white">{thongKeCho.tong}</b>
        </p>
      )}

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => datTuKhoa(e.target.value)}
          placeholder="Tìm phim, khách, ghế, nội dung CK..."
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-fuchsia-400/50"
        />
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => { datTab(TAB.CHO); datVeChiTiet(null) }}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === TAB.CHO ? 'bg-fuchsia-600 text-white' : 'admin-glass text-slate-400 hover:text-white'}`}
        >
          Chờ xác nhận ({danhSachCho.length})
        </button>
        <button
          type="button"
          onClick={() => { datTab(TAB.DA); datVeChiTiet(null) }}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === TAB.DA ? 'bg-emerald-600 text-white' : 'admin-glass text-slate-400 hover:text-white'}`}
        >
          Đã xác nhận ({danhSachDa.length})
        </button>
      </div>

      {loiTai && (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Không tải được danh sách vé: {loiTai}. Kiểm tra backend đang chạy và bạn đăng nhập tài khoản Admin.
        </p>
      )}

      {thongBao && (
        <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${thongBao.includes('Lỗi') || thongBao.includes('Không') || thongBao.includes('HTTP') ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
          {thongBao}
        </p>
      )}

      {dangTai ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={20} /> Đang tải...</div>
      ) : danhSachHienThi.length === 0 ? (
        <div className="admin-glass rounded-2xl p-8 text-center text-slate-400">
          <Clock3 className="mx-auto mb-3 text-amber-300" size={32} />
            {tab === TAB.CHO
            ? 'Không có vé chờ duyệt. Vé CK/MoMo «Chờ thanh toán» hoặc «Chờ xác nhận» sẽ hiện ở đây.'
            : tuKhoa.trim()
              ? 'Không tìm thấy vé phù hợp.'
              : 'Chưa có vé đã thanh toán. Vé sau khi bấm «Đã nhận tiền» sẽ hiện ở đây.'}
        </div>
      ) : (
        <div className="space-y-4">
          {danhSachHienThi.map((ve) => (
            <article
              key={ve.id}
              className={`admin-glass rounded-2xl p-5 transition ${veVuaXacNhan === ve.id ? 'ring-2 ring-emerald-400/60' : ''} ${veChiTiet?.id === ve.id ? 'ring-2 ring-fuchsia-400/50' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500">MÃ VÉ #{ve.id?.slice(-8)}</p>
                    {tab === TAB.CHO && ve.trangThai === 'PENDING' && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                        Chờ thanh toán
                      </span>
                    )}
                    {tab === TAB.CHO && ve.trangThai === 'CHO_XAC_NHAN' && (
                      <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-fuchsia-200">
                        Đã báo CK
                      </span>
                    )}
                    {tab === TAB.DA && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ve.trangThai === 'USED' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
                        {tenTrangThaiVe(ve.trangThai)}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-xl font-bold">{ve.movieTitle || ve.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc)}
                    {' · '}{ve.tenRap} · Phòng {ve.maPhong}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Ghế: <b className="text-white">{ve.danhSachGheChon?.join(', ')}</b></p>
                  {(ve.hoTenNguoiDung || ve.emailNguoiDung) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                      <User size={14} className="shrink-0 text-slate-500" />
                      <span className="text-slate-300">{ve.hoTenNguoiDung || ve.emailNguoiDung}</span>
                      {ve.emailNguoiDung && ve.hoTenNguoiDung && <span className="text-slate-500">· {ve.emailNguoiDung}</span>}
                    </p>
                  )}
                  <p className="mt-2 text-sm">
                    Hình thức: <b className="text-fuchsia-200">{tenHinhThucThanhToan(ve.hinhThucThanhToan)}</b>
                    {' · '}
                    Số tiền: <b className="text-white">{dinhDangTien(ve.tongTien)}</b>
                  </p>
                  {ve.noiDungChuyenKhoan && (
                    <p className="mt-1 text-sm text-amber-200">
                      Nội dung CK: <b className="font-mono">{ve.noiDungChuyenKhoan}</b>
                    </p>
                  )}
                  {ve.maQrCode && (
                    <p className="mt-1 font-mono text-xs text-slate-500">QR: {ve.maQrCode}</p>
                  )}
                  {ve.ngayTao && <p className="mt-1 text-xs text-slate-500">Đặt lúc: {dinhDangNgayGio(ve.ngayTao)}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moChiTietVe(ve)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Eye size={16} />
                    {veChiTiet?.id === ve.id ? 'Ẩn chi tiết' : 'Chi tiết vé'}
                  </button>
                  {tab === TAB.CHO ? (
                    <button
                      type="button"
                      onClick={() => xacNhan(ve.id)}
                      disabled={maVeDangXuLy === ve.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {maVeDangXuLy === ve.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Xác nhận đã nhận tiền
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
                      <CheckCircle2 size={16} />
                      Đã kích hoạt vé
                    </div>
                  )}
                </div>
              </div>
              {veChiTiet?.id === ve.id && (
                <ChiTietVeAdmin
                  ve={veChiTiet}
                  thongTinPhim={thongTinPhimChiTiet}
                  onInVe={yeuCauInVe}
                />
              )}
            </article>
          ))}
        </div>
      )}

      <ConfirmPrintModal mo={moXacNhanIn} onXacNhan={xacNhanInVe} onHuy={huyInVe} />
      <PrintTicketTemplate ve={veCanIn} thongTinPhim={thongTinPhimCanIn} hienThi={hienTemplateIn} />
    </div>
  )
}
