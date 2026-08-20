import { ArrowLeft, Layers, Paintbrush, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IconGheDon } from '../../components/IconGheSofa'
import SoDoGheHienThi from '../../components/SoDoGheHienThi'
import { capNhatSoDoGhe, laySoDoGhePhong } from '../../services/cinemaService'
import {
  CONG_CU_GHE, SO_COT, demGhe, gheSangLuoi, luoiSangGhe, mauCoBan, mauTieuChuan, taoHangRong,
} from '../../utils/soDoGhe'

const hangKeTiep = (hangCuoi) => {
  if (!hangCuoi || hangCuoi === 'Z') return 'A'
  if (hangCuoi === 'K') return 'L'
  if (hangCuoi === 'L') return 'L'
  return String.fromCharCode(hangCuoi.charCodeAt(0) + 1)
}

const mauO = (loai) => {
  if (!loai) return 'border border-dashed border-white/10 bg-slate-900/40'
  return 'bg-slate-800/60 border border-white/5'
}

const loaiIconO = (loai) => {
  if (!loai) return null
  if (loai === 'VIP') return 'adminVip'
  if (loai === 'COUPLE') return 'adminDoi'
  return 'adminThuong'
}

export default function ManageSeatMapPage() {
  const { maRap, maPhong } = useParams()
  const [thongTin, datThongTin] = useState(null)
  const [luoi, datLuoi] = useState([taoHangRong('A')])
  const [congCu, datCongCu] = useState('STANDARD')
  const [dangKe, datDangKe] = useState(false)
  const [dangLuu, datDangLuu] = useState(false)
  const [thongBao, datThongBao] = useState('')
  const [xemThu, datXemThu] = useState(false)
  const dangKeRef = useRef(false)

  useEffect(() => {
    laySoDoGhePhong(maRap, maPhong).then((phanHoi) => {
      datThongTin(phanHoi)
      datLuoi(gheSangLuoi(phanHoi.danhSachGhe))
    }).catch(() => datThongBao('Không tải được sơ đồ ghế.'))
  }, [maRap, maPhong])

  useEffect(() => {
    const thoatKe = () => { datDangKe(false); dangKeRef.current = false }
    window.addEventListener('mouseup', thoatKe)
    return () => window.removeEventListener('mouseup', thoatKe)
  }, [])

  const veO = (chiSoHang, chiSoCot) => {
    if (!thongTin?.coTheSua) return
    datLuoi((cu) => cu.map((hang, i) => {
      if (i !== chiSoHang) return hang
      const cotMoi = [...hang.cot]
      cotMoi[chiSoCot] = congCu === 'ERASER' ? null : congCu
      return { ...hang, cot: cotMoi }
    }))
  }

  const batDauKe = (chiSoHang, chiSoCot) => {
    if (!thongTin?.coTheSua) return
    datDangKe(true)
    dangKeRef.current = true
    veO(chiSoHang, chiSoCot)
  }

  const keTiep = (chiSoHang, chiSoCot) => {
    if (!dangKeRef.current) return
    veO(chiSoHang, chiSoCot)
  }

  const themHang = () => {
    const hangCuoi = luoi[luoi.length - 1]?.hang || 'A'
    const hangMoi = hangKeTiep(hangCuoi)
    if (luoi.some((h) => h.hang === hangMoi)) return
    datLuoi((cu) => [...cu, taoHangRong(hangMoi)])
  }

  const xoaHangCuoi = () => {
    if (luoi.length <= 1) return
    datLuoi((cu) => cu.slice(0, -1))
  }

  const apMau = (taoMau) => datLuoi(taoMau())

  const luuSoDo = async () => {
    const danhSachGhe = luoiSangGhe(luoi)
    if (!danhSachGhe.length) {
      datThongBao('Sơ đồ cần ít nhất 1 ghế.')
      return
    }
    if (thongTin?.soSuatChieuTuongLai > 0) {
      const xacNhan = window.confirm(
        `Phòng có ${thongTin.soSuatChieuTuongLai} suất chiếu tương lai. Sơ đồ ghế mới sẽ được đồng bộ tự động (giữ trạng thái ghế đã giữ/đặt nếu còn tồn tại). Tiếp tục?`,
      )
      if (!xacNhan) return
    }
    datDangLuu(true)
    datThongBao('')
    try {
      const phanHoi = await capNhatSoDoGhe(maRap, maPhong, danhSachGhe)
      datThongTin(phanHoi)
      datLuoi(gheSangLuoi(phanHoi.danhSachGhe))
      const dongBo = phanHoi.soSuatDaDongBo > 0
        ? ` Đã đồng bộ ${phanHoi.soSuatDaDongBo} suất chiếu tương lai.`
        : ''
      datThongBao(`Đã lưu ${phanHoi.danhSachGhe.length} ghế.${dongBo}`)
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể lưu sơ đồ ghế.')
    } finally {
      datDangLuu(false)
    }
  }

  const danhSachPreview = luoiSangGhe(luoi)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/rooms" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Quay lại Phòng chiếu
          </Link>
          <h1 className="text-3xl font-black">Thiết kế sơ đồ ghế</h1>
          <p className="mt-1 text-slate-400">
            {thongTin?.tenRap} · {thongTin?.tenPhong} ({maPhong}) · <span className="text-cinema-400">{demGhe(luoi)} ghế</span>
          </p>
        </div>
        <button type="button" onClick={luuSoDo} disabled={!thongTin?.coTheSua || dangLuu} className="nut-chinh flex items-center gap-2 disabled:opacity-50">
          <Save size={18} />{dangLuu ? 'Đang lưu...' : 'Lưu sơ đồ'}
        </button>
      </div>

      {!thongTin?.coTheSua && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Phòng đã có vé đặt — chỉ xem, không sửa được.
        </p>
      )}
      {thongTin?.coTheSua && thongTin?.soSuatChieuTuongLai > 0 && (
        <p className="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          Phòng có <strong>{thongTin.soSuatChieuTuongLai}</strong> suất chiếu tương lai. Khi lưu sơ đồ mới, hệ thống tự đồng bộ trạng thái ghế cho các suất đó.
        </p>
      )}
      {thongBao && <p className="mt-4 text-sm text-cinema-500">{thongBao}</p>}

      <div className="the-kinh mt-6 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(CONG_CU_GHE).map(([ma, { nhan, mau }]) => (
            <button
              key={ma}
              type="button"
              disabled={!thongTin?.coTheSua}
              onClick={() => datCongCu(ma)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${congCu === ma ? 'ring-2 ring-cyan-400' : ''} ${mau} disabled:opacity-50`}
            >
              {nhan}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!thongTin?.coTheSua} onClick={themHang} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <Plus size={14} className="mr-1 inline" />Thêm hàng
          </button>
          <button type="button" disabled={!thongTin?.coTheSua} onClick={xoaHangCuoi} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <Trash2 size={14} className="mr-1 inline" />Xóa hàng cuối
          </button>
          <button type="button" disabled={!thongTin?.coTheSua} onClick={() => apMau(mauCoBan)} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <Layers size={14} className="mr-1 inline" />Mẫu cơ bản (50)
          </button>
          <button type="button" disabled={!thongTin?.coTheSua} onClick={() => apMau(mauTieuChuan)} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <Paintbrush size={14} className="mr-1 inline" />Mẫu tiêu chuẩn (~200)
          </button>
          <button type="button" onClick={() => datXemThu((v) => !v)} className="rounded-xl border border-fuchsia-400/30 px-3 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-500/10">
            {xemThu ? 'Ẩn xem thử' : 'Xem thử'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Giữ chuột và kéo để tô nhanh nhiều ô. Hàng L dùng cho ghế đôi.</p>
      </div>

      <div className="the-kinh mt-6 overflow-x-auto p-6">
        <div className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Màn hình</div>
        {xemThu ? (
          <SoDoGheHienThi danhSachGhe={danhSachPreview} cheDoAdmin />
        ) : (
          <div className="space-y-1">
            {luoi.map((hang, chiSoHang) => (
              <div key={hang.hang} className="flex items-center justify-center gap-1">
                <span className="w-6 text-center text-xs font-bold text-slate-500">{hang.hang}</span>
                {hang.cot.map((loai, chiSoCot) => (
                  <button
                    key={`${hang.hang}-${chiSoCot}`}
                    type="button"
                    disabled={!thongTin?.coTheSua}
                    onMouseDown={() => batDauKe(chiSoHang, chiSoCot)}
                    onMouseEnter={() => keTiep(chiSoHang, chiSoCot)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md sm:h-9 sm:w-9 ${mauO(loai)} disabled:cursor-not-allowed`}
                    title={loai ? `${hang.hang}${chiSoCot + 1}` : 'Trống'}
                  >
                    {loaiIconO(loai) && <IconGheDon loai={loaiIconO(loai)} kichThuoc={18} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
