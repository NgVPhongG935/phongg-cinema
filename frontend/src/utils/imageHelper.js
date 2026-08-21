/**
 * Tiện ích xử lý URL hình ảnh (TMDb, HTTPS trực tiếp, proxy và fallback)
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return 'https://placehold.co/300x450?text=No+Image'
  const s = url.trim()
  if (!s) return 'https://placehold.co/300x450?text=No+Image'
  // Nếu là link TMDb hoặc link HTTPS ngoài, dùng trực tiếp (không qua proxy)
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s
  }
  // Nếu là đường dẫn cục bộ hoặc cần qua backend API
  return `https://phongg-cinema-api.onrender.com/api/v1/media/proxy?url=${encodeURIComponent(s)}`
}

/**
 * Hàm xử lý onError chuẩn chặn lặp vô hạn
 */
export const handleImageError = (e, fallback = 'https://placehold.co/300x450?text=No+Image') => {
  if (!e || !e.currentTarget) return
  e.currentTarget.onerror = null // BẮT BUỘC: Ngắt vòng lặp vô hạn
  e.currentTarget.src = fallback
}

export default getImageUrl
