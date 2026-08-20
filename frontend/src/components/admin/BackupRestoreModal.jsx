import { AlertTriangle, CheckCircle2, Database, Download, RefreshCw, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { exportBackup, restoreBackup } from '../../services/backupService'
import { hienThongBaoLoi, hienThongBaoThanhCong } from '../../utils/hienThongBao'
import { layThongBaoLoiApi } from '../../utils/layThongBaoLoiApi'
import AdminModalOverlay, { AdminModalBody, AdminModalFooter, AdminModalHeader } from './AdminModalOverlay'

export default function BackupRestoreModal() {
  const [dangXuat, datDangXuat] = useState(false)
  const [dangKhoiPhuc, datDangKhoiPhuc] = useState(false)
  const [fileDaChon, datFileDaChon] = useState(null)
  const [hienModalXacNhan, datHienModalXacNhan] = useState(false)
  const [thongBao, datThongBao] = useState(null)
  const fileInputRef = useRef(null)

  // 1. Thao tác Xuất Backup
  const xuLyExport = async () => {
    datDangXuat(true)
    datThongBao(null)
    try {
      const res = await exportBackup()
      const msg = `🎉 Sao lưu thành công! File "${res.filename}" đã được tải về máy.`
      datThongBao({ loai: 'success', noiDung: msg })
      hienThongBaoThanhCong(msg)
    } catch (loi) {
      const msg = layThongBaoLoiApi(loi, 'Không thể xuất file sao lưu. Vui lòng kiểm tra lại Backend!')
      datThongBao({ loai: 'error', noiDung: msg })
      hienThongBaoLoi(msg)
    } finally {
      datDangXuat(false)
    }
  }

  // 2. Thao tác Chọn file Phục hồi
  const xuLyChonFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    datFileDaChon(file)
    datHienModalXacNhan(true)
    e.target.value = ''
  }

  // 3. Thực hiện Phục hồi sau khi xác nhận
  const xuLyKhoiPhuc = async () => {
    if (!fileDaChon) return
    datDangKhoiPhuc(true)
    datThongBao(null)
    try {
      await restoreBackup(fileDaChon)
      datHienModalXacNhan(false)
      const msg = '🎉 Đã khôi phục toàn bộ dữ liệu thành công! Đang tải lại hệ thống...'
      datThongBao({ loai: 'success', noiDung: msg })
      hienThongBaoThanhCong(msg)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (loi) {
      datHienModalXacNhan(false)
      const msg = layThongBaoLoiApi(loi, 'Không thể khôi phục dữ liệu từ file này.')
      datThongBao({ loai: 'error', noiDung: msg })
      hienThongBaoLoi(msg)
    } finally {
      datDangKhoiPhuc(false)
      datFileDaChon(null)
    }
  }

  return (
    <>
      {/* Nút thao tác nhanh trên Header / Topbar */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={xuLyChonFile}
          className="hidden"
        />

        {/* Nút Sao lưu */}
        <button
          type="button"
          onClick={xuLyExport}
          disabled={dangXuat || dangKhoiPhuc}
          title="Xuất file JSON sao lưu toàn bộ dữ liệu MongoDB"
          className="flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-600/20 px-3.5 py-2 text-xs font-bold text-fuchsia-200 backdrop-blur-md transition-all hover:bg-fuchsia-600/30 hover:text-white shadow-sm disabled:opacity-50"
        >
          {dangXuat ? (
            <RefreshCw size={15} className="animate-spin text-fuchsia-300" />
          ) : (
            <Download size={15} className="text-fuchsia-300" />
          )}
          <span className="hidden sm:inline">Sao Lưu Dữ Liệu</span>
          <span className="sm:hidden">Sao lưu</span>
        </button>

        {/* Nút Phục hồi */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={dangXuat || dangKhoiPhuc}
          title="Nhập file JSON để khôi phục lại dữ liệu hệ thống"
          className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-600/20 px-3.5 py-2 text-xs font-bold text-sky-200 backdrop-blur-md transition-all hover:bg-sky-600/30 hover:text-white shadow-sm disabled:opacity-50"
        >
          {dangKhoiPhuc ? (
            <RefreshCw size={15} className="animate-spin text-sky-300" />
          ) : (
            <Upload size={15} className="text-sky-300" />
          )}
          <span className="hidden sm:inline">Phục Hồi Dữ Liệu</span>
          <span className="sm:hidden">Phục hồi</span>
        </button>
      </div>

      {/* Toast thông báo nổi bật z-index 99999 ở top: 24px, right: 24px */}
      {thongBao && (
        <div
          style={{ zIndex: 99999, top: '24px', right: '24px' }}
          className="fixed z-[99999] max-w-md animate-fade-in-down"
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              thongBao.loai === 'success'
                ? 'border-emerald-400/50 bg-emerald-950/95 text-emerald-100 shadow-emerald-950/60 ring-1 ring-emerald-400/30'
                : 'border-rose-400/50 bg-rose-950/95 text-rose-100 shadow-rose-950/60 ring-1 ring-rose-400/30'
            }`}
          >
            {thongBao.loai === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1 text-xs leading-relaxed font-medium">
              {thongBao.noiDung}
            </div>
            <button
              type="button"
              onClick={() => datThongBao(null)}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Phục hồi dữ liệu */}
      {hienModalXacNhan && fileDaChon && (
        <AdminModalOverlay onBackdropClick={() => !dangKhoiPhuc && datHienModalXacNhan(false)} maxWidth="max-w-lg">
          <div className="admin-modal-panel">
            <AdminModalHeader>
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold text-white">Xác nhận khôi phục dữ liệu</h3>
              </div>
            </AdminModalHeader>
            <AdminModalBody className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Bạn đang chuẩn bị nạp file sao lưu:
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                <p className="font-semibold text-fuchsia-300 break-all">{fileDaChon.name}</p>
                <p className="mt-1 text-slate-400">Kích thước: {(fileDaChon.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 leading-relaxed">
                ⚠️ <strong>Cảnh báo quan trọng:</strong> Hành động này sẽ <strong>ghi đè toàn bộ dữ liệu hiện tại</strong> trong MongoDB (phim, rạp, suất chiếu, người dùng, vé) bằng dữ liệu trong file sao lưu.
              </div>
            </AdminModalBody>
            <AdminModalFooter className="flex gap-3">
              <button
                type="button"
                disabled={dangKhoiPhuc}
                onClick={() => datHienModalXacNhan(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={dangKhoiPhuc}
                onClick={xuLyKhoiPhuc}
                className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-2.5 text-sm font-bold text-white hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 transition shadow-lg shadow-sky-900/40"
              >
                {dangKhoiPhuc ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}
              </button>
            </AdminModalFooter>
          </div>
        </AdminModalOverlay>
      )}
    </>
  )
}
