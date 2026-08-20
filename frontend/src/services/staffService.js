import apiClient from './apiClient'

export const layDanhSachNhanVien = () =>
  apiClient.get('/staffs').then((phanHoi) => phanHoi.data)

export const themNhanVien = (duLieu) =>
  apiClient.post('/staffs', duLieu).then((phanHoi) => phanHoi.data)

export const capNhatRapNhanVien = (id, maRapPhuTrach) =>
  apiClient.put(`/staffs/${id}/cinema`, { maRapPhuTrach }).then((phanHoi) => phanHoi.data)

export const datLaiMatKhauNhanVien = (id, matKhauMoi) =>
  apiClient.put(`/staffs/${id}/reset-password`, { matKhauMoi })

export const capNhatTrangThaiNhanVien = (id, biKhoa) =>
  apiClient.put(`/staffs/${id}/status`, { biKhoa }).then((phanHoi) => phanHoi.data)
