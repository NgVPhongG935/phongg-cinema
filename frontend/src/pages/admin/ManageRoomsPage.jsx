import { DoorOpen, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AddRoomModal from '../../components/AddRoomModal'
import {
  capNhatPhong,
  layDanhSachPhong,
  layDanhSachRap,
  themPhong,
  xoaPhong,
} from '../../services/cinemaService'
import { layDanhSachKhuVuc } from '../../services/regionService'

export default function ManageRoomsPage() {
  const dieuHuong = useNavigate()
  const [danhSachRap, datDanhSachRap] = useState([])
  const [danhSachKhuVuc, datDanhSachKhuVuc] = useState([])
  const [maRap, datMaRap] = useState('')
  const [danhSachPhong, datDanhSachPhong] = useState([])
  const [phongSua, datPhongSua] = useState(null)
  const [dangMo, datDangMo] = useState(false)
  const [thongBao, datThongBao] = useState('')
  const [loiModal, datLoiModal] = useState('')

  const rapDaChon = danhSachRap.find((rap) => rap.id === maRap)

  const taiRap = () => layDanhSachRap().then((danhSach) => {
    datDanhSachRap(danhSach)
    if (!maRap && danhSach.length > 0) datMaRap(danhSach[0].id)
  })

  const taiPhong = (idRap = maRap) => {
    if (!idRap) {
      datDanhSachPhong([])
      return Promise.resolve()
    }
    return layDanhSachPhong(idRap).then(datDanhSachPhong).catch(() => datDanhSachPhong([]))
  }

  useEffect(() => {
    layDanhSachKhuVuc().then(datDanhSachKhuVuc).catch(() => datDanhSachKhuVuc([]))
    taiRap()
  }, [])

  useEffect(() => { if (maRap) taiPhong(maRap) }, [maRap])

  const moBieuMau = (phong = null) => {
    datPhongSua(phong)
    datThongBao('')
    datLoiModal('')
    datDangMo(true)
  }

  const luuPhong = async (duLieuGui) => {
    const idRap = phongSua ? maRap : duLieuGui.maRap
    if (!idRap) return
    try {
      if (phongSua) {
        await capNhatPhong(idRap, phongSua.maPhong, {
          tenPhong: duLieuGui.tenPhong,
          loaiPhong: duLieuGui.loaiPhong,
        })
        datThongBao('Cập nhật phòng thành công.')
        datDangMo(false)
        if (idRap !== maRap) datMaRap(idRap)
        taiPhong(idRap)
        taiRap()
      } else {
        const phanHoi = await themPhong(idRap, {
          maPhong: duLieuGui.maPhong,
          tenPhong: duLieuGui.tenPhong,
          loaiPhong: duLieuGui.loaiPhong,
          mauSoDoGhe: duLieuGui.mauSoDoGhe,
        })
        datThongBao('Thêm phòng thành công.')
        datDangMo(false)
        datMaRap(idRap)
        taiPhong(idRap)
        taiRap()
        if (duLieuGui.mauSoDoGhe === 'TUUY_CHINH') {
          dieuHuong(`/admin/rooms/${idRap}/${phanHoi.maPhong}/seats`)
        }
      }
    } catch (loi) {
      const msg = loi.response?.data?.message || 'Không thể lưu phòng.'
      if (dangMo) datLoiModal(msg)
      else datThongBao(msg)
    }
  }

  const xoaPhongHandler = async (maPhong) => {
    if (!window.confirm(`Xóa phòng ${maPhong}?`)) return
    try {
      await xoaPhong(maRap, maPhong)
      datThongBao('Đã xóa phòng.')
      taiPhong()
      taiRap()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể xóa (có thể đã có suất chiếu).')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Quản lý phòng chiếu</h1>
          <p className="mt-1 text-slate-400">Thêm phòng với mẫu sơ đồ ghế tự động hoặc tùy chỉnh riêng</p>
        </div>
        <button type="button" onClick={() => moBieuMau()} className="nut-chinh flex items-center gap-2">
          <Plus size={18} />Thêm phòng
        </button>
      </div>

      <div className="the-kinh mt-6 p-5">
        <label className="block text-sm text-slate-300">
          Lọc theo rạp
          <select value={maRap} onChange={(e) => datMaRap(e.target.value)} className="o-nhap mt-2">
            <option value="">-- Chọn rạp --</option>
            {danhSachRap.map((rap) => (
              <option key={rap.id} value={rap.id}>{rap.tenRap} ({rap.khuVuc || 'Chưa phân khu vực'})</option>
            ))}
          </select>
        </label>
        {rapDaChon && (
          <p className="mt-3 text-sm text-slate-400">
            {rapDaChon.diaChi} · <span className="text-cinema-400">{danhSachPhong.length} phòng</span>
            {' · '}
            <Link to="/admin/cinemas" className="text-fuchsia-300 hover:underline">Quản lý rạp</Link>
          </p>
        )}
      </div>

      {thongBao && <p className="mt-4 text-sm text-cinema-500">{thongBao}</p>}

      <div className="the-kinh mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <DoorOpen size={20} className="text-cinema-400" />
          Danh sách phòng ({danhSachPhong.length})
        </h2>
        {danhSachPhong.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Chưa có phòng nào. Bấm «Thêm phòng» để tạo phòng mới.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {danhSachPhong.map((phong) => (
              <div key={phong.maPhong} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-semibold">{phong.tenPhong}</p>
                  <p className="mt-1 text-sm text-cinema-400">Mã: {phong.maPhong}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {phong.loaiPhong || '2D'} · {phong.danhSachGhe?.length || 0} ghế
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/admin/rooms/${maRap}/${phong.maPhong}/seats`} className="rounded-lg border border-fuchsia-400/30 p-2 text-fuchsia-200 hover:bg-fuchsia-500/10" title="Sửa sơ đồ ghế">
                    <LayoutGrid size={16} />
                  </Link>
                  <button type="button" onClick={() => moBieuMau(phong)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10" title="Sửa">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => xoaPhongHandler(phong.maPhong)} className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddRoomModal
        mo={dangMo}
        phongSua={phongSua}
        danhSachKhuVuc={danhSachKhuVuc}
        danhSachRap={danhSachRap}
        soPhongTrongRap={danhSachPhong.length}
        maRapMacDinh={maRap}
        khuVucHienTai={rapDaChon?.khuVuc}
        thongBaoLoi={loiModal}
        onDong={() => datDangMo(false)}
        onLuu={luuPhong}
      />
    </div>
  )
}
