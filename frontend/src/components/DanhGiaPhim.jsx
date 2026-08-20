import { MessageCircle, Reply, Star, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  guiDanhGia,
  guiPhanHoiDanhGia,
  layDanhSachDanhGia,
  layTomTatDanhGia,
  xoaDanhGiaCuaToi,
  xoaPhanHoiDanhGia,
} from '../services/reviewService'
import { layThongBaoLoiApi } from '../utils/layThongBaoLoiApi'

function dinhDangNgay(giaTri) {
  if (!giaTri) return ''
  try {
    return new Date(giaTri).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function OPhanHoi({ maPhim, muc, nguoiDung, onCapNhat }) {
  const [mo, datMo] = useState(false)
  const [noiDung, datNoiDung] = useState('')
  const [dangGui, datDangGui] = useState(false)
  const [loi, datLoi] = useState('')
  const phanHoi = muc.phanHoi || []
  const soPhanHoi = muc.soPhanHoi ?? phanHoi.length

  const guiPhanHoi = async () => {
    if (!nguoiDung) {
      window.dispatchEvent(new Event('open-auth-modal'))
      return
    }
    const chuoi = noiDung.trim()
    if (!chuoi) return
    datDangGui(true)
    datLoi('')
    try {
      await guiPhanHoiDanhGia(maPhim, muc.id, chuoi)
      datNoiDung('')
      datMo(true)
      onCapNhat()
    } catch (e) {
      datLoi(layThongBaoLoiApi(e))
    } finally {
      datDangGui(false)
    }
  }

  const xoaPhanHoi = async (maPhanHoi) => {
    try {
      await xoaPhanHoiDanhGia(maPhim, muc.id, maPhanHoi)
      onCapNhat()
    } catch { /* bo qua */ }
  }

  const coTheXoaPhanHoi = (phanHoi) =>
    nguoiDung && (
      phanHoi.maNguoiDung === nguoiDung.id
      || muc.maNguoiDung === nguoiDung.id
      || nguoiDung.role === 'ADMIN'
    )

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <button
        type="button"
        onClick={() => datMo((c) => !c)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-fuchsia-300"
      >
        <MessageCircle size={14} />
        {soPhanHoi > 0 ? `${soPhanHoi} phản hồi` : 'Phản hồi'}
        {mo ? <X size={12} /> : <Reply size={12} />}
      </button>

      {mo && (
        <div className="mt-3 space-y-3">
          {phanHoi.length > 0 && (
            <ul className="space-y-2 pl-3 border-l-2 border-fuchsia-500/20">
              {phanHoi.map((ph) => (
                <li key={ph.id} className="rounded-lg bg-black/25 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200">{ph.hoTen}</p>
                      <p className="mt-0.5 text-sm text-slate-300">{ph.noiDung}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{dinhDangNgay(ph.ngayTao)}</p>
                    </div>
                    {coTheXoaPhanHoi(ph) && (
                      <button
                        type="button"
                        onClick={() => xoaPhanHoi(ph.id)}
                        className="shrink-0 rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Xóa phản hồi"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {nguoiDung ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={noiDung}
                onChange={(e) => datNoiDung(e.target.value)}
                maxLength={300}
                placeholder="Trả lời hoặc hỏi về bình luận này..."
                className="o-nhap flex-1 py-2 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guiPhanHoi() } }}
              />
              <button
                type="button"
                onClick={guiPhanHoi}
                disabled={dangGui || !noiDung.trim()}
                className="nut-chinh shrink-0 px-4 py-2 text-sm disabled:opacity-50"
              >
                {dangGui ? '...' : 'Gửi'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Đăng nhập để phản hồi bình luận.</p>
          )}
          {loi && <p className="text-xs text-red-300">{loi}</p>}
        </div>
      )}
    </div>
  )
}

export default function DanhGiaPhim({ maPhim }) {
  const { nguoiDung } = useAuth()
  const [tomTat, datTomTat] = useState({ diemTrungBinh: 0, soLuong: 0 })
  const [danhSach, datDanhSach] = useState([])
  const [diem, datDiem] = useState(5)
  const [noiDung, datNoiDung] = useState('')
  const [dangGui, datDangGui] = useState(false)
  const [loi, datLoi] = useState('')

  const tai = () => {
    layTomTatDanhGia(maPhim).then(datTomTat).catch(() => {})
    layDanhSachDanhGia(maPhim).then((phanHoi) => datDanhSach(phanHoi.content || phanHoi)).catch(() => datDanhSach([]))
  }

  useEffect(() => { if (maPhim) tai() }, [maPhim])

  const gui = async () => {
    if (!nguoiDung) {
      window.dispatchEvent(new Event('open-auth-modal'))
      return
    }
    datDangGui(true)
    datLoi('')
    try {
      await guiDanhGia(maPhim, { diem, noiDung: noiDung.trim() })
      datNoiDung('')
      tai()
    } catch (e) {
      datLoi(layThongBaoLoiApi(e))
    } finally {
      datDangGui(false)
    }
  }

  const xoa = async () => {
    try {
      await xoaDanhGiaCuaToi(maPhim)
      tai()
    } catch { /* bo qua */ }
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">Đánh giá & bình luận</h2>
      <div className="mt-2 flex items-center gap-2 text-amber-300">
        <Star size={20} fill="currentColor" />
        <span className="text-2xl font-black">{tomTat.diemTrungBinh?.toFixed(1) || '0.0'}</span>
        <span className="text-sm text-slate-400">({tomTat.soLuong || 0} lượt)</span>
      </div>

      {nguoiDung && (
        <div className="mt-6 rounded-xl border border-white/10 bg-cinema-900/50 p-4">
          <p className="text-sm text-slate-400">Chọn số sao và viết cảm nhận</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => datDiem(s)} className="p-1">
                <Star size={22} className={s <= diem ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
              </button>
            ))}
          </div>
          <textarea
            value={noiDung}
            onChange={(e) => datNoiDung(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Chia sẻ cảm nhận về phim..."
            className="o-nhap mt-3 w-full"
          />
          {loi && <p className="mt-2 text-sm text-red-300">{loi}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={gui} disabled={dangGui} className="nut-chinh px-4 py-2 text-sm">
              {dangGui ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
            <button type="button" onClick={xoa} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white">
              Xóa đánh giá của tôi
            </button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {danhSach.map((muc) => (
          <li key={muc.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{muc.hoTen}</p>
                <p className="text-[10px] text-slate-500">{dinhDangNgay(muc.ngayTao)}</p>
              </div>
              <span className="text-amber-300 text-sm">{'★'.repeat(muc.diem)}</span>
            </div>
            {muc.noiDung && <p className="mt-2 text-sm text-slate-300">{muc.noiDung}</p>}
            <OPhanHoi maPhim={maPhim} muc={muc} nguoiDung={nguoiDung} onCapNhat={tai} />
          </li>
        ))}
        {danhSach.length === 0 && <p className="text-sm text-slate-500">Chưa có đánh giá — hãy là người đầu tiên!</p>}
      </ul>
    </section>
  )
}
