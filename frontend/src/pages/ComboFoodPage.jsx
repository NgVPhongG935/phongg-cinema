import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Loader2, Minus, Plus, Popcorn, ShoppingBag, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { giuGheTamThoi } from '../services/showtimeService'
import { layDanhSachCombo } from '../services/comboService'
import {
  chuyenComboTuApi, DANH_SACH_COMBO_MAC_DINH, demTongSoCombo, taoSoLuongComboRong, tinhTienCombo,
} from '../utils/comboFood'
import { dinhDangTien } from '../utils/formatters'
import { layThongBaoLoiApi } from '../utils/layThongBaoLoiApi'

const BIEU_TUONG_COMBO = {
  popcorn: Popcorn,
  couple: ShoppingBag,
  family: Users,
}

export default function ComboFoodPage() {
  const { id } = useParams()
  const dieuHuong = useNavigate()
  const viTri = useLocation()
  const { nguoiDung } = useAuth()
  const [soLuongCombo, datSoLuongCombo] = useState(() => taoSoLuongComboRong())
  const [danhSachCombo, datDanhSachCombo] = useState(DANH_SACH_COMBO_MAC_DINH)
  const [giayConLai, datGiayConLai] = useState(viTri.state?.giayConLai || 0)
  const [dangGiaHanGhe, datDangGiaHanGhe] = useState(false)
  const [thongBaoLoi, datThongBaoLoi] = useState('')

  const gheChon = viTri.state?.gheChon || []
  const tienGhe = viTri.state?.tienGhe || 0
  const phim = viTri.state?.phim

  const giaHanGiuGhe = useCallback(async () => {
    if (!nguoiDung?.id || !gheChon.length) return
    datDangGiaHanGhe(true)
    try {
      const phanHoi = await giuGheTamThoi(id, gheChon, nguoiDung.id)
      const giay = Math.max(0, Math.floor((new Date(phanHoi.thoiGianHetHan) - new Date()) / 1000))
      datGiayConLai(giay)
    } catch (loi) {
      datThongBaoLoi(layThongBaoLoiApi(loi))
    } finally {
      datDangGiaHanGhe(false)
    }
  }, [nguoiDung?.id, gheChon, id])

  useEffect(() => {
    layDanhSachCombo()
      .then((ketQua) => {
        if (ketQua?.length) {
          const danhSach = ketQua.map(chuyenComboTuApi)
          datDanhSachCombo(danhSach)
          datSoLuongCombo(taoSoLuongComboRong(danhSach))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!nguoiDung) window.dispatchEvent(new Event('open-auth-modal'))
    if (!gheChon.length) dieuHuong(`/booking/${id}`, { replace: true, state: { phim } })
  }, [nguoiDung, gheChon.length, id, dieuHuong, phim])

  useEffect(() => {
    if (nguoiDung?.id && gheChon.length) giaHanGiuGhe()
  }, [nguoiDung?.id, gheChon.length, giaHanGiuGhe])

  useEffect(() => {
    if (!giayConLai) return undefined
    const boDem = setInterval(() => datGiayConLai((cu) => Math.max(0, cu - 1)), 1000)
    return () => clearInterval(boDem)
  }, [giayConLai])

  useEffect(() => {
    if (giayConLai === 0 && gheChon.length && !dangGiaHanGhe) {
      datThongBaoLoi('Hết thời gian giữ ghế. Vui lòng chọn lại.')
      dieuHuong(`/booking/${id}`, { replace: true, state: { phim } })
    }
  }, [giayConLai, gheChon.length, dieuHuong, id, phim, dangGiaHanGhe])

  const tienBapNuoc = useMemo(() => tinhTienCombo(soLuongCombo, danhSachCombo), [soLuongCombo, danhSachCombo])
  const tongTien = tienGhe + tienBapNuoc
  const demNguocThoiGian = `${String(Math.floor(giayConLai / 60)).padStart(2, '0')}:${String(giayConLai % 60).padStart(2, '0')}`

  const thayDoiSoLuong = (maCombo, delta) => {
    datSoLuongCombo((cu) => {
      const moi = Math.max(0, (cu[maCombo] || 0) + delta)
      return { ...cu, [maCombo]: moi }
    })
  }

  const chuyenThanhToan = (boQuaCombo = false) => {
    if (!nguoiDung || !giayConLai) return
    dieuHuong(`/booking/${id}/payment`, {
      state: {
        phim,
        gheChon,
        tienGhe,
        tienBapNuoc: boQuaCombo ? 0 : tienBapNuoc,
        soLuongCombo: boQuaCombo ? taoSoLuongComboRong() : soLuongCombo,
        giayConLai,
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/booking/${id}`} state={{ phim, gheChon, giayConLai }} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Quay lại chọn ghế
          </Link>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Bước 2 · Bắp nước</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">Hoàn thiện trải nghiệm điện ảnh</h1>
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
          {danhSachCombo.map((combo) => {
            const Icon = BIEU_TUONG_COMBO[combo.icon] || Popcorn
            const soLuong = soLuongCombo[combo.ma] || 0
            return (
              <article
                key={combo.ma}
                className={`the-kinh overflow-hidden transition ${soLuong > 0 ? 'border-amber-400/40 ring-1 ring-amber-400/20' : ''}`}
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  {combo.hinhAnh ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                      <img src={combo.hinhAnh} alt={combo.ten} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 text-amber-300">
                      <Icon size={32} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{combo.ten}</h2>
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200">{combo.moTa}</span>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {combo.chiTiet.map((muc) => (
                        <li key={muc} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">{muc}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-lg font-bold text-cinema-400">{dinhDangTien(combo.gia)}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-xl border border-white/10 bg-black/30">
                      <button type="button" onClick={() => thayDoiSoLuong(combo.ma, -1)} disabled={soLuong === 0} className="rounded-l-xl p-2.5 text-slate-300 hover:bg-white/10 disabled:opacity-30" aria-label="Giảm">
                        <Minus size={18} />
                      </button>
                      <span className="min-w-[2.5rem] text-center font-bold">{soLuong}</span>
                      <button type="button" onClick={() => thayDoiSoLuong(combo.ma, 1)} className="rounded-r-xl p-2.5 text-slate-300 hover:bg-white/10" aria-label="Tăng">
                        <Plus size={18} />
                      </button>
                    </div>
                    {soLuong > 0 && <p className="text-sm text-amber-300">{dinhDangTien(combo.gia * soLuong)}</p>}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="the-kinh sticky top-24 h-fit p-5">
          <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ghế ({gheChon.length})</span>
              <span className="font-medium text-white">{dinhDangTien(tienGhe)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Bắp nước ({demTongSoCombo(soLuongCombo)})</span>
              <span className="font-medium text-white">{dinhDangTien(tienBapNuoc)}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-cinema-500">{dinhDangTien(tongTien)}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => chuyenThanhToan(false)} disabled={dangGiaHanGhe || !giayConLai} className="nut-chinh mt-6 flex w-full items-center justify-center gap-2 disabled:opacity-60">
            <CreditCard size={18} />Tiếp tục thanh toán
          </button>
          <button type="button" onClick={() => chuyenThanhToan(true)} disabled={dangGiaHanGhe || !giayConLai} className="mt-3 w-full rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-60">
            Bỏ qua combo, thanh toán ngay
          </button>
        </aside>
      </div>
    </div>
  )
}
