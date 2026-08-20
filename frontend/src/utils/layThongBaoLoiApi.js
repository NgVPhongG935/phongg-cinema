export const layThongBaoLoiApi = (loi) => {
  const status = loi?.response?.status
  const duLieu = loi?.response?.data
  let msg = ''
  if (!duLieu) {
    if (loi?.code === 'ERR_NETWORK' || loi?.message === 'Network Error') {
      return 'Không kết nối được backend. Hãy chạy start-backend.cmd và thử lại.'
    }
    if (status === 403) return 'Không có quyền thực hiện thao tác này.'
    if (status === 401) return 'Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.'
    if (status === 404) return 'API backend chưa cập nhật. Chạy stop-backend.cmd rồi start-backend.cmd.'
    msg = loi?.message || 'Không kết nối được backend. Hãy chạy start-backend.cmd và thử lại.'
  } else if (typeof duLieu === 'string') msg = duLieu
  else msg = duLieu.message || duLieu.detail || duLieu.error || 'Đã xảy ra lỗi'
  if (msg === 'Not Found' || msg === 'Request failed with status code 404') {
    return 'API backend chưa cập nhật. Chạy stop-backend.cmd rồi start-backend.cmd.'
  }
  if (status === 403 && (!msg || msg === 'Forbidden' || msg === 'Access Denied')) {
    return 'Cần đăng nhập tài khoản Admin để thao tác.'
  }
  if (/quota|rate limit|429|resource exhausted/i.test(msg))
    return msg.length > 220 ? msg.slice(0, 220) + '…' : msg
  if (msg.length > 300) return msg.slice(0, 300) + '…'
  return msg
}

export const layThongBaoLoiAuth = (loi, macDinh = 'Đăng nhập không thành công') => {
  const msg = loi?.response?.data?.message
  if (msg) return msg
  if (loi?.code === 'ERR_NETWORK' || loi?.message === 'Network Error') {
    return 'Không kết nối được backend. Hãy chạy start-backend.cmd và thử lại.'
  }
  return layThongBaoLoiApi(loi) || macDinh
}
