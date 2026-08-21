import axios from 'axios'

const DEFAULT_API_URL = 'https://phongg-cinema-api.onrender.com/api/v1'

function chuanHoaApiBaseUrl(raw) {
  const macDinh = DEFAULT_API_URL
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

let apiBaseUrl = DEFAULT_API_URL
try {
  apiBaseUrl = chuanHoaApiBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || DEFAULT_API_URL)
} catch (loi) {
  console.warn('[apiClient] Không chuẩn hóa được baseURL, dùng fallback Render API', loi)
  apiBaseUrl = DEFAULT_API_URL
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
