import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://phongg-cinema-api.onrender.com/api/v1'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

axiosClient.interceptors.request.use((cauHinh) => {
  cauHinh.headers['ngrok-skip-browser-warning'] = 'true'
  const maTruyCap = localStorage.getItem('token') || localStorage.getItem('accessToken')
  if (maTruyCap) cauHinh.headers.Authorization = `Bearer ${maTruyCap}`
  return cauHinh
})

axiosClient.interceptors.response.use(
  (phanHoi) => phanHoi,
  (loi) => {
    if (loi.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      localStorage.removeItem('hoTen')
      window.dispatchEvent(new Event('unauthenticated'))
    }
    return Promise.reject(loi)
  },
)

const apiClient = axiosClient

export { BASE_URL, axiosClient, apiClient }
export default axiosClient


