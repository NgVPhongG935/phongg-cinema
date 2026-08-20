import apiClient from './apiClient'

const luuPhienDangNhap = (phanHoi) => {
  localStorage.setItem('token', phanHoi.token)
  localStorage.setItem('role', phanHoi.role)
  localStorage.setItem('hoTen', phanHoi.hoTen)
  localStorage.setItem('user', JSON.stringify({
    id: phanHoi.id,
    email: phanHoi.email,
    hoTen: phanHoi.hoTen,
    role: phanHoi.role,
    soDienThoai: phanHoi.soDienThoai,
  }))
  return phanHoi
}

const luuThongTinNguoiDung = (phanHoi) => {
  localStorage.setItem('role', phanHoi.role)
  localStorage.setItem('hoTen', phanHoi.hoTen)
  localStorage.setItem('user', JSON.stringify(phanHoi))
  return phanHoi
}

export const dangNhap = (duLieu) => apiClient.post('/auth/login', duLieu).then((phanHoi) => luuPhienDangNhap(phanHoi.data))
export const dangKy = (duLieu) => apiClient.post('/auth/register', duLieu).then((phanHoi) => luuPhienDangNhap(phanHoi.data))

// 1. Gửi mã OTP xác thực đăng ký
export const guiOtpDangKy = (duLieu) =>
  apiClient.post('/auth/register/send-otp', duLieu).then((phanHoi) => phanHoi.data)

// 2. Xác thực mã OTP và hoàn tất đăng nhập
export const xacThucOtpDangKy = (duLieu) =>
  apiClient.post('/auth/register/verify-otp', duLieu).then((phanHoi) => luuPhienDangNhap(phanHoi.data))

export const sendRegisterOtp = guiOtpDangKy
export const verifyRegisterOtp = xacThucOtpDangKy
export const login = dangNhap
export const register = dangKy

export const dangNhapGoogle = (token) => apiClient.post('/auth/google', { token }).then((phanHoi) => luuPhienDangNhap(phanHoi.data))
export const dangXuat = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('hoTen')
  localStorage.removeItem('user')
}

export const layThongTinCaNhan = () => {
  const email = JSON.parse(localStorage.getItem('user') || 'null')?.email
  return apiClient.get('/auth/me', { params: { email } }).then((phanHoi) => phanHoi.data)
}

export const capNhatProfile = (duLieu) =>
  apiClient.put('/auth/profile', duLieu).then((phanHoi) => luuThongTinNguoiDung(phanHoi.data))

export const doiMatKhau = (duLieu) => apiClient.put('/auth/change-password', duLieu)

export { luuPhienDangNhap }
