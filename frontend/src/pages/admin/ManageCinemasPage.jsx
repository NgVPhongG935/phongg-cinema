import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { layDanhSachKhuVucDayDu } from '../../services/regionService'
import { layDanhSachRap, taoMuoiPhongMacDinh, themRapMoi, capNhatRap } from '../../services/cinemaService'
import { timToaDoThongMinh } from '../../services/geocodingService'
import { MAC_DINH_PHAN_TRAM_COUPLE, MAC_DINH_PHAN_TRAM_VIP } from '../../utils/tinhGiaVe'
const PHONG_MAC_DINH = taoMuoiPhongMacDinh()

export default function ManageCinemasPage() {
  const [danhSachKhuVuc, datDanhSachKhuVuc] = useState([])
  const [danhSachRap, datDanhSachRap] = useState([])
  const [duLieu, datDuLieu] = useState({ khuVuc: '', tenRap: '', diaChi: '', viDo: '', kinhDo: '' })
  const [dangSuaRap, datDangSuaRap] = useState(null)
  const [phanTramSua, datPhanTramSua] = useState({ phanTramGheVip: MAC_DINH_PHAN_TRAM_VIP, phanTramGheCouple: MAC_DINH_PHAN_TRAM_COUPLE })
  const [thongBao, datThongBao] = useState('')
  const [dangLayGps, datDangLayGps] = useState(false)
  const [thongBaoGps, datThongBaoGps] = useState('')

  const taiDuLieu = () => {
    layDanhSachKhuVucDayDu().then((danhSach) => datDanhSachKhuVuc(danhSach.map((m) => m.tenKhuVuc)))
    layDanhSachRap().then(datDanhSachRap)
  }

  useEffect(() => { taiDuLieu() }, [])

  const xuLyThayDoi = (suKien) => datDuLieu((cu) => ({ ...cu, [suKien.target.name]: suKien.target.value }))

  const layToaDoTuDong = async () => {
    const diaChi = duLieu.diaChi.trim()
    if (!diaChi) {
      datThongBaoGps('Vui lòng nhập địa chỉ rạp trước!')
      return
    }
    datDangLayGps(true)
    datThongBaoGps('')
    try {
      const ketQua = await timToaDoThongMinh(duLieu.tenRap.trim(), diaChi)
      if (!ketQua) {
        datThongBaoGps('Không tìm thấy tọa độ, vui lòng kiểm tra lại địa chỉ!')
        return
      }
      datDuLieu((cu) => ({ ...cu, viDo: ketQua.lat, kinhDo: ketQua.lon }))
      datThongBaoGps(`Đã lấy tọa độ GPS thành công (cấp ${ketQua.capDo}).`)
    } catch {
      datThongBaoGps('Không thể xác định tọa độ. Vui lòng thử lại sau.')
    } finally {
      datDangLayGps(false)
    }
  }

  const luuPhanTramRap = async (rap) => {
    try {
      await capNhatRap(rap.id, {
        phanTramGheVip: Number(phanTramSua.phanTramGheVip),
        phanTramGheCouple: Number(phanTramSua.phanTramGheCouple),
      })
      datThongBao(`Đã cập nhật % phụ thu cho ${rap.tenRap}.`)
      datDangSuaRap(null)
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể cập nhật % phụ thu.')
    }
  }

  const batDauSuaPhanTram = (rap) => {
    datDangSuaRap(rap.id)
    datPhanTramSua({
      phanTramGheVip: rap.phanTramGheVip ?? MAC_DINH_PHAN_TRAM_VIP,
      phanTramGheCouple: rap.phanTramGheCouple ?? MAC_DINH_PHAN_TRAM_COUPLE,
    })
  }

  const themRap = async (suKien) => {
    suKien.preventDefault()
    try {
      await themRapMoi({
        ...duLieu,
        khuVuc: duLieu.khuVuc.trim(),
        viDo: duLieu.viDo ? Number(duLieu.viDo) : null,
        kinhDo: duLieu.kinhDo ? Number(duLieu.kinhDo) : null,
        danhSachPhong: PHONG_MAC_DINH,
      })
      datThongBao('Thêm rạp thành công.')
      datThongBaoGps('')
      datDuLieu({ khuVuc: '', tenRap: '', diaChi: '', viDo: '', kinhDo: '' })
      taiDuLieu()
    } catch (loi) {
      datThongBao(loi.response?.data?.message || 'Không thể thêm rạp.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-3xl font-black">Quản lý rạp</h1>
        <p className="mt-1 text-slate-400">Thêm rạp theo khu vực — mỗi rạp mới tự tạo 10 phòng chiếu</p>
      </div>

      <form onSubmit={themRap} className="the-kinh mt-8 space-y-4 p-6">
        <label className="block text-sm text-slate-300">
          Khu vực
          <select required name="khuVuc" value={duLieu.khuVuc} onChange={xuLyThayDoi} className="o-nhap mt-2">
            <option value="">Chọn khu vực</option>
            {danhSachKhuVuc.map((muc) => <option key={muc} value={muc}>{muc}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Quản lý khu vực tại mục Khu vực trong admin.</p>
        </label>
        <label className="block text-sm text-slate-300">
          Tên rạp
          <input required name="tenRap" value={duLieu.tenRap} onChange={xuLyThayDoi} className="o-nhap mt-2" />
        </label>
        <label className="block text-sm text-slate-300">
          Địa chỉ
          <input required name="diaChi" value={duLieu.diaChi} onChange={xuLyThayDoi} className="o-nhap mt-2" />
        </label>
        <div>
          <button
            type="button"
            onClick={layToaDoTuDong}
            disabled={dangLayGps}
            className="rounded-xl border border-cinema-500/40 bg-cinema-500/10 px-4 py-2.5 text-sm font-semibold text-cinema-300 transition hover:bg-cinema-500/20 disabled:opacity-50"
          >
            {dangLayGps ? '⏳ Đang lấy tọa độ...' : '📍 Lấy tọa độ tự động'}
          </button>
          {thongBaoGps && (
            <p className={`mt-2 text-sm ${thongBaoGps.includes('thành công') ? 'text-emerald-400' : 'text-amber-300'}`}>
              {thongBaoGps}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Vĩ độ (GPS)
            <input name="viDo" type="number" step="any" value={duLieu.viDo} onChange={xuLyThayDoi} className="o-nhap mt-2" placeholder="10.7769" />
          </label>
          <label className="block text-sm text-slate-300">
            Kinh độ (GPS)
            <input name="kinhDo" type="number" step="any" value={duLieu.kinhDo} onChange={xuLyThayDoi} className="o-nhap mt-2" placeholder="106.7018" />
          </label>
        </div>
        <p className="text-xs text-slate-500">Tọa độ GPS giúp khách tìm rạp gần nhất. Bấm nút trên để tự lấy từ địa chỉ.</p>
        {thongBao && <p className="text-sm text-cinema-500">{thongBao}</p>}
        <button className="nut-chinh flex items-center gap-2"><Building2 size={18} />Thêm rạp</button>
      </form>

      <div className="the-kinh mt-8 p-6">
        <h2 className="text-lg font-bold">Danh sách rạp ({danhSachRap.length})</h2>
        <div className="mt-4 space-y-3">
          {danhSachRap.map((rap) => (
            <div key={rap.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">{rap.tenRap}</p>
              <p className="mt-1 text-sm text-cinema-400">{rap.khuVuc || 'Chưa phân khu vực'}</p>
              <p className="mt-1 text-sm text-slate-400">{rap.diaChi}</p>
              {(rap.viDo != null && rap.kinhDo != null) && (
                <p className="mt-1 text-xs text-slate-500">GPS: {rap.viDo}, {rap.kinhDo}</p>
              )}
              <p className="mt-2 text-xs text-cinema-400">{rap.danhSachPhong?.length || 0} phòng · <Link to="/admin/rooms" className="hover:underline">Quản lý phòng</Link></p>
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                <p className="text-slate-300">Phụ thu ghế: VIP +{rap.phanTramGheVip ?? MAC_DINH_PHAN_TRAM_VIP}% · Ghế đôi +{rap.phanTramGheCouple ?? MAC_DINH_PHAN_TRAM_COUPLE}%</p>
                {dangSuaRap === rap.id ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-400">
                      % VIP
                      <input type="number" min="0" max="200" value={phanTramSua.phanTramGheVip} onChange={(e) => datPhanTramSua((cu) => ({ ...cu, phanTramGheVip: e.target.value }))} className="o-nhap mt-1" />
                    </label>
                    <label className="text-xs text-slate-400">
                      % Ghế đôi
                      <input type="number" min="0" max="300" value={phanTramSua.phanTramGheCouple} onChange={(e) => datPhanTramSua((cu) => ({ ...cu, phanTramGheCouple: e.target.value }))} className="o-nhap mt-1" />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" onClick={() => luuPhanTramRap(rap)} className="nut-chinh text-xs px-3 py-1.5">Lưu</button>
                      <button type="button" onClick={() => datDangSuaRap(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => batDauSuaPhanTram(rap)} className="mt-2 text-xs text-cinema-400 hover:underline">Sửa % phụ thu</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
