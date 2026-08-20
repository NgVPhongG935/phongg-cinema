import { Clock3, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { MauGheChuThich } from '../components/IconGheSofa'
import SoDoGheHienThi from '../components/SoDoGheHienThi'
import { useAuth } from '../context/AuthContext'
import { giuGheTamThoi, laySoDoGhe } from '../services/showtimeService'
import { dinhDangTien } from '../utils/formatters'
import { chuanHoaGheDatVe, layCapGheDoi } from '../utils/soDoGhe'
import { lamTronNghin, tinhGiaGhe } from '../utils/tinhGiaVe'

export default function SeatBookingPage() {
  const { id } = useParams()
  const { nguoiDung } = useAuth()
  const dieuHuong = useNavigate()
  const viTri = useLocation()
  const [danhSachGhe, datDanhSachGhe] = useState([])
  const [giaVeTu, datGiaVeTu] = useState(0)
  const [gheChon, datGheChon] = useState([])
  const [giayConLai, datGiayConLai] = useState(0)
  const [dangXuLy, datDangXuLy] = useState(false)

  useEffect(() => {
    laySoDoGhe(id).then(({ giaVeTu: gia, danhSachGhe: danhSach }) => {
      datGiaVeTu(gia || 0)
      datDanhSachGhe(danhSach.map((ghe) => chuanHoaGheDatVe(ghe, gia)))
    }).catch(() => {
      datGiaVeTu(0)
      datDanhSachGhe([])
    })
  }, [id])
  useEffect(() => {
    if (!giayConLai) return undefined
    const boDem = setInterval(() => datGiayConLai((cu) => Math.max(0, cu - 1)), 1000)
    return () => clearInterval(boDem)
  }, [giayConLai])

  const demNguocThoiGian = `${String(Math.floor(giayConLai / 60)).padStart(2, '0')}:${String(giayConLai % 60).padStart(2, '0')}`

  const tongTien = useMemo(() => gheChon.reduce((tong, soGhe) => {
    const ghe = danhSachGhe.find((muc) => muc.soGhe === soGhe)
    return tong + (ghe?.giaGhe ?? 0)
  }, 0), [gheChon, danhSachGhe])

  const giaThuong = lamTronNghin(giaVeTu)
  const giaVip = tinhGiaGhe(giaVeTu, 'VIP')
  const giaCouple = tinhGiaGhe(giaVeTu, 'COUPLE')

  const chonGhe = (ghe) => {
    if (ghe.trangThai !== 'AVAILABLE' || dangXuLy) return
    const danhSachSoGhe = ghe.loaiGhe === 'COUPLE' ? layCapGheDoi(ghe.soGhe) : [ghe.soGhe]
    const daChonHet = danhSachSoGhe.every((so) => gheChon.includes(so))
    if (daChonHet) datGheChon((cu) => cu.filter((so) => !danhSachSoGhe.includes(so)))
    else datGheChon((cu) => [...new Set([...cu, ...danhSachSoGhe])])
  }

  const giuGhe = async () => {
    if (!nguoiDung) return window.dispatchEvent(new Event('open-auth-modal'))
    if (!gheChon.length) return
    datDangXuLy(true)
    try {
      const phanHoi = await giuGheTamThoi(id, gheChon, nguoiDung.id)
      datGiayConLai(Math.max(0, Math.floor((new Date(phanHoi.thoiGianHetHan) - new Date()) / 1000)))
      datDanhSachGhe((cu) => cu.map((ghe) => (gheChon.includes(ghe.soGhe) ? { ...ghe, trangThai: 'HELD', nguoiGiuGhe: nguoiDung.id } : ghe)))
    } catch (loi) {
      window.alert(loi.response?.data?.message || 'Không thể giữ ghế đã chọn')
      laySoDoGhe(id).then(({ giaVeTu: gia, danhSachGhe: danhSach }) => {
        datGiaVeTu(gia || 0)
        datDanhSachGhe(danhSach.map((ghe) => chuanHoaGheDatVe(ghe, gia)))
      })
    } finally {
      datDangXuLy(false)
    }
  }

  const tiepTucCombo = () => {
    if (!giayConLai || !gheChon.length) return
    dieuHuong(`/booking/${id}/combo`, {
      state: {
        phim: viTri.state?.phim,
        gheChon,
        tienGhe: tongTien,
        giayConLai,
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-8 sm:px-4 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">Bước 1 · Chọn ghế</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Chọn ghế của bạn</h1>
        <p className="mt-1 text-sm text-slate-400 sm:text-base">{viTri.state?.phim?.title || 'Suất chiếu'} · PhongG Cinema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
        <section className="the-kinh overflow-x-auto p-4 sm:p-6 lg:p-8">
          <div className="relative mx-auto mb-2 w-full max-w-5xl">
            <div className="mx-auto h-4 w-[95%] rounded-t-[50%] bg-gradient-to-b from-cyan-400/30 via-white/20 to-transparent shadow-[0_8px_40px_rgba(34,211,238,0.5)] sm:h-6" />
            <div className="mx-auto -mt-1 h-1 w-[90%] rounded-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
          </div>
          <p className="mb-8 text-center text-xs font-semibold tracking-[.5em] text-slate-400 sm:mb-10 sm:tracking-[.6em]">MÀN HÌNH</p>

          <div className="mx-auto flex w-full min-w-[680px] max-w-5xl flex-col gap-1.5 sm:gap-2">
            <SoDoGheHienThi danhSachGhe={danhSachGhe} gheChon={gheChon} onChon={chonGhe} />
          </div>

          <div className="mx-auto mt-8 flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-xl bg-white/5 px-4 py-4 text-xs text-slate-300 sm:gap-x-6 sm:text-sm">
            <span className="flex items-center gap-2"><MauGheChuThich loai="thuong" />Ghế thường <span className="text-slate-500">({dinhDangTien(giaThuong)})</span></span>
            <span className="flex items-center gap-2"><MauGheChuThich loai="vip" />Ghế VIP <span className="text-slate-500">({dinhDangTien(giaVip)})</span></span>
            <span className="flex items-center gap-2"><MauGheChuThich loai="doi" kichThuoc={18} />Ghế đôi <span className="text-slate-500">({dinhDangTien(giaCouple)})</span></span>
            <span className="flex items-center gap-2"><MauGheChuThich loai="daDat" gachCheo />Đã đặt</span>
            <span className="flex items-center gap-2 rounded-lg ring-2 ring-blue-400/70 px-1.5 py-0.5"><MauGheChuThich loai="chon" />Ghế bạn chọn</span>
          </div>
        </section>

        <aside className="the-kinh h-fit p-5">
          <h2 className="text-xl font-bold">Thông tin đặt vé</h2>
          {giayConLai > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-400/15 p-3 text-amber-300">
              <Clock3 size={18} />Giữ ghế: <b>{demNguocThoiGian}</b>
            </div>
          )}
          <div className="my-5 border-y border-white/10 py-4 text-sm">
            <p className="text-slate-400">Ghế đã chọn</p>
            <p className="mt-2 font-semibold">{gheChon.join(', ') || 'Chưa chọn ghế'}</p>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-cinema-500">{dinhDangTien(tongTien)}</span>
          </div>
          <button onClick={giayConLai > 0 ? tiepTucCombo : giuGhe} disabled={!gheChon.length || dangXuLy} className="nut-chinh mt-6 flex w-full items-center justify-center gap-2">
            {giayConLai > 0 ? <>Chọn bắp nước →</> : <><Ticket size={18} />Giữ ghế 5 phút</>}
          </button>
        </aside>
      </div>
    </div>
  )
}
