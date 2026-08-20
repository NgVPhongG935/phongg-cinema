import apiClient from './apiClient'

export const layDanhSachRap = (khuVuc) => apiClient.get('/cinemas', { params: khuVuc ? { khuVuc } : {} }).then((phanHoi) => phanHoi.data)
export const layChiTietRap = (id) => apiClient.get(`/cinemas/${id}`).then((phanHoi) => phanHoi.data)
export const themRapMoi = (duLieu) => apiClient.post('/cinemas/admin', duLieu).then((phanHoi) => phanHoi.data)
export const capNhatRap = (id, duLieu) => apiClient.put(`/cinemas/admin/${id}`, duLieu).then((phanHoi) => phanHoi.data)
export const layDanhSachPhong = (maRap) => apiClient.get(`/cinemas/${maRap}/rooms`).then((phanHoi) => phanHoi.data)
export const themPhong = (maRap, duLieu) => apiClient.post(`/cinemas/${maRap}/rooms/admin`, duLieu).then((phanHoi) => phanHoi.data)
export const capNhatPhong = (maRap, maPhong, duLieu) => apiClient.put(`/cinemas/${maRap}/rooms/admin/${maPhong}`, duLieu).then((phanHoi) => phanHoi.data)
export const xoaPhong = (maRap, maPhong) => apiClient.delete(`/cinemas/${maRap}/rooms/admin/${maPhong}`)
export const laySoDoGhePhong = (maRap, maPhong) => apiClient.get(`/cinemas/${maRap}/rooms/${maPhong}/seats`).then((phanHoi) => phanHoi.data)
export const capNhatSoDoGhe = (maRap, maPhong, danhSachGhe) => apiClient.put(`/cinemas/${maRap}/rooms/admin/${maPhong}/seats`, danhSachGhe).then((phanHoi) => phanHoi.data)

export const taoMuoiPhongMacDinh = () => Array.from({ length: 10 }, (_, i) => {
  const so = String(i + 1).padStart(2, '0')
  return { maPhong: `P${so}`, tenPhong: `Phòng ${so}` }
})
