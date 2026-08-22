import apiClient from './apiClient'

const luuPhienDangNhap = (duLieu) => {
  if (duLieu?.token) {
    localStorage.setItem('token', duLieu.token)
    localStorage.setItem('role', duLieu.role)
    localStorage.setItem('hoTen', duLieu.hoTen)
  }
  return duLieu
}

export const dangNhap = (duLieu) =>
  apiClient.post('/auth/login', duLieu).then((phanHoi) => luuPhienDangNhap(phanHoi.data))

export const dangKy = (duLieu) =>
  apiClient.post('/auth/register', duLieu).then((phanHoi) => luuPhienDangNhap(phanHoi.data))

export const dangNhapGoogle = (idToken) =>
  apiClient.post('/auth/google', { token: idToken }).then((phanHoi) => luuPhienDangNhap(phanHoi.data))

export const layThongTinMe = () => apiClient.get('/auth/me').then((phanHoi) => phanHoi.data)
export const layThongTinCaNhan = layThongTinMe

export const capNhatProfile = (duLieu) =>
  apiClient.put('/auth/profile', duLieu).then((phanHoi) => phanHoi.data)

export const doiMatKhau = (duLieu) => apiClient.post('/auth/change-password', duLieu)

export const dangXuat = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('hoTen')
  localStorage.removeItem('user')
}

export const register = dangKy
export const login = dangNhap
export const logout = dangXuat
export const googleLogin = dangNhapGoogle
