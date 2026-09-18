const PREFIX = 'phongg-home-v1:'
const MAX_AGE_MS = 6 * 60 * 60 * 1000

function cacheKey(params) {
  return `${PREFIX}${params.trangThai || 'ALL'}:${params.page || 0}:${params.size || 20}:${params.tuKhoa || ''}`
}

export function docCacheTrangChu(params) {
  try {
    const raw = localStorage.getItem(cacheKey(params))
    if (!raw) return undefined
    const cached = JSON.parse(raw)
    if (!cached?.savedAt || Date.now() - cached.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(cacheKey(params))
      return undefined
    }
    return cached.data
  } catch {
    return undefined
  }
}

export function luuCacheTrangChu(params, data) {
  try {
    localStorage.setItem(cacheKey(params), JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // Storage có thể bị chặn hoặc đầy; ứng dụng vẫn dùng dữ liệu mạng bình thường.
  }
  return data
}
