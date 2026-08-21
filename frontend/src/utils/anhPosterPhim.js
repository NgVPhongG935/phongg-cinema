import { getImageUrl, handleImageError } from './imageHelper'

/** Poster dự phòng mặc định khi ảnh lỗi hoặc trống */
export const POSTER_MAC_DINH = 'https://placehold.co/300x450?text=No+Image'

/**
 * Lấy URL poster từ object phim — hỗ trợ nhiều tên field Backend có thể trả về.
 */
export function layUrlPosterPhim(phim) {
  if (!phim || typeof phim !== 'object') return ''
  const raw = phim.posterUrl || phim.anhPoster || phim.poster || ''
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Lấy URL trực tiếp từ TMDb hoặc HTTPS ngoài mà không qua proxy.
 * Nếu là đường dẫn nội bộ thì nối với backend URL.
 */
export function urlPosterQuaProxyBackend(urlTuyetDoi) {
  return getImageUrl(urlTuyetDoi)
}

/**
 * Chuẩn hóa URL poster:
 * - TMDb / HTTPS ngoài: Dùng trực tiếp
 * - Không có ảnh: trả về fallback
 */
export function chuanHoaUrlPoster(url) {
  return getImageUrl(url)
}

/** URL hiển thị cuối cùng cho thẻ img */
export function urlPosterHienThi(phim) {
  return chuanHoaUrlPoster(layUrlPosterPhim(phim))
}

/** Xử lý onError — BẮT BUỘC: ngắt vòng lặp vô hạn */
export function xuLyLoiPoster(suKien) {
  handleImageError(suKien, POSTER_MAC_DINH)
}

export { getImageUrl, handleImageError }
export default chuanHoaUrlPoster
