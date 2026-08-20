import axios from 'axios'

function chuanHoaApiBaseUrl(raw) {
  const macDinh = '/api/v1'
  if (!raw || typeof raw !== 'string') return macDinh
  let url = raw.trim()
  if (!url) return macDinh

  if (url.startsWith('/')) {
    return url.replace(/\/+$/, '') || macDinh
  }

  url = url.replace(/\/+$/, '')
  if (url.endsWith('/api/v1')) return url
  if (url.endsWith('/api')) return `${url}/v1`
  if (!url.includes('/api/v1')) return `${url}/api/v1`
  return url
}

let apiBaseUrl = '/api/v1'
try {
  apiBaseUrl = chuanHoaApiBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL)
} catch (loi) {
  console.warn('[apiClient] Không chuẩn hóa được baseURL, dùng /api/v1', loi)
  apiBaseUrl = '/api/v1'
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
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

export { apiBaseUrl, chuanHoaApiBaseUrl }
export default apiClient
