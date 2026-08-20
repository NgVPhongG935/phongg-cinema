import apiClient from './apiClient'

/**
 * Xuất bản sao lưu dữ liệu toàn bộ hệ thống dưới dạng file .json
 */
export const exportBackup = async () => {
  try {
    const response = await apiClient.get('/admin/backup/export', {
      responseType: 'blob', // Bắt buộc để tải file binary/json
    })

    // Lấy filename từ content-disposition nếu có hoặc đặt tên mặc định
    let filename = `phongg_cinema_backup_${new Date().toISOString().slice(0, 10)}.json`
    const disposition = response.headers?.['content-disposition']
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    // Tạo URL ảo để trình duyệt tự tải file về máy
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        const json = JSON.parse(text)
        if (json.message) {
          error.message = json.message
        }
      } catch {
        // ignore
      }
    }
    throw error
  }
}

/**
 * Phục hồi dữ liệu từ file .json được tải lên
 */
export const restoreBackup = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/admin/backup/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

