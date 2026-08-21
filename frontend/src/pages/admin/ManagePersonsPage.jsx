import {
  AlertTriangle,
  Calendar,
  Edit2,
  Film,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminModalOverlay, {
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
} from '../../components/admin/AdminModalOverlay'
import apiClient from '../../services/apiClient'
import { hienThongBaoLoi, hienThongBaoThanhCong } from '../../utils/hienThongBao'

export default function ManagePersonsPage() {
  const [danhSach, datDanhSach] = useState([])
  const [dangTai, datDangTai] = useState(true)
  const [tuKhoa, datTuKhoa] = useState('')
  const [locVaiTro, datLocVaiTro] = useState('ALL')
  const [thongBao, datThongBao] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    birthDate: '',
    roleType: 'ACTOR',
    avatarUrl: '',
    bio: '',
  })

  // Modal Xác Nhận Xóa
  const [deletingPerson, setDeletingPerson] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const taiDanhSach = async () => {
    datDangTai(true)
    try {
      const res = await apiClient.get('/admin/persons', {
        params: {
          search: tuKhoa.trim() ? tuKhoa.trim() : undefined,
          roleType: locVaiTro !== 'ALL' ? locVaiTro : undefined,
        },
      })
      datDanhSach(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error('Lỗi khi tải danh sách nghệ sĩ:', error)
      hienThongBaoLoi('Không thể tải danh sách nghệ sĩ.')
    } finally {
      datDangTai(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      taiDanhSach()
    }, 280)
    return () => clearTimeout(timer)
  }, [tuKhoa, locVaiTro])

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      id: '',
      name: '',
      birthDate: '',
      roleType: 'ACTOR',
      avatarUrl: '',
      bio: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (person) => {
    if (!person) return
    setEditingId(person.id || '')
    setFormData({
      id: person.id || '',
      name: person.name || '',
      birthDate: person.birthDate || '',
      roleType: person.roleType || 'ACTOR',
      avatarUrl: person.avatarUrl || '',
      bio: person.bio || '',
    })
    setIsModalOpen(true)
  }

  const handleAiFill = async () => {
    const ten = (formData.name || '').trim()
    if (!ten) {
      hienThongBaoLoi('Vui lòng nhập tên nghệ sĩ trước khi dùng AI!')
      return
    }

    setIsAiLoading(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const res = await apiClient.post('/admin/persons/ai-fill', null, {
        params: { name: ten },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const aiData = res.data
      if (aiData) {
        setFormData((prev) => ({
          ...prev,
          name: aiData.name || prev.name,
          birthDate: aiData.birthDate || prev.birthDate,
          roleType: aiData.roleType || prev.roleType,
          avatarUrl: aiData.avatarUrl || prev.avatarUrl,
          bio: aiData.bio || prev.bio,
        }))
        hienThongBaoThanhCong(`AI đã tra cứu thành công thông tin "${aiData.name || ten}"!`)
      }
    } catch (err) {
      console.error('Lỗi AI Tra Cứu:', err)
      hienThongBaoLoi(err?.response?.data?.message || 'Không thể tra cứu thông tin nghệ sĩ từ AI.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const ten = (formData.name || '').trim()
    if (!ten) {
      hienThongBaoLoi('Tên nghệ sĩ không được để trống.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: ten,
        birthDate: (formData.birthDate || '').trim(),
        roleType: formData.roleType || 'ACTOR',
        avatarUrl: (formData.avatarUrl || '').trim(),
        bio: (formData.bio || '').trim(),
      }

      if (editingId) {
        await apiClient.put(`/admin/persons/${editingId}`, payload)
        hienThongBaoThanhCong(`Đã cập nhật thông tin nghệ sĩ "${payload.name}"!`)
      } else {
        await apiClient.post('/admin/persons', payload)
        hienThongBaoThanhCong(`Đã thêm mới nghệ sĩ "${payload.name}"!`)
      }
      setIsModalOpen(false)
      taiDanhSach()
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu:', err)
      hienThongBaoLoi(err?.response?.data?.message || 'Lỗi khi lưu thông tin nghệ sĩ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPerson?.id) return
    setIsDeleting(true)
    try {
      await apiClient.delete(`/admin/persons/${deletingPerson.id}`)
      hienThongBaoThanhCong(`Đã xóa nghệ sĩ "${deletingPerson.name}" khỏi hệ thống!`)
      setDeletingPerson(null)
      taiDanhSach()
    } catch (err) {
      console.error('Lỗi khi xóa nghệ sĩ:', err)
      hienThongBaoLoi(err?.response?.data?.message || 'Lỗi khi xóa nghệ sĩ.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'DIRECTOR':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
            🎬 Đạo diễn
          </span>
        )
      case 'BOTH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-xs font-bold text-fuchsia-300">
            ✨ Cả hai (ĐD & DV)
          </span>
        )
      case 'ACTOR':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-300">
            🎭 Diễn viên
          </span>
        )
    }
  }

  return (
    <div>
      {/* Header Trang */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">
            Phim & Suất Chiếu
          </p>
          <h1 className="mt-1 text-3xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="text-fuchsia-400" size={32} />
            Quản Lý Diễn Viên & Đạo Diễn
          </h1>
          <p className="mt-2 text-slate-400">
            Quản lý hồ sơ nghệ sĩ, ngày sinh, tiểu sử và tự động tra cứu bằng AI thông minh
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="nut-chinh flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-600/30"
        >
          <Plus size={18} />
          + Thêm Nghệ Sĩ Mới
        </button>
      </div>

      {/* Thanh Tìm Kiếm & Tabs Phân Loại */}
      <div className="admin-glass mb-6 p-4 rounded-2xl">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Tìm theo tên nghệ sĩ hoặc tiểu sử..."
            value={tuKhoa}
            onChange={(e) => datTuKhoa(e.target.value)}
            className="o-nhap pl-11"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', nhan: 'Tất cả' },
              { id: 'ACTOR', nhan: '🎭 Diễn viên' },
              { id: 'DIRECTOR', nhan: '🎬 Đạo diễn' },
              { id: 'BOTH', nhan: '✨ Cả hai (ĐD & DV)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => datLocVaiTro(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  locVaiTro === item.id
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-900/40'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {item.nhan}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Tổng cộng: <strong className="text-fuchsia-300 font-bold">{danhSach.length}</strong> nghệ sĩ
          </p>
        </div>
      </div>

      {/* Bảng Danh Sách Nghệ Sĩ */}
      <div className="admin-glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Nghệ Sĩ</th>
                <th className="px-6 py-4">Vai Trò</th>
                <th className="px-6 py-4">Ngày Sinh</th>
                <th className="px-6 py-4">Tiểu Sử / Giới Thiệu</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dangTai ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Đang tải dữ liệu nghệ sĩ...</p>
                  </td>
                </tr>
              ) : danhSach.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không tìm thấy nghệ sĩ nào phù hợp.
                  </td>
                </tr>
              ) : (
                danhSach.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            item.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.name || 'Artist'
                            )}&background=8b5cf6&color=fff`
                          }
                          alt={item.name}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10 shadow-md shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.name || 'Artist'
                            )}&background=8b5cf6&color=fff`
                          }}
                        />
                        <div>
                          <p className="font-bold text-white text-base">{item.name}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            ID: #{item.id ? item.id.slice(-6) : '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderRoleBadge(item.roleType)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {item.birthDate || 'Chưa cập nhật'}
                    </td>
                    <td className="px-6 py-4 max-w-sm text-xs text-slate-400">
                      <p className="line-clamp-2 leading-relaxed">
                        {item.bio || 'Chưa có tiểu sử.'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-lg border border-fuchsia-400/30 p-2 text-fuchsia-200 hover:bg-fuchsia-500/10 transition"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPerson(item)}
                          className="rounded-lg border border-rose-400/30 p-2 text-rose-300 hover:bg-rose-500/10 transition"
                          title="Xóa nghệ sĩ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Mới / Chỉnh Sửa Dùng AdminModalOverlay Chuẩn */}
      {isModalOpen && (
        <AdminModalOverlay onBackdropClick={() => setIsModalOpen(false)} maxWidth="max-w-lg">
          <div className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <User className="text-fuchsia-400" size={20} />
                  {editingId ? 'Chỉnh Sửa Hồ Sơ Nghệ Sĩ' : 'Thêm Nghệ Sĩ Mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Nhập tên nghệ sĩ và bấm nút AI để tự động tra cứu ngày sinh, ảnh và tiểu sử.
              </p>
            </AdminModalHeader>

            <form onSubmit={handleSave}>
              <AdminModalBody className="space-y-4">
                {/* Tên & Nút AI Tra Cứu */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tên Diễn Viên / Đạo Diễn <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ryan Reynolds, Hugh Jackman, Lý Hải..."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="o-nhap flex-1"
                    />
                    <button
                      type="button"
                      disabled={isAiLoading || !formData.name.trim()}
                      onClick={handleAiFill}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-950/40 transition hover:brightness-110 disabled:opacity-50 shrink-0"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>AI đang tra...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>⚡ AI Tra Cứu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Vai Trò & Ngày Sinh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Vai Trò Nghệ Sĩ
                    </label>
                    <select
                      value={formData.roleType}
                      onChange={(e) =>
                        setFormData({ ...formData, roleType: e.target.value })
                      }
                      className="o-nhap"
                    >
                      <option value="ACTOR">🎭 Diễn viên</option>
                      <option value="DIRECTOR">🎬 Đạo diễn</option>
                      <option value="BOTH">✨ Cả hai (ĐD & DV)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Ngày Sinh (YYYY-MM-DD)
                    </label>
                    <input
                      type="text"
                      placeholder="1976-10-23"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="o-nhap font-mono"
                    />
                  </div>
                </div>

                {/* Link Ảnh Đại Diện */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Link Ảnh Chân Dung (Avatar URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="https://image.tmdb.org/..."
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                      className="o-nhap flex-1"
                    />
                    {formData.avatarUrl && (
                      <img
                        src={formData.avatarUrl}
                        alt="Preview"
                        className="h-10 w-10 rounded-full object-cover border-2 border-fuchsia-500 shadow-md shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Tiểu Sử Ngắn */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tiểu Sử Ngắn (1-2 câu)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt sự nghiệp, các tác phẩm nổi bật..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="o-nhap"
                  />
                </div>
              </AdminModalBody>

              <AdminModalFooter className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="nut-chinh px-6 py-2.5 text-xs font-bold shadow-lg shadow-fuchsia-600/30 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingId
                    ? 'Lưu Thay Đổi'
                    : 'Thêm Nghệ Sĩ'}
                </button>
              </AdminModalFooter>
            </form>
          </div>
        </AdminModalOverlay>
      )}

      {/* Modal Xác Nhận Xóa Dùng AdminModalOverlay Chuẩn */}
      {deletingPerson && (
        <AdminModalOverlay onBackdropClick={() => setDeletingPerson(null)} maxWidth="max-w-md">
          <div className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={22} />
                <h3 className="text-lg font-bold">Xác nhận xóa nghệ sĩ</h3>
              </div>
            </AdminModalHeader>

            <AdminModalBody>
              <p className="text-sm text-slate-300 leading-relaxed">
                Bạn có chắc muốn xóa nghệ sĩ{' '}
                <strong className="text-white font-bold">"{deletingPerson.name}"</strong> khỏi hệ
                thống?
              </p>
              <p className="mt-2 text-xs text-rose-300/80">
                ⚠️ Dữ liệu nghệ sĩ sẽ bị xóa vĩnh viễn khỏi MongoDB và không thể hoàn tác.
              </p>
            </AdminModalBody>

            <AdminModalFooter className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 shadow-lg shadow-rose-900/40 transition"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa Nghệ Sĩ'}
              </button>
            </AdminModalFooter>
          </div>
        </AdminModalOverlay>
      )}
    </div>
  )
}
