/** Thông báo lỗi thân thiện cho đăng nhập Google Identity Services */
export function layThongBaoLoiGoogle(loi, { origin = window.location.origin } = {}) {
  const chuoi = String(loi?.message || loi || '').toLowerCase()

  if (/origin is not allowed|not allowed for the given client|403/.test(chuoi)) {
    return `Domain "${origin}" chưa được thêm vào Authorized JavaScript origins trên Google Cloud Console. Hãy thêm URL frontend (ví dụ Ngrok) rồi đợi 1–5 phút.`
  }
  if (/popup_closed|popup closed|user closed|cancel/.test(chuoi)) {
    return 'Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.'
  }
  if (/network|failed to fetch|err_network|timeout/.test(chuoi)) {
    return 'Mất kết nối mạng. Kiểm tra Internet hoặc thử lại sau.'
  }
  if (/invalid|credential|token/.test(chuoi)) {
    return 'Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.'
  }

  return 'Đăng nhập Google không thành công. Vui lòng thử lại sau.'
}

export function laDomainNgrok() {
  return /ngrok-free\.dev|ngrok\.io|ngrok\.app/i.test(window.location.hostname)
}
