import axios from 'axios'

const PROD_RENDER_API_URL = 'https://phongg-cinema-api.onrender.com/api/v1'

function chuanHoaApiBaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return '/api/v1'
  let url = raw.trim()
  if (!url) return '/api/v1'

  if (url.startsWith('/')) {
    return url.replace(/\/+$/, '') || '/api/v1'
  }

  url = url.replace(/\/+$/, '')
  if (url.endsWith('/api/v1')) return url
  if (url.endsWith('/api')) return `${url}/v1`
  if (!url.includes('/api/v1')) return `${url}/api/v1`
  return url
}

function layApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL
  if (envUrl && envUrl.trim()) {
    return chuanHoaApiBaseUrl(envUrl)
  }

  // Đang chạy trên môi trường dev cục bộ
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api/v1'
    }
  }

  // Chạy trên Render / Production
  return PROD_RENDER_API_URL
}

let apiBaseUrl = '/api/v1'
try {
  apiBaseUrl = layApiBaseUrl()
} catch (loi) {
  console.warn('[apiClient] Không xác định được baseURL, dùng /api/v1', loi)
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
