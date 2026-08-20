/**
 * Trích xuất 11 ký tự Video ID từ mọi định dạng link YouTube
 * Hỗ trợ:
 * - https://www.youtube.com/watch?v=VIDEO_ID (kèm &si=..., &t=..., ?feature=shared)
 * - https://youtu.be/VIDEO_ID?si=...
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - Chuỗi 11 ký tự Video ID thuần
 */
export function layVideoIdYoutube(duongDan) {
  if (!duongDan || typeof duongDan !== 'string') return null
  const s = duongDan.trim().replace(/&amp;/g, '&')

  // 1. youtu.be/VIDEO_ID hoặc youtube.com/shorts/VIDEO_ID
  const khopShort = s.match(/(?:youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i)
  if (khopShort) return khopShort[1]

  // 2. watch?v=VIDEO_ID hoặc ?v=VIDEO_ID hoặc &v=VIDEO_ID
  const khopWatch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/i)
  if (khopWatch) return khopWatch[1]

  // 3. embed/VIDEO_ID hoặc /v/VIDEO_ID hoặc /e/VIDEO_ID
  const khopEmbed = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed|v|e)\/)([a-zA-Z0-9_-]{11})/i)
  if (khopEmbed) return khopEmbed[1]

  // 4. Nếu là chuỗi 11 ký tự video ID thuần
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s

  return null
}

/**
 * Tạo URL nhúng youtube-nocookie phát trực tiếp trên web không bị chặn cookie:
 * https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1
 */
export function getYouTubeEmbedUrl(duongDan, tuDongPhat = true) {
  if (!duongDan || typeof duongDan !== 'string') return null
  const videoId = layVideoIdYoutube(duongDan)
  if (!videoId) return null

  const params = tuDongPhat
    ? 'autoplay=1&rel=0&enablejsapi=1'
    : 'rel=0&enablejsapi=1'
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

/** Alias hàm tương thích ngược */
export const chuyenLinkYoutubeEmbed = getYouTubeEmbedUrl
