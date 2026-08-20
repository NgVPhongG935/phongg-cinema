import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from '../../components/admin/AdminModalOverlay'
import AnhPosterPhim from '../../components/AnhPosterPhim'
import { CheckCircle2, Copy, Loader2, Pencil, Play, Plus, Search, Sparkles, StopCircle, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { taoThongTinPhimAi } from '../../services/aiService'
import { capNhatPhim, layDanhSachPhim, themPhim, xoaPhim } from '../../services/movieService'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'

const duLieuRong = {
  title: '',
  duration: '',
  genres: '',
  actors: '',
  director: '',
  language: 'Tiếng Việt',
  ageRating: 'P',
  description: '',
  posterUrl: '',
  trailerUrl: '',
  status: 'SHOWING',
}

const GIOI_HAN_TUOI_HOP_LE = ['P', 'T13', 'T16', 'T18']

function chuanHoaGioiHanTuoi(giaTri) {
  if (!giaTri) return ''
  const s = String(giaTri).trim().toUpperCase()
  if (GIOI_HAN_TUOI_HOP_LE.includes(s)) return s
  if (s === 'K' || s === '0') return 'P'
  if (s.includes('13') || s === 'C13') return 'T13'
  if (s.includes('16') || s === 'C16') return 'T16'
  if (s.includes('18') || s === 'C18') return 'T18'
  return s
}
const TAB_TRANG_THAI = [
  { ma: 'SHOWING', nhan: 'Đang chiếu' },
  { ma: 'UPCOMING', nhan: 'Sắp chiếu' },
  { ma: '', nhan: 'Tất cả' },
]

function NhanTruong({ htmlFor, tieuDe, batBuoc = false, children, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm ${className}`}>
      <span className="mb-2 block font-medium text-slate-300">
        {tieuDe}{batBuoc && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  )
}

export default function ManageMoviesPage() {
  const [danhSachPhim, datDanhSachPhim] = useState([])
  const [tuKhoa, datTuKhoa] = useState('')
  const [tabTrangThai, datTabTrangThai] = useState('SHOWING')
  const [dangMo, datDangMo] = useState(false)
  const [phimSua, datPhimSua] = useState(null)
  const [duLieu, datDuLieu] = useState(duLieuRong)
  const [dangLuu, datDangLuu] = useState(false)
  const [dangSoanAi, datDangSoanAi] = useState(false)
  const [thongBaoModal, datThongBaoModal] = useState(null)
  const [thongBao, datThongBao] = useState(null)

  // State cho Tiến Trình AI Đồng Bộ Tuần Tự
  const [hienModalTienDo, datHienModalTienDo] = useState(false)
  const [tienDo, datTienDo] = useState({
    dangChay: false,
    tongSo: 0,
    daXong: 0,
    phanTram: 0,
    phimHienTai: '',
    danhSachLog: [],
  })
  const dungTienDoRef = useRef(false)
  const khungLogRef = useRef(null)

  const taiDanhSach = (tuKhoaTim = tuKhoa, trangThai = tabTrangThai) => layDanhSachPhim({
    size: 100,
    ...(tuKhoaTim.trim() ? { tuKhoa: tuKhoaTim.trim() } : {}),
    ...(trangThai ? { trangThai } : {}),
  }).then((phanHoi) => datDanhSachPhim(phanHoi.content || phanHoi)).catch(() => datDanhSachPhim([]))

  useEffect(() => {
    const hen = setTimeout(() => { taiDanhSach(tuKhoa, tabTrangThai) }, tuKhoa.trim() ? 300 : 0)
    return () => clearTimeout(hen)
  }, [tuKhoa, tabTrangThai])

  useEffect(() => {
    if (khungLogRef.current) {
      khungLogRef.current.scrollTop = khungLogRef.current.scrollHeight
    }
  }, [tienDo.danhSachLog])

  const saoChepMa = async (maPhim) => {
    try {
      await navigator.clipboard.writeText(maPhim)
      datThongBao({ loai: 'thanhCong', noiDung: 'Đã sao chép mã phim!' })
      setTimeout(() => datThongBao(null), 2000)
    } catch {
      datThongBao({ loai: 'loi', noiDung: 'Không sao chép được mã phim.' })
    }
  }

  const moBieuMau = (phim = null) => {
    datPhimSua(phim)
    datThongBao(null)
    datThongBaoModal(null)
    datDuLieu(phim ? {
      ...phim,
      title: phim.title || '',
      duration: phim.duration ?? '',
      genres: Array.isArray(phim.genres) ? phim.genres.join(', ') : (phim.genres || ''),
      actors: Array.isArray(phim.actors) ? phim.actors.join(', ') : (phim.actors || ''),
      director: phim.director || '',
      language: phim.language || 'Tiếng Việt',
      ageRating: chuanHoaGioiHanTuoi(phim.ageRating) || 'P',
      description: phim.description || '',
      posterUrl: phim.posterUrl || '',
      trailerUrl: phim.trailerUrl || '',
      status: phim.status || 'SHOWING',
    } : duLieuRong)
    datDangMo(true)
  }

  const chuanHoaDuLieuGui = () => ({
    title: duLieu.title.trim(),
    duration: Number(duLieu.duration),
    genres: String(duLieu.genres || '').split(',').map((muc) => muc.trim()).filter(Boolean),
    actors: String(duLieu.actors || '').split(',').map((muc) => muc.trim()).filter(Boolean),
    director: String(duLieu.director || '').trim(),
    language: duLieu.language.trim(),
    ageRating: String(duLieu.ageRating).trim(),
    description: duLieu.description.trim(),
    posterUrl: duLieu.posterUrl.trim(),
    trailerUrl: duLieu.trailerUrl.trim(),
    status: duLieu.status || 'SHOWING',
  })

  const luuPhim = async (suKien) => {
    suKien.preventDefault()
    if (dangLuu) return
    datDangLuu(true)
    datThongBao(null)
    try {
      const duLieuGui = chuanHoaDuLieuGui()
      if (!duLieuGui.title || !duLieuGui.duration || duLieuGui.genres.length === 0) {
        throw new Error('Vui lòng nhập đầy đủ tên phim, thời lượng và thể loại.')
      }
      if (!duLieuGui.ageRating) {
        throw new Error('Vui lòng chọn giới hạn tuổi.')
      }
      if (phimSua) await capNhatPhim(phimSua.id || phimSua._id, duLieuGui)
      else await themPhim(duLieuGui)
      datThongBao({ loai: 'thanhCong', noiDung: phimSua ? 'Cập nhật phim thành công!' : 'Thêm phim mới thành công!' })
      datDangMo(false)
      await taiDanhSach()
    } catch (loi) {
      const noiDung = loi.response?.data?.message || loi.message || 'Không thể lưu phim. Vui lòng thử lại.'
      datThongBao({ loai: 'loi', noiDung })
    } finally {
      datDangLuu(false)
    }
  }

  const xoaMotPhim = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phim này? Hành động này không thể hoàn tác.')) return
    try {
      await xoaPhim(id)
      datThongBao({ loai: 'thanhCong', noiDung: 'Đã xóa phim thành công!' })
      await taiDanhSach()
    } catch (loi) {
      datThongBao({ loai: 'loi', noiDung: layThongBaoLoiApi(loi) })
    }
  }

  const xuLyThayDoi = (suKien) => {
    const { name, value } = suKien.target
    datDuLieu((cu) => ({
      ...cu,
      [name]: name === 'ageRating' ? chuanHoaGioiHanTuoi(value) : value,
    }))
  }

  /**
   * Logic Xử Lý Đồng Bộ Tuần Tự Từng Phim (Sequential Auto-Sync)
   */
  const xuLyDongBoTuTuTungPhim = async () => {
    if (tienDo.dangChay) return
    dungTienDoRef.current = false

    // Lấy toàn bộ phim hiện có
    let danhSach = danhSachPhim
    try {
      const phanHoi = await layDanhSachPhim({ size: 200 })
      danhSach = phanHoi.content || phanHoi || danhSachPhim
    } catch {
      // Giữ danhSachPhim hiện tại
    }

    if (!danhSach || danhSach.length === 0) {
      datThongBao({ loai: 'canhBao', noiDung: 'Không có phim nào trong cơ sở dữ liệu để đồng bộ.' })
      return
    }

    const tongSo = danhSach.length
    datTienDo({
      dangChay: true,
      tongSo,
      daXong: 0,
      phanTram: 0,
      phimHienTai: '',
      danhSachLog: [`🚀 Bắt đầu quy trình AI cập nhật tự động cho ${tongSo} bộ phim...`],
    })
    datHienModalTienDo(true)

    let daXongDem = 0
    let soLuongThanhCong = 0

    for (let i = 0; i < tongSo; i++) {
      if (dungTienDoRef.current) {
        datTienDo((cu) => ({
          ...cu,
          dangChay: false,
          danhSachLog: [...cu.danhSachLog, `⚠️ Quản trị viên đã dừng tiến trình (${daXongDem}/${tongSo} phim).`],
        }))
        break
      }

      const phim = danhSach[i]
      const idPhim = phim.id || phim._id
      const title = phim.title || `Phim #${i + 1}`

      datTienDo((cu) => ({
        ...cu,
        phimHienTai: title,
        danhSachLog: [...cu.danhSachLog, `⏳ [${i + 1}/${tongSo}] Đang AI tìm thông tin cho: «${title}»...`],
      }))

      try {
        // Bước 1: Gọi AI soạn thông tin
        const thongTinAi = await taoThongTinPhimAi(title)

        // Bước 2: Chuẩn bị payload chuẩn tiếng Anh để lưu vào DB
        const duLieuCapNhat = {
          ...phim,
          title: thongTinAi.title || title,
          duration: Number(thongTinAi.duration ?? phim.duration ?? 120),
          genres: Array.isArray(thongTinAi.genres)
            ? thongTinAi.genres
            : String(thongTinAi.genre || '').split(',').map((s) => s.trim()).filter(Boolean),
          actors: Array.isArray(thongTinAi.actors)
            ? thongTinAi.actors
            : String(thongTinAi.actors || '').split(',').map((s) => s.trim()).filter(Boolean),
          director: thongTinAi.director || phim.director || '',
          language: thongTinAi.language || phim.language || 'Tiếng Việt',
          ageRating: chuanHoaGioiHanTuoi(thongTinAi.ageRating) || phim.ageRating || 'P',
          description: thongTinAi.description || phim.description || '',
          posterUrl: thongTinAi.posterUrl || phim.posterUrl || '',
          trailerUrl: thongTinAi.trailerUrl || phim.trailerUrl || '',
          status: phim.status || 'SHOWING',
          rating: Number(thongTinAi.rating ?? phim.rating ?? 8.5),
        }

        // Bước 3: GỌI API LƯU VÀO DATABASE
        if (idPhim) {
          await capNhatPhim(idPhim, duLieuCapNhat)
        }

        // Cập nhật ngay lập tức vào state để UI thay đổi trực tiếp
        datDanhSachPhim((cu) =>
          cu.map((p) => ((p.id === idPhim || p._id === idPhim) ? { ...p, ...duLieuCapNhat, id: idPhim } : p))
        )

        soLuongThanhCong++
        daXongDem++

        datTienDo((cu) => ({
          ...cu,
          daXong: daXongDem,
          phanTram: Math.round((daXongDem / tongSo) * 100),
          danhSachLog: [
            ...cu.danhSachLog,
            `✅ [${i + 1}/${tongSo}] Đã lưu vào DB: «${title}» (Poster: ${duLieuCapNhat.posterUrl ? 'OK' : '—'}, Trailer: ${duLieuCapNhat.trailerUrl ? 'OK' : '—'})`,
          ],
        }))
      } catch (loi) {
        daXongDem++
        console.error(`Lỗi cập nhật phim ${title}:`, loi)
        datTienDo((cu) => ({
          ...cu,
          daXong: daXongDem,
          phanTram: Math.round((daXongDem / tongSo) * 100),
          danhSachLog: [
            ...cu.danhSachLog,
            `❌ [${i + 1}/${tongSo}] Bỏ qua lỗi tại «${title}»: ${layThongBaoLoiApi(loi)}`,
          ],
        }))
      }

      // Bước 4: Delay 1.5 giây tránh rate limit
      if (i < tongSo - 1 && !dungTienDoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    }

    datTienDo((cu) => ({
      ...cu,
      dangChay: false,
      phimHienTai: '',
      danhSachLog: [
        ...cu.danhSachLog,
        `🎉 Hoàn thành! Đã cập nhật và lưu vào DB ${soLuongThanhCong}/${tongSo} bộ phim.`,
      ],
    }))

    await taiDanhSach()
  }

  const dungTienDo = () => {
    dungTienDoRef.current = true
    datTienDo((cu) => ({
      ...cu,
      dangChay: false,
      danhSachLog: [...cu.danhSachLog, '🛑 Đang gửi tín hiệu dừng...'],
    }))
  }

  const soanThongTinAi = async () => {
    const title = duLieu.title.trim()
    if (!title) {
      datThongBaoModal({ loai: 'loi', noiDung: 'Vui lòng nhập tên phim trước khi dùng AI.' })
      return
    }

    datDangSoanAi(true)
    datThongBaoModal(null)
    try {
      const thongTin = await taoThongTinPhimAi(title)
      datDuLieu((cu) => ({
        ...cu,
        duration: thongTin.duration ?? cu.duration,
        genres: Array.isArray(thongTin.genres) ? thongTin.genres.join(', ') : (thongTin.genre || cu.genres),
        actors: Array.isArray(thongTin.actors) ? thongTin.actors.join(', ') : (thongTin.actors || cu.actors),
        director: thongTin.director || cu.director,
        ageRating: chuanHoaGioiHanTuoi(thongTin.ageRating) || cu.ageRating,
        description: thongTin.description || cu.description,
        posterUrl: thongTin.posterUrl || cu.posterUrl,
        trailerUrl: thongTin.trailerUrl || cu.trailerUrl,
      }))
      const canhBao = thongTin.canhBao
      datThongBaoModal({
        loai: canhBao ? 'canhBao' : 'thanhCong',
        noiDung: canhBao || 'AI đã tự động soạn thông tin phim thành công!',
      })
    } catch (loi) {
      datThongBaoModal({ loai: 'loi', noiDung: layThongBaoLoiApi(loi) })
    } finally {
      datDangSoanAi(false)
    }
  }

  return (
    <div>
      {thongBao && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
          thongBao.loai === 'thanhCong'
            ? 'bg-emerald-500/20 text-emerald-300'
            : thongBao.loai === 'thongTin'
              ? 'bg-sky-500/20 text-sky-300'
              : 'bg-rose-500/20 text-rose-300'
        }`}>
          {thongBao.noiDung}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Quản lý phim</h1>
          <p className="mt-1 text-slate-400">Cập nhật kho phim của rạp</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={xuLyDongBoTuTuTungPhim}
            disabled={tienDo.dangChay}
            className="flex items-center gap-2 rounded-xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 px-4 py-2.5 text-sm font-bold text-fuchsia-200 shadow-lg shadow-fuchsia-500/20 backdrop-blur-md transition hover:scale-105 hover:border-fuchsia-400 hover:from-fuchsia-600/50 hover:to-violet-600/50 disabled:opacity-50"
            title="AI chạy tuần tự từng phim: cập nhật Poster, Trailer YouTube chuẩn, Diễn viên và Mô tả"
          >
            {tienDo.dangChay ? (
              <>
                <Loader2 size={18} className="animate-spin text-fuchsia-300" />
                <span>Đang xử lý ({tienDo.daXong}/{tienDo.tongSo})...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-yellow-300 animate-pulse" />
                <span>⚡ AI Tự Động Cập Nhật Full Phim</span>
              </>
            )}
          </button>
          <button onClick={() => moBieuMau()} className="nut-chinh flex items-center gap-2">
            <Plus size={18} />Thêm phim
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-xl bg-white/5 p-1">
          {TAB_TRANG_THAI.map((tab) => (
            <button
              key={tab.ma || 'ALL'}
              type="button"
              onClick={() => datTabTrangThai(tab.ma)}
              className={`rounded-lg px-4 py-2 text-sm transition ${tabTrangThai === tab.ma ? 'bg-cinema-500 font-semibold text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.nhan}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">{danhSachPhim.length} phim</p>
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={tuKhoa}
          onChange={(suKien) => datTuKhoa(suKien.target.value)}
          className="o-nhap w-full pl-11"
          placeholder="Tìm theo tên phim, diễn viên, đạo diễn..."
        />
      </div>

      <div className="admin-table-panel mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="p-4">Mã phim</th>
              <th className="p-4">Phim</th>
              <th>Thời lượng</th>
              <th>Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {danhSachPhim.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {tuKhoa.trim()
                    ? 'Không tìm thấy phim phù hợp.'
                    : tabTrangThai === 'UPCOMING'
                      ? 'Chưa có phim sắp chiếu.'
                      : tabTrangThai === 'SHOWING'
                        ? 'Chưa có phim đang chiếu.'
                        : 'Chưa có phim nào.'}
                </td>
              </tr>
            ) : danhSachPhim.map((phim) => {
              const title = phim.title || ''
              const genres = phim.genres || []
              const actors = phim.actors || []
              const duration = phim.duration
              const status = phim.status

              return (
                <tr key={phim.id} className="border-t border-white/10">
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => saoChepMa(phim.id)}
                      title={`Sao chép: ${phim.id}`}
                      className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10"
                    >
                      <span className="max-w-[9rem] truncate">{phim.id}</span>
                      <Copy size={13} className="shrink-0 opacity-60 group-hover:opacity-100" />
                    </button>
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {title}
                    {genres.length > 0 && <p className="mt-1 text-xs font-normal text-slate-500">{genres.join(', ')}</p>}
                    {actors.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">Diễn viên: {actors.slice(0, 3).join(', ')}</p>
                    )}
                  </td>
                  <td className="p-4 text-slate-300">{duration} phút</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs ${status === 'SHOWING' ? 'bg-cinema-500/20 text-cinema-500' : 'bg-fuchsia-500/20 text-fuchsia-300'}`}>
                      {status === 'SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => moBieuMau(phim)} className="rounded-lg border border-violet-400/30 p-2 text-violet-200 hover:bg-violet-500/10"><Pencil size={17} /></button>
                      <button onClick={() => xoaMotPhim(phim.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL TIẾN TRÌNH AI ĐỒNG BỘ TUẦN TỰ (PROGRESS MODAL) */}
      {hienModalTienDo && (
        <AdminModalOverlay onBackdropClick={() => !tienDo.dangChay && datHienModalTienDo(false)}>
          <div className="admin-modal-panel max-w-2xl">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
                    {tienDo.dangChay ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Sparkles size={20} className="text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">⚡ AI Tự Động Cập Nhật Toàn Bộ Phim</h2>
                    <p className="text-xs text-slate-400">Quy trình chạy tuần tự từng phim tránh Rate Limit</p>
                  </div>
                </div>

                {!tienDo.dangChay && (
                  <button
                    type="button"
                    onClick={() => datHienModalTienDo(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </AdminModalHeader>

            <AdminModalBody>
              <div className="space-y-4">
                {/* Thanh Progress Bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      {tienDo.dangChay
                        ? `Đang cập nhật: ${tienDo.phimHienTai || '...'}`
                        : tienDo.daXong === tienDo.tongSo && tienDo.tongSo > 0
                          ? 'Đã hoàn thành toàn bộ phim!'
                          : 'Tiến trình đã dừng'}
                    </span>
                    <span className="font-mono font-bold text-fuchsia-300">
                      {tienDo.daXong} / {tienDo.tongSo} ({tienDo.phanTram}%)
                    </span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-violet-500 to-cyan-400 shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all duration-500 ease-out"
                      style={{ width: `${tienDo.phanTram}%` }}
                    />
                  </div>
                </div>

                {/* Khung Console Log Realtime */}
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nhật ký xử lý trực tiếp (Realtime Logs)
                  </p>
                  <div
                    ref={khungLogRef}
                    className="h-60 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs leading-relaxed text-slate-300 shadow-inner"
                  >
                    {tienDo.danhSachLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={`py-0.5 ${
                          log.startsWith('✅')
                            ? 'text-emerald-300'
                            : log.startsWith('❌')
                              ? 'text-rose-300'
                              : log.startsWith('⚠️') || log.startsWith('🛑')
                                ? 'text-amber-300'
                                : log.startsWith('🎉')
                                  ? 'font-bold text-cyan-300'
                                  : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AdminModalBody>

            <AdminModalFooter>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {tienDo.dangChay ? 'Giữ cửa sổ này mở trong khi AI đang chạy' : 'Tiến trình đã kết thúc'}
                </span>

                <div className="flex gap-2">
                  {tienDo.dangChay ? (
                    <button
                      type="button"
                      onClick={dungTienDo}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30"
                    >
                      <StopCircle size={15} />
                      Dừng lại
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => datHienModalTienDo(false)}
                      className="nut-chinh px-5 py-2 text-xs font-bold"
                    >
                      Đóng
                    </button>
                  )}
                </div>
              </div>
            </AdminModalFooter>
          </div>
        </AdminModalOverlay>
      )}

      {dangMo && (
        <AdminModalOverlay onBackdropClick={() => datDangMo(false)}>
          <form onSubmit={luuPhim} className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{phimSua ? 'Cập nhật phim' : 'Thêm phim mới'}</h2>
                  {phimSua?.id && (
                    <p className="mt-1 font-mono text-xs text-slate-400">Mã phim: {phimSua.id}</p>
                  )}
                </div>
                <button type="button" onClick={() => datDangMo(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X /></button>
              </div>
            </AdminModalHeader>

            <AdminModalBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <NhanTruong htmlFor="title" tieuDe="Tên phim" batBuoc className="sm:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id="title"
                    name="title"
                    value={duLieu.title}
                    onChange={xuLyThayDoi}
                    className="o-nhap flex-1"
                    placeholder="Ví dụ: Moana 2"
                    required
                  />
                  <button
                    type="button"
                    onClick={soanThongTinAi}
                    disabled={dangSoanAi}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/20 px-4 py-2.5 text-sm font-semibold text-fuchsia-200 shadow-sm transition hover:bg-fuchsia-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dangSoanAi ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-fuchsia-300" />
                        <span>Đang tra cứu…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-fuchsia-300" />
                        <span>AI soạn thông tin</span>
                      </>
                    )}
                  </button>
                </div>
              </NhanTruong>

              {thongBaoModal && (
                <div
                  className={`sm:col-span-2 rounded-xl border px-4 py-3 text-sm ${
                    thongBaoModal.loai === 'canhBao'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                      : thongBaoModal.loai === 'thanhCong'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {thongBaoModal.noiDung}
                </div>
              )}

              <NhanTruong htmlFor="duration" tieuDe="Thời lượng (phút)" batBuoc>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={duLieu.duration}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="120"
                  required
                />
              </NhanTruong>

              <NhanTruong htmlFor="ageRating" tieuDe="Giới hạn tuổi" batBuoc>
                <select
                  id="ageRating"
                  name="ageRating"
                  value={duLieu.ageRating}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  required
                >
                  <option value="P">P — Mọi độ tuổi</option>
                  <option value="T13">T13 — Từ 13 tuổi trở lên</option>
                  <option value="T16">T16 — Từ 16 tuổi trở lên</option>
                  <option value="T18">T18 — Từ 18 tuổi trở lên</option>
                </select>
              </NhanTruong>

              <NhanTruong htmlFor="genres" tieuDe="Thể loại (cách nhau bởi dấu phẩy)" batBuoc className="sm:col-span-2">
                <input
                  id="genres"
                  name="genres"
                  value={duLieu.genres}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="Hành động, Phiêu lưu, Hoạt hình"
                  required
                />
              </NhanTruong>

              <NhanTruong htmlFor="actors" tieuDe="Diễn viên (cách nhau bởi dấu phẩy)" className="sm:col-span-2">
                <input
                  id="actors"
                  name="actors"
                  value={duLieu.actors}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="Auli'i Cravalho, Dwayne Johnson"
                />
              </NhanTruong>

              <NhanTruong htmlFor="director" tieuDe="Đạo diễn">
                <input
                  id="director"
                  name="director"
                  value={duLieu.director}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="David Derrick Jr."
                />
              </NhanTruong>

              <NhanTruong htmlFor="language" tieuDe="Ngôn ngữ">
                <input
                  id="language"
                  name="language"
                  value={duLieu.language}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="Tiếng Anh - Phụ đề Tiếng Việt"
                />
              </NhanTruong>

              <NhanTruong htmlFor="posterUrl" tieuDe="Đường dẫn Poster (URL)" className="sm:col-span-2">
                <input
                  id="posterUrl"
                  name="posterUrl"
                  value={duLieu.posterUrl}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                />
                {duLieu.posterUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      <AnhPosterPhim src={duLieu.posterUrl} alt="Xem trước poster" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs text-slate-400">Xem trước poster</span>
                  </div>
                )}
              </NhanTruong>

              <NhanTruong htmlFor="trailerUrl" tieuDe="Đường dẫn Trailer YouTube (URL)" className="sm:col-span-2">
                <input
                  id="trailerUrl"
                  name="trailerUrl"
                  value={duLieu.trailerUrl}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </NhanTruong>

              <NhanTruong htmlFor="status" tieuDe="Trạng thái chiếu" className="sm:col-span-2">
                <select
                  id="status"
                  name="status"
                  value={duLieu.status}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                >
                  <option value="SHOWING">Đang chiếu</option>
                  <option value="UPCOMING">Sắp chiếu</option>
                </select>
              </NhanTruong>

              <NhanTruong htmlFor="description" tieuDe="Mô tả nội dung" className="sm:col-span-2">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={duLieu.description}
                  onChange={xuLyThayDoi}
                  className="o-nhap w-full"
                  placeholder="Tóm tắt nội dung phim..."
                />
              </NhanTruong>
            </div>
            </AdminModalBody>

            <AdminModalFooter>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => datDangMo(false)} className="rounded-xl border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/5">Hủy</button>
                <button type="submit" disabled={dangLuu} className="nut-chinh">
                  {dangLuu ? 'Đang lưu…' : phimSua ? 'Cập nhật' : 'Thêm phim'}
                </button>
              </div>
            </AdminModalFooter>
          </form>
        </AdminModalOverlay>
      )}
    </div>
  )
}
