import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://phongg-cinema-api.onrender.com'

const apiClient = axios.create({
  baseURL: BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

apiClient.interceptors.request.use((cauHinh) => {
  cauHinh.headers['ngrok-skip-browser-warning'] = 'true'
  const maTruyCap = localStorage.getItem('token') || localStorage.getItem('accessToken')
  if (maTruyCap) cauHinh.headers.Authorization = `Bearer ${maTruyCap}`
  return cauHinh
})

apiClient.interceptors.response.use(
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

const axiosClient = apiClient

export { BASE_URL, axiosClient }
export default apiClient

