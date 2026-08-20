import { DoorOpen, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from './admin/AdminModalOverlay'
import {
  DANH_SACH_MAU_SO_DO,
  LOAI_PHONG,
  goiYTenPhong,
  taoMaPhongTuTen,
} from '../utils/mauSoDoGhePhong'

const DU_LIEU_RONG = {
  tenPhong: '',
  khuVuc: '',
  maRap: '',
  loaiPhong: '2D',
  mauSoDoGhe: 'MAC_DINH',
}

export default function AddRoomModal({
  mo,
  phongSua,
  danhSachKhuVuc = [],
  danhSachRap = [],
  soPhongTrongRap = 0,
  maRapMacDinh = '',
  khuVucHienTai = '',
  thongBaoLoi = '',
  onDong,
  onLuu,
}) {
  const [duLieu, datDuLieu] = useState(DU_LIEU_RONG)

  const danhSachRapLoc = useMemo(() => {
    if (!duLieu.khuVuc) return danhSachRap
    return danhSachRap.filter((rap) => rap.khuVuc === duLieu.khuVuc)
  }, [danhSachRap, duLieu.khuVuc])

  useEffect(() => {
    if (!mo) return
    if (phongSua) {
      datDuLieu({
        tenPhong: phongSua.tenPhong || '',
        khuVuc: khuVucHienTai || danhSachRap.find((r) => r.id === maRapMacDinh)?.khuVuc || '',
        maRap: maRapMacDinh,
        loaiPhong: phongSua.loaiPhong || '2D',
        mauSoDoGhe: 'MAC_DINH',
      })
    } else {
      const khuVuc = danhSachKhuVuc[0] || ''
      const rapLoc = danhSachRap.filter((r) => !khuVuc || r.khuVuc === khuVuc)
      const maRap = maRapMacDinh || rapLoc[0]?.id || ''
      datDuLieu({
        tenPhong: goiYTenPhong(soPhongTrongRap),
        khuVuc,
        maRap,
        loaiPhong: '2D',
        mauSoDoGhe: 'MAC_DINH',
      })
    }
  }, [mo, phongSua, danhSachKhuVuc, danhSachRap, maRapMacDinh, soPhongTrongRap, khuVucHienTai])

  const thayDoiKhuVuc = (khuVuc) => {
    const rapLoc = danhSachRap.filter((r) => r.khuVuc === khuVuc)
    datDuLieu((cu) => ({
      ...cu,
      khuVuc,
      maRap: rapLoc[0]?.id || '',
    }))
  }

  const xuLyGui = (suKien) => {
    suKien.preventDefault()
    const tenPhong = duLieu.tenPhong.trim()
    if (!tenPhong) return
    onLuu({
      tenPhong,
      maPhong: taoMaPhongTuTen(tenPhong),
      loaiPhong: duLieu.loaiPhong,
      mauSoDoGhe: phongSua ? undefined : duLieu.mauSoDoGhe,
      maRap: duLieu.maRap,
    })
  }

  if (!mo) return null

  return (
    <AdminModalOverlay onBackdropClick={onDong} maxWidth="max-w-lg">
      <form onSubmit={xuLyGui} className="admin-modal-panel">
        <AdminModalHeader className="border-b border-white/10 bg-gradient-to-r from-fuchsia-600/20 to-violet-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorOpen size={20} className="text-fuchsia-300" />
              <h3 className="text-lg font-bold">{phongSua ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu'}</h3>
            </div>
            <button type="button" onClick={onDong} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </AdminModalHeader>

        <AdminModalBody className="space-y-4">
          <label className="block text-sm text-slate-300">
            Tên phòng chiếu
            <input
              required
              value={duLieu.tenPhong}
              onChange={(e) => datDuLieu((cu) => ({ ...cu, tenPhong: e.target.value }))}
              className="o-nhap mt-2"
              placeholder={goiYTenPhong(soPhongTrongRap)}
            />
          </label>

          {!phongSua && (
            <>
              <label className="block text-sm text-slate-300">
                Chi nhánh
                <select
                  required
                  value={duLieu.khuVuc}
                  onChange={(e) => thayDoiKhuVuc(e.target.value)}
                  className="o-nhap mt-2"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {danhSachKhuVuc.map((kv) => (
                    <option key={kv} value={kv}>{kv}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Rạp chiếu
                <select
                  required
                  value={duLieu.maRap}
                  onChange={(e) => datDuLieu((cu) => ({ ...cu, maRap: e.target.value }))}
                  className="o-nhap mt-2"
                >
                  <option value="">-- Chọn rạp --</option>
                  {danhSachRapLoc.map((rap) => (
                    <option key={rap.id} value={rap.id}>{rap.tenRap}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="block text-sm text-slate-300">
            Loại phòng chiếu
            <select
              value={duLieu.loaiPhong}
              onChange={(e) => datDuLieu((cu) => ({ ...cu, loaiPhong: e.target.value }))}
              className="o-nhap mt-2"
            >
              {LOAI_PHONG.map((loai) => (
                <option key={loai} value={loai}>{loai}</option>
              ))}
            </select>
          </label>

          {!phongSua && (
            <label className="block text-sm text-slate-300">
              Mẫu sơ đồ ghế
              <select
                value={duLieu.mauSoDoGhe}
                onChange={(e) => datDuLieu((cu) => ({ ...cu, mauSoDoGhe: e.target.value }))}
                className="o-nhap mt-2"
              >
                {DANH_SACH_MAU_SO_DO.map((mau) => (
                  <option key={mau.ma} value={mau.ma}>{mau.nhan}</option>
                ))}
              </select>
            </label>
          )}

          {thongBaoLoi && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{thongBaoLoi}</p>
          )}
        </AdminModalBody>

        <AdminModalFooter className="flex gap-3">
          <button type="button" onClick={onDong} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">
            Hủy
          </button>
          <button type="submit" className="nut-chinh flex-1 py-2.5 text-sm">
            {phongSua ? 'Cập nhật' : 'Thêm phòng'}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModalOverlay>
  )
}
